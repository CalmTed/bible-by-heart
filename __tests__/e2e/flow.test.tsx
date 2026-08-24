/**
 * 8.1.16a — end-to-end flow guard, the release guard before the first store push
 * in a year: create state -> add passages -> generate tests -> answer with errors
 * -> finish -> stats correct -> error counts never rendered.
 *
 * The loop itself is driven PURELY (reducer + test generators + getStats, no
 * screens): the whole UI is rewritten in 0.3.0, so a screen-driven e2e would
 * break constantly, while the reducer/generator/stats contract is what actually
 * has to survive the release.
 *
 * The philosophy rule it guards (ARCHITECTURE §2.2 — errors are recorded in full
 * but their COUNT is never shown) gets its own targeted assertion at the bottom:
 * the surfaces that are fed error counts are rendered against the state the pure
 * loop produced, and every error-derived number is asserted absent from the
 * rendered text.
 *
 * Time is faked so the five sessions land on five consecutive local days and
 * every answer takes exactly ANSWER_MS — that makes the duration/stroke stats
 * exact instead of "greater than zero". Real timers are restored before any
 * rendering happens.
 */
import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  DAY,
  LANGCODE,
  PASSAGELEVEL,
  PERFECT_TESTS_TO_PROCEED,
  TESTLEVEL
} from "../../src/constants";
import { createAppState, createPassage } from "../../src/initials";
import { createT } from "../../src/l10n";
import {
  ActionModel,
  ActionName,
  AddressType,
  AppStateModel,
  TestModel
} from "../../src/models";
import { reduce } from "../../src/utils/reduce";
import {
  getAppStats,
  getMaxStroke,
  getStroke,
  getWeeklyStats
} from "../../src/utils/getStats";
import {
  makeContextValue,
  renderWithContext
} from "../../test-utils/renderWithContext";
import { FinishScreen } from "../../src/screens/finishScreen";
import { StatsScreen } from "../../src/screens/statsScreen";
import { WeekActivityComponent } from "../../src/components/weekActivityComponent";
import type { ScreenModel } from "../../src/screens/homeScreen";

const DAY_MS = DAY * 1000;
/** how many training sessions the flow plays */
const SESSION_COUNT = 5;
/** every answer takes exactly this long, so durations are exact */
const ANSWER_MS = 4000;
/** errors made on the first passage during the first session */
const ERRORS_IN_FIRST_SESSION = 2;
/** ESV, id 1 — see getDefaultTranslations */
const ESV_TRANSLATION_ID = 1;

const t = createT(LANGCODE.en);

const PASSAGE_SEEDS: { address: AddressType; text: string }[] = [
  {
    // John 3:16-17 (chapter/verse are zero based indexes)
    address: {
      bookIndex: 42,
      startChapterNum: 2,
      startVerseNum: 15,
      endChapterNum: 2,
      endVerseNum: 16
    },
    text: "For God so loved the world, that he gave his only Son. Whoever believes in him should not perish but have eternal life. God did not send his Son into the world to condemn the world."
  },
  {
    // Psalm 23:1-3
    address: {
      bookIndex: 18,
      startChapterNum: 22,
      startVerseNum: 0,
      endChapterNum: 22,
      endVerseNum: 2
    },
    text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters."
  },
  {
    // Matthew 5:3-4
    address: {
      bookIndex: 39,
      startChapterNum: 4,
      startVerseNum: 2,
      endChapterNum: 4,
      endVerseNum: 3
    },
    text: "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they shall be comforted."
  },
  {
    // Romans 8:1-2
    address: {
      bookIndex: 44,
      startChapterNum: 7,
      startVerseNum: 0,
      endChapterNum: 7,
      endVerseNum: 1
    },
    text: "There is therefore now no condemnation for those who are in Christ Jesus. The law of the Spirit of life has set you free from the law of sin and death."
  },
  {
    // Philippians 4:6-7
    address: {
      bookIndex: 49,
      startChapterNum: 3,
      startVerseNum: 5,
      endChapterNum: 3,
      endVerseNum: 6
    },
    text: "Do not be anxious about anything, but in everything by prayer let your requests be made known to God. The peace of God will guard your hearts and your minds."
  }
];

/** an address the user could plausibly have picked by mistake (Romans 8:3-4) */
const WRONG_ADDRESS: AddressType = {
  bookIndex: 44,
  startChapterNum: 7,
  startVerseNum: 2,
  endChapterNum: 7,
  endVerseNum: 3
};

const apply = (state: AppStateModel, action: ActionModel): AppStateModel => {
  const nextState = reduce(state, action);
  if (!nextState) {
    throw new Error(`reducer returned null for action ${action.name}`);
  }
  return nextState;
};

/**
 * testsScreen hands the level component a test with an open try appended; the
 * reducer closes that try when the answer is submitted. Mirrored here so the
 * history the flow produces has the same shape the app writes.
 */
const openTry = (test: TestModel): TestModel => ({
  ...test,
  td: [...test.td, [new Date().getTime()]]
});

/** L10.handleErrorSubmit — a wrong address option was picked */
const wrongAddressAnswer = (test: TestModel): TestModel => ({
  ...openTry(test),
  en: (test.en || 0) + 1,
  et: [...test.et, "wrongAddressToVerse"],
  wa: [...test.wa, WRONG_ADDRESS]
});

/** L50.handleTextSubmit — the user ran out of tries on a word */
const wrongWordAnswer = (test: TestModel): TestModel => ({
  ...openTry(test),
  en: (test.en || 0) + 1,
  et: [...test.et, "wrongWord"],
  ww: [...test.ww, [1, "loved"]]
});

interface SessionResult {
  afterGenerating: AppStateModel;
  generatedTests: TestModel[];
  afterFinishing: AppStateModel;
}

/**
 * Plays one whole session the way testsScreen.handleTestSubmit does: wrong
 * answers go through updateTest, right answers through updateTest until the last
 * unfinished one, which commits the session with finishTesting.
 */
const playSession = (
  startState: AppStateModel,
  errorsByPassageId: Map<number, number>
): SessionResult => {
  const afterGenerating = apply(startState, { name: ActionName.generateTests });
  const generatedTests = afterGenerating.testsActive;
  const errorsLeft = new Map(errorsByPassageId);
  let state = afterGenerating;
  let guard = 0;
  while (state.testsActive.some((test) => !test.f)) {
    guard += 1;
    if (guard > 100) {
      throw new Error("the training loop did not converge");
    }
    const currentTest = state.testsActive.find((test) => !test.f);
    if (!currentTest) {
      break;
    }
    const errorsOwed = errorsLeft.get(currentTest.pi) || 0;
    if (errorsOwed > 0) {
      errorsLeft.set(currentTest.pi, errorsOwed - 1);
      const answeredTest =
        errorsOwed === 1
          ? wrongWordAnswer(currentTest)
          : wrongAddressAnswer(currentTest);
      jest.advanceTimersByTime(ANSWER_MS);
      state = apply(state, {
        name: ActionName.updateTest,
        payload: { test: answeredTest, isRight: false }
      });
      continue;
    }
    const isLastUnfinished =
      state.testsActive.filter((test) => !test.f).length === 1;
    const answeredTest = openTry(currentTest);
    jest.advanceTimersByTime(ANSWER_MS);
    if (isLastUnfinished) {
      state = apply(state, {
        name: ActionName.finishTesting,
        payload: {
          tests: state.testsActive.map((test) =>
            test.i === answeredTest.i ? answeredTest : test
          )
        }
      });
    } else {
      state = apply(state, {
        name: ActionName.updateTest,
        payload: { test: answeredTest, isRight: true }
      });
    }
  }
  return { afterGenerating, generatedTests, afterFinishing: state };
};

interface FlowResult {
  fresh: AppStateModel;
  afterAdding: AppStateModel;
  sessions: SessionResult[];
  final: AppStateModel;
  erroredPassageId: number;
  strokeAfterFlow: ReturnType<typeof getStroke>;
}

/** the whole loop, start to finish, on five consecutive days */
const runFlow = (): FlowResult => {
  const firstDay = new Date();
  firstDay.setHours(9, 0, 0, 0);
  // never train in the future, whatever time of day the suite runs at
  const anchor =
    firstDay.getTime() > new Date().getTime()
      ? firstDay.getTime() - DAY_MS
      : firstDay.getTime();
  const firstSessionTime = anchor - (SESSION_COUNT - 1) * DAY_MS;
  jest.useFakeTimers();
  try {
    jest.setSystemTime(firstSessionTime);
    // 1. a brand new install
    const fresh = createAppState();
    // 2. the user adds passages (PassageEditor dispatches setPassage per passage)
    let state = fresh;
    PASSAGE_SEEDS.forEach((seed) => {
      state = apply(state, {
        name: ActionName.setPassage,
        payload: createPassage(seed.address, seed.text, ESV_TRANSLATION_ID)
      });
    });
    const afterAdding = state;
    const erroredPassageId = afterAdding.passages[0].id;
    // 3-5. one session per day; only the first one is answered with errors
    const sessions: SessionResult[] = [];
    for (let sessionIndex = 0; sessionIndex < SESSION_COUNT; sessionIndex++) {
      jest.setSystemTime(firstSessionTime + sessionIndex * DAY_MS);
      const session = playSession(
        state,
        sessionIndex === 0
          ? new Map([[erroredPassageId, ERRORS_IN_FIRST_SESSION]])
          : new Map()
      );
      sessions.push(session);
      state = session.afterFinishing;
    }
    // read the stroke while the clock is still the flow's clock
    const strokeAfterFlow = getStroke(state.testsHistory);
    return {
      fresh,
      afterAdding,
      sessions,
      final: state,
      erroredPassageId,
      strokeAfterFlow
    };
  } finally {
    jest.useRealTimers();
  }
};

/** every string a rendered tree actually shows the user */
const collectRenderedText = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectRenderedText(child));
  }
  if (typeof node === "object" && node !== null && "children" in node) {
    return collectRenderedText(node.children);
  }
  return [];
};

const navigationStub = {
  navigate: () => {},
  goBack: () => {},
  addListener: () => () => {}
} as unknown as ScreenModel["navigation"];

// SafeAreaProvider renders nothing until it knows the insets, so tests must hand
// it metrics or every assertion below would pass against an empty tree.
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

describe("end-to-end learning flow (8.1.16a)", () => {
  it("creates a state, adds passages, generates and answers tests with errors, finishes and reports correct stats", () => {
    const flow = runFlow();

    // --- phase 1: a fresh state ------------------------------------------
    expect(flow.fresh.passages).toHaveLength(0);
    expect(flow.fresh.testsActive).toHaveLength(0);
    expect(flow.fresh.testsHistory).toHaveLength(0);

    // --- phase 2: passages added -----------------------------------------
    expect(flow.afterAdding.passages).toHaveLength(PASSAGE_SEEDS.length);
    expect(flow.afterAdding.passages[0].versesNumber).toBe(2); //John 3:16-17
    expect(
      flow.afterAdding.passages.every(
        (passage) =>
          passage.selectedLevel === PASSAGELEVEL.l1 &&
          passage.maxLevel === PASSAGELEVEL.l1
      )
    ).toBe(true);

    // --- phase 3: tests generated ----------------------------------------
    const firstSession = flow.sessions[0];
    expect(firstSession.generatedTests).toHaveLength(PASSAGE_SEEDS.length);
    // one test per passage, all in one session, every one a real level 1 test
    expect(
      new Set(firstSession.generatedTests.map((test) => test.pi)).size
    ).toBe(PASSAGE_SEEDS.length);
    expect(
      new Set(firstSession.generatedTests.map((test) => test.si)).size
    ).toBe(1);
    firstSession.generatedTests.forEach((test) => {
      expect([TESTLEVEL.l10, TESTLEVEL.l11]).toContain(test.l);
      expect(test.f).toBe(false);
      expect(test.en).toBeNull();
      // the generator filled the test data in (options for l10, passages for l11)
      expect(
        (test.d.addressOptions?.length || 0) +
          (test.d.passagesOptions?.length || 0)
      ).toBeGreaterThan(0);
    });

    // --- phase 4: answered, with errors, and finished ---------------------
    const afterFirstSession = firstSession.afterFinishing;
    expect(afterFirstSession.testsActive).toHaveLength(0);
    expect(afterFirstSession.testsHistory).toHaveLength(PASSAGE_SEEDS.length);
    // errors ARE recorded — in full detail — they drive scheduling/difficulty
    const erroredTest = afterFirstSession.testsHistory.find(
      (test) => test.pi === flow.erroredPassageId
    );
    expect(erroredTest?.en).toBe(ERRORS_IN_FIRST_SESSION);
    expect(erroredTest?.et).toEqual(["wrongAddressToVerse", "wrongWord"]);
    expect(erroredTest?.wa).toEqual([WRONG_ADDRESS]);
    expect(erroredTest?.ww).toEqual([[1, "loved"]]);
    // the failed tries are kept too: two wrong answers + the right one
    expect(erroredTest?.td).toHaveLength(ERRORS_IN_FIRST_SESSION + 1);
    afterFirstSession.testsHistory.forEach((test) => {
      expect(test.f).toBe(true);
      expect(test.d).toEqual({}); //test data is dropped once finished
      test.td.forEach((duration) => {
        expect(duration).toHaveLength(2); //every try is closed
        expect(duration[1] - duration[0]).toBe(ANSWER_MS);
      });
    });
    // one session is nowhere near enough to level up
    expect(
      afterFirstSession.passages.every(
        (passage) =>
          passage.maxLevel === PASSAGELEVEL.l1 && !passage.isNewLevelAwalible
      )
    ).toBe(true);
    expect(
      afterFirstSession.passages.every((passage) => passage.dateTested > 0)
    ).toBe(true);

    // --- phase 5: five sessions in, the errors changed the outcome --------
    const finalState = flow.final;
    expect(finalState.testsActive).toHaveLength(0);
    expect(finalState.testsHistory).toHaveLength(
      SESSION_COUNT * PASSAGE_SEEDS.length
    );
    const erroredPassage = finalState.passages.find(
      (passage) => passage.id === flow.erroredPassageId
    );
    const cleanPassages = finalState.passages.filter(
      (passage) => passage.id !== flow.erroredPassageId
    );
    // PERFECT_TESTS_TO_PROCEED perfect tests are not enough, one more is:
    // the clean passages made it, the one with errors is exactly one behind
    expect(cleanPassages).toHaveLength(PASSAGE_SEEDS.length - 1);
    cleanPassages.forEach((passage) => {
      expect(passage.maxLevel).toBe(PASSAGELEVEL.l2);
      expect(passage.isNewLevelAwalible).toBe(true);
      expect(passage.upgradeDates[PASSAGELEVEL.l2]).toBeGreaterThan(0);
      // autoIncreaseLevel is off by default: the user still chooses when to move
      expect(passage.selectedLevel).toBe(PASSAGELEVEL.l1);
    });
    expect(erroredPassage?.maxLevel).toBe(PASSAGELEVEL.l1);
    expect(erroredPassage?.isNewLevelAwalible).toBe(false);
    expect(erroredPassage?.upgradeDates[PASSAGELEVEL.l2]).toBe(0);
    expect(SESSION_COUNT - 1).toBe(PERFECT_TESTS_TO_PROCEED); //why it is one behind

    // --- phase 6: the stats say the same thing ---------------------------
    const stats = getAppStats(finalState);
    expect(stats.totalTestsNumber).toBe(SESSION_COUNT * PASSAGE_SEEDS.length);
    expect(stats.avgDurationMS).toBe(ANSWER_MS);
    expect(stats.totalTimeSpentMS).toBe(
      SESSION_COUNT * PASSAGE_SEEDS.length * ANSWER_MS
    );
    // one day per session, every day the same five tests
    expect(stats.avgDayDuration).toBe(PASSAGE_SEEDS.length * ANSWER_MS);
    expect(stats.maxStroke).toBe(SESSION_COUNT);
    expect(flow.strokeAfterFlow.length).toBe(SESSION_COUNT);
    expect(getMaxStroke(finalState.testsHistory)).toBe(SESSION_COUNT);
    // sessions: five of them, five tests each, all the errors in the first one
    expect(stats.avgSessionDurationMS).toHaveLength(SESSION_COUNT);
    stats.avgSessionDurationMS.forEach((session) => {
      expect(session.testsNumber).toBe(PASSAGE_SEEDS.length);
      expect(session.duration).toBe(PASSAGE_SEEDS.length * ANSWER_MS);
    });
    expect(
      stats.avgSessionDurationMS.reduce(
        (sum, session) => sum + session.errorNumber,
        0
      )
    ).toBe(ERRORS_IN_FIRST_SESSION);
    // everything was trained as level 1, and level 1 carries both errors
    expect(stats.avgDurationByLevel[PASSAGELEVEL.l1].number).toBe(
      SESSION_COUNT * PASSAGE_SEEDS.length
    );
    expect(stats.avgDurationByLevel[PASSAGELEVEL.l1].errorRate).toBe(
      ERRORS_IN_FIRST_SESSION
    );
    expect(stats.avgDurationByLevel[PASSAGELEVEL.l5].number).toBe(0);
    // score = verses * (reached level - 1) * 2, so only the upgraded ones score
    const expectedScore = cleanPassages.reduce(
      (sum, passage) => sum + passage.versesNumber * 2,
      0
    );
    expect(expectedScore).toBeGreaterThan(0);
    expect(stats.absoluteScore).toBe(expectedScore);
  });

  it("never renders an error count on the surfaces a finished session feeds", () => {
    const { final } = runFlow();

    // Sentinel trick: replace every recorded error count with an unmistakable
    // number. Every error-derived stat (per session, per level, per day) is
    // computed from `en`, so the sentinels propagate into all of them and any
    // leak becomes impossible to confuse with a legitimate number on screen.
    const SENTINEL_BASE = 90000;
    const sentinelState: AppStateModel = {
      ...final,
      testsHistory: final.testsHistory.map((test, index) =>
        (test.en || 0) > 0 ? { ...test, en: SENTINEL_BASE + index } : test
      )
    };
    const sentinelStats = getAppStats(sentinelState);
    const errorCounts = [
      ...sentinelState.testsHistory.map((test) => test.en || 0),
      sentinelState.testsHistory.reduce((sum, test) => sum + (test.en || 0), 0),
      ...sentinelStats.avgSessionDurationMS.map(
        (session) => session.errorNumber
      ),
      ...Object.values(sentinelStats.avgDurationByLevel).map(
        (level) => level.errorRate
      ),
      ...getWeeklyStats(sentinelState).map((day) => day.errors)
    ].filter((value) => value > 0);
    // the sentinels really did reach every error-derived stat
    expect(errorCounts.length).toBeGreaterThan(0);
    errorCounts.forEach((value) =>
      expect(value).toBeGreaterThanOrEqual(SENTINEL_BASE)
    );

    const renderSurface = (surface: ReactNode) =>
      collectRenderedText(
        renderWithContext(
          <SafeAreaProvider initialMetrics={safeAreaMetrics}>
            {surface}
          </SafeAreaProvider>,
          { state: sentinelState }
        ).toJSON()
      ).join(" | ");

    const surfaces = {
      finish: renderSurface(
        <FinishScreen navigation={navigationStub} route={{}} />
      ),
      stats: renderSurface(
        <StatsScreen navigation={navigationStub} route={{}} />
      ),
      weekActivity: renderSurface(
        <WeekActivityComponent
          state={sentinelState}
          t={t}
          theme={makeContextValue().theme}
        />
      )
    };

    // the surfaces really rendered (an empty tree would pass anything below)
    expect(surfaces.finish).toContain(t("titleWelldone"));
    expect(surfaces.stats).toContain(t("statsPassagesNumber"));
    expect(surfaces.stats).toContain(String(final.passages.length));
    expect(surfaces.weekActivity).toContain(t("dayMO"));

    // ...and none of them says how many errors were made (ARCHITECTURE §2.2)
    Object.entries(surfaces).forEach(([name, text]) => {
      errorCounts.forEach((value) => {
        expect(`${name}: ${text}`).not.toContain(String(value));
      });
      expect(text).not.toContain(t("ErrorsMade"));
    });
  });
});
