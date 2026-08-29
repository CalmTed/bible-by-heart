import {
  TESTLEVEL,
  PASSAGELEVEL,
  SORTINGOPTION,
  DAY,
  MIN_TEST_OPTIONS,
  STUDY_ONE_REPEATS
} from "../../constants";
import { createTest } from "../../initials";
import {
  AppStateModel,
  PassageModel,
  TestModel,
  TrainModeModel
} from "../../models";
import { Address } from "../address";
import { logger } from "../logger";
import { createL10Test, CreateTestMethodModel } from "./createL10Test";
import { createL11Test } from "./createL11Tests";
import { createL20Test, createL21Test } from "./createL2XTest";
import { createL30Test } from "./createL30Test";
import { createL40Test } from "./createL40Test";
import { createL50Test } from "./createL50Test";

// When each passage was last tested, in ONE pass over the history. Reading this
// used to mean filtering AND sorting the whole history once per passage, to
// recover a single number — the delay before a session starts (8.2.21). A
// maximum needs no sort. Exported so the agreement test can hold it against the
// naive form it replaced.
export const getLastTestedByPassage: (
  history: TestModel[]
) => Map<number, number> = (history) => {
  const lastTested = new Map<number, number>();
  history.forEach((t) => {
    const testedAt = t?.td?.[0]?.[1] || 0;
    const known = lastTested.get(t.pi);
    if (known === undefined || testedAt > known) {
      lastTested.set(t.pi, testedAt);
    }
  });
  return lastTested;
};

export const getPassagesByTrainMode: (
  state: AppStateModel,
  trainMode: TrainModeModel
) => PassageModel[] = (state, trainMode) => {
  const targetTranslation = state.settings.translations.find(
    (tr) => tr.id === trainMode.translation
  );

  //proseed only if train mode enabled AND translation exists
  if (
    !trainMode.enabled ||
    (!targetTranslation && trainMode.translation !== 0)
  ) {
    return [];
  }

  const lastTestedByPassage = getLastTestedByPassage(state.testsHistory);

  const passagesDueTo = state.passages.filter((p) => {
    if (p.minIntervalDaysNum === null || !p.isReminderOn) {
      return false;
    }
    const lastTastedDate = lastTestedByPassage.get(p.id) || 0;
    const dayinMs = DAY * 1000;
    const targetNextTest =
      Math.floor((lastTastedDate + p.minIntervalDaysNum * dayinMs) / dayinMs) *
      dayinMs;
    return new Date().getTime() > targetNextTest;
  });

  // Membership, not a scan: `isDueTo` was called from inside the sort
  // comparator, so a linear `find` there was O(P² log P) (8.2.21).
  const passagesDueToIds = new Set(passagesDueTo.map((p) => p.id));
  const isDueTo = (p: PassageModel) => passagesDueToIds.has(p.id);

  return [
    ...[
      ...state.passages.filter((p) => {
        //if translation right
        const isTranslationRight =
          p.verseTranslation === trainMode.translation ||
          trainMode.translation === 0;
        //include tags if not empty
        const hasAllIncludedTags = trainMode.includeTags.length
          ? //if passage has all of the tags of trainMode
            trainMode.includeTags.filter((tag) => p.tags.includes(tag))
              .length === trainMode.includeTags.length
          : true;
        //exclude tags if not empty
        const doesNotHasAnyExcludedTags = trainMode.excludeTags.length
          ? //if passage has none of the tags of trainMode
            !trainMode.excludeTags.filter((tag) => p.tags.includes(tag)).length
          : true;
        const hasTargetLevelAvalible = trainMode.testAsLevel
          ? p.maxLevel > trainMode.testAsLevel - 1 ||
            state.settings.devModeEnabled
          : true;
        return (
          isTranslationRight &&
          hasAllIncludedTags &&
          doesNotHasAnyExcludedTags &&
          hasTargetLevelAvalible
        );
      })
    ]
      .sort((a, b) => {
        switch (trainMode.sort) {
          case SORTINGOPTION.address:
            return Address.order(b.address) - Address.order(a.address);
          case SORTINGOPTION.maxLevel:
            return b.maxLevel - a.maxLevel;
          case SORTINGOPTION.selectedLevel:
            return b.selectedLevel - a.selectedLevel;
          case SORTINGOPTION.resentlyCreated:
            return b.dateCreated - a.dateCreated;
          case SORTINGOPTION.oldestToTrain:
            //if due to
            if (isDueTo(a)) {
              return -Infinity;
            }
            if (isDueTo(b)) {
              return Infinity;
            }
            return a.dateTested - b.dateTested;
          default:
            logger.error(`Undefined sorting option: ${trainMode.sort}`);
            return 0;
        }
      })
      .slice(0, trainMode.length || Math.min(state.passages.length, 100))
  ] //limiting max number to 100
    .sort(() => (Math.random() > 0.5 ? -1 : 1)); //shuffling again JUST FOR MORE VARIABILITY!!!
};

export const generateTests: (
  state: AppStateModel,
  trainMode: TrainModeModel
) => TestModel[] = (state, trainMode) => {
  const passages = state.passages;
  const history = state.testsHistory;
  if (!passages.length) {
    logger.write("There are no passages to create tests");
    return [];
  }
  const sessionId = Math.round(Math.random() * 10000000);

  const tests: TestModel[] = getPassagesByTrainMode(state, trainMode).map(
    (p) => {
      const initialTest = createTest(sessionId, p.id, p.selectedLevel);
      return generateATest(
        initialTest,
        passages,
        trainMode.testAsLevel,
        history
      );
    }
  );
  return tests;
};

/**
 * "Study this one" (8.2.1c) — a session that drills ONE passage, repeated
 * `repeats` times, instead of a slice of the library.
 *
 * It is a transient session, not a stored `TrainModeModel`: a train mode is a
 * *filter* over the library (tags, translation, sort, length) and has no way to
 * name a single passage, so storing one would mean a state-model change for a
 * mode that targets a passage the user just created and will never reuse.
 * Nothing here touches `trainModesList` or `activeTrainModeId` — the user's
 * normal practice setup survives a drill untouched.
 *
 * Each repeat is generated separately, so the per-level randomness the library
 * already has (l10 vs l11, l20 vs l21, which words go missing, which decoy
 * addresses appear) makes the repeats differ from one another.
 */
export const generateStudyOneTests: (
  state: AppStateModel,
  passageId: number,
  repeats?: number
) => TestModel[] = (state, passageId, repeats = STUDY_ONE_REPEATS) => {
  const targetPassage = state.passages.find((p) => p.id === passageId);
  if (!targetPassage) {
    logger.error(`No passage ${passageId} to study`);
    return [];
  }
  // A passage with no text cannot be tested at any level.
  if (!targetPassage.verseText.trim().length) {
    logger.write(`Passage ${passageId} has no text to study`);
    return [];
  }
  const sessionId = Math.round(Math.random() * 10000000);
  return Array.from({ length: Math.max(repeats, 1) }, () =>
    generateATest(
      createTest(sessionId, targetPassage.id, targetPassage.selectedLevel),
      state.passages,
      null,
      state.testsHistory
    )
  );
};

/**
 * The rule for every level that asks the user to PICK a passage out of a list
 * (l11 and l21), decided once (8.2.36).
 *
 * Their options are other passages, so the library is the only place a decoy
 * can come from: a library that cannot supply `MIN_TEST_OPTIONS - 1` of them
 * offers the answer alone, which cannot be got wrong and is still recorded as a
 * pass. Levels that ask about the ADDRESS (l10, l20) have no such limit - the
 * address space is infinite, so l10 synthesizes its decoys and l20 asks for the
 * address in the picker - so each option-picking level falls back to the other
 * half of its own level rather than being dropped. A session therefore never
 * loses a test, it only changes which half of the level it asks.
 *
 * Counted inside the target's own translation, because that is the pool the
 * options are actually drawn from - four passages across two translations look
 * like enough and are not.
 */
export const canOfferPassageOptions: (
  passages: PassageModel[],
  passageId: number
) => boolean = (passages, passageId) => {
  const targetPassage = passages.find((p) => p.id === passageId);
  if (!targetPassage) {
    return false;
  }
  return (
    passages.filter(
      (p) => p.verseTranslation === targetPassage.verseTranslation
    ).length >= MIN_TEST_OPTIONS
  );
};

//generate a test
//require passages list
//get initial test or generate one
//get target test level or generate from target passage level
//   when downgrading we will already have lower level after redusing or we will call it from reduser
//get history or set to be []
export const generateATest: (
  initialTest: TestModel,
  passages: PassageModel[],
  targetTestLevel?: PASSAGELEVEL | null,
  history?: TestModel[]
) => TestModel = (initialTest, passages, targetTestLevel, history = []) => {
  const littleClearerInitialTest = {
    ...initialTest,
    errorNumber: null,
    errorType: null
  } as TestModel;
  // An option-picking level the library cannot fill becomes the other half of
  // its own level (8.2.36). It used to be one line for l11 only, counting the
  // whole library rather than the translation the options come from - so l21
  // was never guarded at all and a one-passage library got a "pick the verse"
  // test whose only option was the answer.
  const canPickFromOptions = canOfferPassageOptions(
    passages,
    littleClearerInitialTest.pi
  );
  const optionSafeLevel: Partial<Record<TESTLEVEL, TESTLEVEL>> = {
    [TESTLEVEL.l11]: TESTLEVEL.l10,
    [TESTLEVEL.l21]: TESTLEVEL.l20
  };
  const testTenghtSafeTest: TestModel = canPickFromOptions
    ? littleClearerInitialTest
    : {
        ...littleClearerInitialTest,
        l:
          optionSafeLevel[littleClearerInitialTest.l] ||
          littleClearerInitialTest.l
      };
  //filling test data here
  const testCreationList: Record<TESTLEVEL, CreateTestMethodModel> = {
    [TESTLEVEL.l10]: createL10Test,
    [TESTLEVEL.l11]: createL11Test,
    [TESTLEVEL.l20]: createL20Test,
    [TESTLEVEL.l21]: createL21Test,
    [TESTLEVEL.l30]: createL30Test,
    [TESTLEVEL.l40]: createL40Test,
    [TESTLEVEL.l50]: createL50Test
  };
  const randBool = Math.random() > 0.5;
  const onlyLevelFunctions: Record<PASSAGELEVEL, CreateTestMethodModel> = {
    [PASSAGELEVEL.l1]:
      randBool || !canPickFromOptions ? createL10Test : createL11Test,
    [PASSAGELEVEL.l2]:
      randBool || !canPickFromOptions ? createL20Test : createL21Test,
    [PASSAGELEVEL.l3]: createL30Test,
    [PASSAGELEVEL.l4]: createL40Test,
    [PASSAGELEVEL.l5]: createL50Test
  };
  const onlyLevelTestLevels: Record<PASSAGELEVEL, TESTLEVEL> = {
    //l11 and l21 cant be created without MIN_TEST_OPTIONS passages to draw from
    [PASSAGELEVEL.l1]:
      randBool || !canPickFromOptions ? TESTLEVEL.l10 : TESTLEVEL.l11,
    [PASSAGELEVEL.l2]:
      randBool || !canPickFromOptions ? TESTLEVEL.l20 : TESTLEVEL.l21,
    [PASSAGELEVEL.l3]: TESTLEVEL.l30,
    [PASSAGELEVEL.l4]: TESTLEVEL.l40,
    [PASSAGELEVEL.l5]: TESTLEVEL.l50
  };
  if (typeof targetTestLevel === "number") {
    //if specific level is selected
    return onlyLevelFunctions[Math.max(targetTestLevel, 0) as PASSAGELEVEL]({
      initialTest: {
        ...initialTest,
        l: onlyLevelTestLevels[targetTestLevel as PASSAGELEVEL]
      },
      passages,
      history
    });
  }
  return testCreationList[testTenghtSafeTest.l]({
    initialTest: testTenghtSafeTest,
    passages,
    history
  });
};
