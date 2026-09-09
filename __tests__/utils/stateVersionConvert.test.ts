import {
  convertState,
  versionsConvertionTable
} from "../../src/utils/stateVersionConvert";
import { createAppState008, createPassage009 } from "../../src/initials";
import {
  AppStateModel007,
  AppStateModel008,
  AppStateModel010,
  AddressType,
  TestModel007
} from "../../src/models";
import {
  alowedStateVersions,
  BUNDLED_TRANSLATION_SOURCES,
  DEFAULT_TRAINMODE_ID,
  LANGCODE,
  PASSAGELEVEL,
  SORTINGOPTION,
  STATSMETRICS,
  TESTLEVEL,
  THEMETYPE,
  VERSION
} from "../../src/constants";
import {
  DAY_MS,
  P006_DELETED_ID,
  P006_JOHN_CREATED,
  P006_JOHN_ID,
  P006_PHIL_ID,
  P006_PSALM_CREATED,
  P006_PSALM_ID,
  P006_ROMANS_ID,
  T0,
  T006_JOHN_L11_FINISH,
  T006_JOHN_L11_ID,
  T006_ORPHAN_ID,
  T006_PSALM_L10_FINISH,
  makeState006
} from "../fixtures/state006";
import {
  P007_DELETED_ID,
  P007_ISAIAH_CREATED,
  P007_ISAIAH_ID,
  P007_LEFT_SWIPE_TAG,
  P007_MATTHEW_ID,
  T007_ISAIAH_L10_FINISH,
  T007_ISAIAH_L10_ID,
  T007_ISAIAH_L21_ID,
  T007_MATTHEW_L50_ID,
  T007_MATTHEW_L50_TRIES,
  T007_ORPHAN_ID,
  T007_UNFINISHED_ID,
  makeState007
} from "../fixtures/state007";

// The state-converter chain is the highest-blast-radius code in the repo — a
// wrong converter silently destroys years of user stats — yet it had zero tests.
// This locks the current-era chain (→ 0.0.9 → 0.1.0), which exercises the
// recursive convertState engine (partialMatch → goodMatch → finalMatch) plus the
// two most recent converters, and the two legacy hops 0.0.6 → 0.0.7 → 0.0.8 with
// realistic fixtures, so every hop from the oldest allowed version is covered.

/**
 * Runs a single hop of the table. `convertState` always types its result as the
 * current `AppStateModel`, which is a lie for intermediate versions, so per-hop
 * assertions go through the converter the engine itself would call.
 */
const runHop = <T>(to: string, stateFrom: object): T => {
  const hop = versionsConvertionTable.find((item) => item.to === to);
  if (!hop) {
    throw new Error(`No converter produces version ${to}`);
  }
  return hop.method(stateFrom);
};

const sampleAddress: AddressType = {
  bookIndex: 0,
  startChapterNum: 1,
  startVerseNum: 1,
  endChapterNum: 1,
  endVerseNum: 1
};

// A realistic 0.0.8 state built from the real initial-state factory (so the shape
// is genuinely valid) plus one passage, one finished test and one unfinished test.
const makeState008 = (): AppStateModel008 => {
  const base = createAppState008();
  // createPassage009 returns a superset of PassageModel008 (extra upgradeDates,
  // which the 0.0.9 converter overwrites anyway) — fine as a 0.0.8 passage.
  const passage = createPassage009(sampleAddress, "In the beginning");
  const finishedTest: TestModel007 = {
    id: 101,
    sessionId: 1,
    passageId: passage.id,
    userId: null,
    triesDuration: [[1000, 2000]],
    isFinished: true,
    level: TESTLEVEL.l10,
    testData: {},
    errorNumber: 0,
    errorType: null,
    wrongAddress: [],
    wrongPassagesId: [],
    wrongWords: []
  };
  const unfinishedTest: TestModel007 = {
    ...finishedTest,
    id: 102,
    triesDuration: [[1500, 1800]],
    isFinished: false
  };
  return {
    ...base,
    version: "0.0.8",
    passages: [passage],
    testsHistory: [finishedTest, unfinishedTest]
  };
};

describe("convertState (state version migration chain)", () => {
  it("migrates a 0.0.8 state all the way to the current version", () => {
    const result = convertState(makeState008()) as AppStateModel010 | null;
    expect(result).not.toBeNull();
    //VERSION, not a literal: "all the way" has to keep meaning all the way
    expect(result?.version).toBe(VERSION);
  });

  it("preserves passages and keeps only finished history across the chain", () => {
    const state008 = makeState008();
    const result = convertState(state008) as AppStateModel010 | null;
    expect(result?.passages).toHaveLength(1);
    expect(result?.passages[0].id).toBe(state008.passages[0].id);
    // to009 filters history to finished tests only (2 in → 1 kept)
    expect(result?.testsHistory).toHaveLength(1);
    expect(result?.testsActive).toEqual([]);
  });

  it("carries user settings across the whole chain", () => {
    const state008 = makeState008();
    const result = convertState(state008) as AppStateModel010 | null;
    expect(result?.settings.langCode).toBe(state008.settings.langCode);
    expect(result?.settings.leftSwipeTag).toBe(state008.settings.leftSwipeTag);
  });

  it("strips auth/account data when producing the current version", () => {
    const result = convertState(makeState008()) as AppStateModel010 | null;
    expect(result?.userData.uuid).toBeNull();
    expect(result?.userData.email).toBeNull();
    // the old top-level authToken must not leak into the new userData shape
    expect(
      (result?.userData as Record<string, unknown>).authToken
    ).toBeUndefined();
  });

  it("returns null for an unknown / unsupported source version", () => {
    expect(convertState({ version: "0.0.1" })).toBeNull();
    expect(convertState({ version: "9.9.9" })).toBeNull();
  });
});

describe("legacy hop 0.0.6 → 0.0.7 (to007)", () => {
  it("folds the flat 0.0.6 fields into the new settings object", () => {
    const to = runHop<AppStateModel007>("0.0.7", makeState006());
    expect(to.version).toBe("0.0.7");
    expect(to.settings.langCode).toBe(LANGCODE.ua);
    expect(to.settings.theme).toBe(THEMETYPE.dark);
    expect(to.settings.chapterNumbering).toBe("eastern");
    expect(to.settings.devMode).toBe(true);
  });

  it("keeps passages, drops active tests, marks history finished", () => {
    const from = makeState006();
    const to = runHop<AppStateModel007>("0.0.7", from);
    expect(to.passages).toEqual(from.passages);
    expect(to.testsActive).toEqual([]);
    expect(to.testsHistory).toHaveLength(from.testsHistory.length);
    const source = from.testsHistory[1]; //John 3:16, level 11, one wrong word
    const converted = to.testsHistory[1];
    expect(converted.id).toBe(T006_JOHN_L11_ID);
    expect(converted.isFinished).toBe(true);
    expect(converted.triesDuration).toEqual([
      [source.dateStarted, source.dateFinished]
    ]);
    expect(converted.errorNumber).toBe(1);
    expect(converted.errorType).toBe("wrongWord");
    expect(converted.wrongWords).toEqual([[3, "loveed"]]);
    //the flat 0.0.6 date fields ride along untouched until the 0.0.9 hop drops them
    expect(Object.keys(converted)).toContain("dateStarted");
  });

  it("carries account, filters and sort; fills what 0.0.7 added", () => {
    const from = makeState006();
    const to = runHop<AppStateModel007>("0.0.7", from);
    expect(to.userId).toBe(42);
    expect(to.lastChange).toBe(from.lastChange);
    expect(to.dateSyncTry).toBe(from.dateSyncTry);
    expect(to.dateSyncSuccess).toBe(from.dateSyncSuccess);
    expect(to.sort).toBe(SORTINGOPTION.resentlyCreated);
    expect(to.filters.tags).toEqual(from.filters.tags);
    expect(to.filters.selectedLevels).toEqual(from.filters.selectedLevels);
    expect(to.filters.maxLevels).toEqual(from.filters.maxLevels);
    expect(to.filters.translations).toEqual([]); //new in 0.0.7
    //defaults appear here: every bundled source is put in front of every
    //install, so the count follows the shipped catalogue rather than a number
    expect(to.settings.translations).toHaveLength(
      BUNDLED_TRANSLATION_SOURCES.length
    );
    //by design (see the converter comment): 0.0.6 reminder times were not
    //user-editable, so they are dropped rather than migrated
    expect(from.reminderTimes).toEqual([28800, 72000]);
    expect(to.settings.remindersList).toEqual([]);
  });

  it("is the hop the engine picks for every pre-0.0.7 version", () => {
    ["0.0.4", "0.0.5", "0.0.6"].forEach((version) => {
      const result = convertState(makeState006(version), "0.0.7", "0.0.7");
      expect(result?.version).toBe("0.0.7");
    });
  });
});

describe("legacy hop 0.0.7 → 0.0.8 (to008)", () => {
  it("drops unfinished history and per-test data, keeps every try", () => {
    const from = makeState007();
    const to = runHop<AppStateModel008>("0.0.8", from);
    expect(to.version).toBe("0.0.8");
    expect(to.testsActive).toEqual([]);
    expect(to.testsHistory.map((t) => t.id)).toEqual([
      T007_ISAIAH_L10_ID,
      T007_ISAIAH_L21_ID,
      T007_MATTHEW_L50_ID,
      T007_ORPHAN_ID
    ]);
    expect(to.testsHistory.some((t) => t.id === T007_UNFINISHED_ID)).toBe(false);
    expect(
      to.testsHistory.every((t) => Object.keys(t.testData).length === 0)
    ).toBe(true);
    const l50 = to.testsHistory.find((t) => t.id === T007_MATTHEW_L50_ID);
    expect(l50?.triesDuration).toEqual(T007_MATTHEW_L50_TRIES);
    expect(l50?.errorNumber).toBe(3);
    expect(l50?.wrongWords).toEqual([
      [2, "sek"],
      [5, "kindom"]
    ]);
  });

  it("keeps user settings and adds the 0.0.8 train modes", () => {
    const from = makeState007();
    const to = runHop<AppStateModel008>("0.0.8", from);
    expect(to.settings.langCode).toBe(LANGCODE.ua);
    expect(to.settings.theme).toBe(THEMETYPE.dark);
    expect(to.settings.hapticsEnabled).toBe(false);
    expect(to.settings.soundsEnabled).toBe(false);
    expect(to.settings.leftSwipeTag).toBe(P007_LEFT_SWIPE_TAG);
    expect(to.settings.remindersEnabled).toBe(true);
    expect(to.settings.remindersList).toEqual(from.settings.remindersList);
    expect(to.settings.translations).toEqual(from.settings.translations);
    expect(to.settings.trainModesList).toHaveLength(1);
    expect(to.settings.trainModesList[0].id).toBe(DEFAULT_TRAINMODE_ID);
    expect(to.settings.activeTrainModeId).toBe(DEFAULT_TRAINMODE_ID);
    expect(to.passages).toEqual(from.passages);
    expect(to.userId).toBe(from.userId);
    expect(to.filters.translations).toEqual([1, 3]);
    expect(to.lastBackup).toBe(0); //new field, nothing in 0.0.7 to copy
  });
});

describe("full legacy chain from the oldest allowed version", () => {
  it("converts 0.0.4 / 0.0.5 / 0.0.6 states all the way to VERSION", () => {
    expect(alowedStateVersions[0]).toBe("0.0.4");
    ["0.0.4", "0.0.5", "0.0.6"].forEach((version) => {
      const result = convertState(makeState006(version));
      expect(result?.version).toBe(VERSION);
      expect(result?.passages).toHaveLength(4);
      expect(result?.testsHistory).toHaveLength(5); //6 minus the orphan
    });
  });

  it("keeps passage content and derives upgrade dates from the history", () => {
    const before = Date.now();
    const result = convertState(makeState006());
    const after = Date.now();

    const john = result?.passages.find((p) => p.id === P006_JOHN_ID);
    expect(john?.verseText).toBe("For God so loved the world...");
    expect(john?.tags).toEqual(["Gospel"]);
    expect(john?.versesNumber).toBe(1);
    expect(john?.selectedLevel).toBe(PASSAGELEVEL.l2);
    expect(john?.isReminderOn).toBe(true);
    expect(john?.upgradeDates[PASSAGELEVEL.l1]).toBe(P006_JOHN_CREATED);
    //level 2 is dated by the last level-1 test before the first level-2 one
    expect(john?.upgradeDates[PASSAGELEVEL.l2]).toBe(T006_JOHN_L11_FINISH);
    expect(john?.upgradeDates[PASSAGELEVEL.l3]).toBe(0);

    const psalm = result?.passages.find((p) => p.id === P006_PSALM_ID);
    expect(psalm?.minIntervalDaysNum).toBe(14);
    expect(psalm?.upgradeDates[PASSAGELEVEL.l1]).toBe(P006_PSALM_CREATED);
    expect(psalm?.upgradeDates[PASSAGELEVEL.l3]).toBe(T006_PSALM_L10_FINISH);
    //it never trained at level 2, so that date legitimately stays empty
    expect(psalm?.upgradeDates[PASSAGELEVEL.l2]).toBe(0);

    //a passage with no history at all gets "now" for its max level
    const phil = result?.passages.find((p) => p.id === P006_PHIL_ID);
    expect(phil?.upgradeDates[PASSAGELEVEL.l4]).toBeGreaterThanOrEqual(before);
    expect(phil?.upgradeDates[PASSAGELEVEL.l4]).toBeLessThanOrEqual(after);

    //ownerId goes from a numeric user id to a uuid string
    const romans = result?.passages.find((p) => p.id === P006_ROMANS_ID);
    expect(romans?.ownerId).toBe("42");
    expect(john?.ownerId).toBeNull();
  });

  it("compacts the history and drops tests of deleted passages", () => {
    const result = convertState(makeState006());
    expect(result?.testsHistory.some((t) => t.pi === P006_DELETED_ID)).toBe(
      false
    );
    expect(result?.testsHistory.some((t) => t.i === T006_ORPHAN_ID)).toBe(false);
    const john = result?.testsHistory.find((t) => t.i === T006_JOHN_L11_ID);
    expect(john?.pi).toBe(P006_JOHN_ID);
    expect(john?.l).toBe(TESTLEVEL.l11);
    expect(john?.en).toBe(1);
    expect(john?.et).toEqual(["wrongWord"]);
    expect(john?.ww).toEqual([[3, "loveed"]]);
    expect(john?.td).toEqual([[T0 + 2 * DAY_MS, T006_JOHN_L11_FINISH]]);
    //0.0.9 keeps 10 of the 13 fields on purpose — `f`, `d` and `ui` are gone even
    //though TestModel009 still declares them
    expect(john ? Object.keys(john).sort() : []).toEqual([
      "en",
      "et",
      "i",
      "l",
      "pi",
      "si",
      "td",
      "wa",
      "wp",
      "ww"
    ]);
  });

  it("carries settings/filters and resets account data at the last hop", () => {
    const from = makeState006();
    const result = convertState(from);
    expect(result?.settings.langCode).toBe(LANGCODE.ua);
    expect(result?.settings.theme).toBe(THEMETYPE.dark);
    expect(result?.settings.trainModesList).toHaveLength(1);
    expect(result?.filters.tags).toEqual(from.filters.tags);
    expect(result?.filters.selectedLevels).toEqual(from.filters.selectedLevels);
    expect(result?.sort).toBe(SORTINGOPTION.resentlyCreated);
    expect(result?.lastChange).toBe(from.lastChange);
    expect(result?.testsActive).toEqual([]);
    expect(result?.statsDateRange).toEqual({ from: 0, to: -1 });
    expect(result?.userData.uuid).toBeNull();
    expect(result?.userData.email).toBeNull();
    expect(result?.userData.loginTypes).toEqual({ email: false, google: false });
    expect(result?.broadcastMessages).toEqual([]);
  });
});

describe("full legacy chain from 0.0.7", () => {
  it("reaches VERSION with passages, history and settings intact", () => {
    const from = makeState007();
    const result = convertState(from);
    expect(result?.version).toBe(VERSION);
    expect(result?.passages).toHaveLength(3);
    //5 history entries in, minus the unfinished one (0.0.8) and the orphan (0.0.9)
    expect(result?.testsHistory).toHaveLength(3);
    expect(result?.testsHistory.some((t) => t.i === T007_UNFINISHED_ID)).toBe(
      false
    );
    expect(result?.testsHistory.some((t) => t.i === T007_ORPHAN_ID)).toBe(false);
    expect(result?.testsHistory.some((t) => t.pi === P007_DELETED_ID)).toBe(
      false
    );

    const l50 = result?.testsHistory.find((t) => t.i === T007_MATTHEW_L50_ID);
    expect(l50?.pi).toBe(P007_MATTHEW_ID);
    expect(l50?.l).toBe(TESTLEVEL.l50);
    expect(l50?.td).toEqual(T007_MATTHEW_L50_TRIES); //both tries survive
    expect(l50?.et).toEqual(["wrongWord"]);

    const isaiah = result?.passages.find((p) => p.id === P007_ISAIAH_ID);
    expect(isaiah?.ownerId).toBe("7");
    expect(isaiah?.verseText).toBe("Fear not, for I am with you...");
    expect(isaiah?.upgradeDates[PASSAGELEVEL.l1]).toBe(P007_ISAIAH_CREATED);
    expect(isaiah?.upgradeDates[PASSAGELEVEL.l2]).toBe(T007_ISAIAH_L10_FINISH);

    expect(result?.settings.hapticsEnabled).toBe(false);
    expect(result?.settings.soundsEnabled).toBe(false);
    expect(result?.settings.leftSwipeTag).toBe(P007_LEFT_SWIPE_TAG);
    expect(result?.settings.remindersEnabled).toBe(true);
    expect(result?.settings.remindersSmartTime).toBe(false);
    expect(result?.settings.remindersList).toEqual(from.settings.remindersList);
    //every 0.0.7 translation survives, in order and by name, with the source it
    //turned out to have; the bundled ones follow
    expect(
      result?.settings.translations
        .slice(0, from.settings.translations.length)
        .map(({ id, name, editable }) => ({ id, name, editable }))
    ).toEqual(
      from.settings.translations.map(({ id, name, editable }) => ({
        id,
        name,
        editable
      }))
    );
    expect(result?.settings.homeScreenWeeklyMetric).toBe(STATSMETRICS.minutes);
    expect(result?.filters.translations).toEqual([1, 3]);
    expect(result?.userData.uuid).toBeNull();
  });

  //CHARACTERIZATION, NOT A SPEC: the assertions below pin down data loss found
  //while covering the legacy hops. It was reported instead of fixed (that work
  //forbade touching converter code) — flip these once `to009` is corrected.
  it("(known data loss) loses settings `to009` never reads from the source", () => {
    const from = makeState007();
    //a real ≤0.0.8 device stores the pre-rename key `autoIncreeseLevel`
    expect(from.settings.autoIncreeseLevel).toBe(true);
    const result = convertState(from);
    //…but `to009` reads `from.settings.autoIncreaseLevel`, so the user's choice is
    //dropped and the field lands `undefined` where the model promises a boolean
    expect(result?.settings.autoIncreaseLevel).toBeUndefined();
    //these two are hardcoded by `to009` instead of copied
    expect(from.settings.chapterNumbering).toBe("eastern");
    expect(result?.settings.chapterNumbering).toBe("vestern");
    expect(from.settings.homeScreenStatsType).toBe("dayStreak");
    expect(result?.settings.homeScreenStatsType).toBe("auto");
    expect(from.settings.compressOldTestsData).toBe(false);
    expect(result?.settings.compressOldTestsData).toBe(true);
  });
});

describe("hop 0.1.0 → 0.1.1 (to011)", () => {
  // A translation now names the text source behind it. Before
  // 0.1.1 the app carried that knowledge as a hardcoded list of one id, so the
  // hop has to say out loud which of the user's translations ESV was - and hand
  // over the bundled translations the version added.
  const state010 = () => {
    const state = convertState(makeState007()) as AppStateModel010;
    return {
      ...state,
      version: "0.1.0",
      settings: {
        ...state.settings,
        translations: [
          {
            id: 1,
            editable: false,
            isDefault: false,
            name: "ESV®",
            addressLanguage: LANGCODE.en
          },
          {
            id: 2,
            editable: false,
            isDefault: true,
            name: "UCVNTR",
            addressLanguage: LANGCODE.ua
          },
          {
            id: 3,
            editable: true,
            isDefault: false,
            name: "Огієнко",
            addressLanguage: LANGCODE.ua
          }
        ]
      }
    };
  };

  it("gives the one fetchable translation there was its source", () => {
    const to = runHop<AppStateModel010>("0.1.1", state010());
    expect(to.version).toBe("0.1.1");
    expect(to.settings.translations[0]).toEqual({
      id: 1,
      editable: false,
      isDefault: false,
      name: "ESV®",
      addressLanguage: LANGCODE.en,
      sourceId: "esv"
    });
  });

  it("leaves every hand-typed translation without one", () => {
    const to = runHop<AppStateModel010>("0.1.1", state010());
    expect(to.settings.translations[1].sourceId).toBeNull();
    expect(to.settings.translations[2].sourceId).toBeNull();
    //the user's own "Огієнко" is a name, not the bundled Огієнко translation
    expect(to.settings.translations[2].name).toBe("Огієнко");
    expect(to.settings.translations[2].editable).toBe(true);
  });

  it("hands over the bundled translations without touching the old ones", () => {
    const from = state010();
    const to = runHop<AppStateModel010>("0.1.1", from);
    expect(to.settings.translations).toHaveLength(
      from.settings.translations.length + BUNDLED_TRANSLATION_SOURCES.length - 1
    );
    BUNDLED_TRANSLATION_SOURCES.forEach((source) => {
      expect(
        to.settings.translations.filter((tr) => tr.sourceId === source.sourceId)
      ).toHaveLength(1);
    });
    //the user's default survives, and nothing appended competes with it
    expect(to.settings.translations.filter((tr) => tr.isDefault)).toHaveLength(
      1
    );
    expect(to.settings.translations[1].isDefault).toBe(true);
  });

  it("gives every translation an id of its own", () => {
    const to = runHop<AppStateModel010>("0.1.1", state010());
    const ids = to.settings.translations.map((tr) => tr.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries the rest of the state through untouched", () => {
    const from = state010();
    const to = runHop<AppStateModel010>("0.1.1", from);
    expect(to.passages).toEqual(from.passages);
    expect(to.testsHistory).toEqual(from.testsHistory);
    expect(to.filters).toEqual(from.filters);
    expect(to.settings.remindersList).toEqual(from.settings.remindersList);
    expect(to.settings.trainModesList).toEqual(from.settings.trainModesList);
  });
});
