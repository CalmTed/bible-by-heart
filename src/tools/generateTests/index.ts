
import { TESTLEVEL, PASSAGELEVEL, SORTINGOPTION, DAY } from "../../constants";
import { createTest } from "../../initials";
import {
  AppStateModel,
  PassageModel,
  TestModel,
  TrainModeModel
} from "../../models";
import { getAddresOrder } from "../addressOrder";
import { createL10Test, CreateTestMethodModel } from "./createL10Test";
import { createL11Test } from "./createL11Tests";
import { createL20Test, createL21Test } from "./CreateL2XTest";
import { createL30Test } from "./createL30Test";
import { createL40Test } from "./createL40Test";
import { createL50Test } from "./createL50Test";


export const getPassagesByTrainMode: (
  state: AppStateModel,
  trainMode: TrainModeModel
) => PassageModel[] = (state, trainMode) => {
  
  const targetTranslation = state.settings.translations.find(
    (tr) => tr.id === trainMode.translation
  );
  
  //proseed only if train mode enabled AND translation exists
  if (!trainMode.enabled || (!targetTranslation && trainMode.translation !== 0)) {
    return [];
  }

  const passagesDueTo = state.passages.filter((p) => {
    if(p.minIntervalDaysNum === null || !p.isReminderOn){
      return false;
    }
    const lastTastedDate = [...state.testsHistory.filter(t => t.pi === p.id)].sort((a,b) => (b?.td?.[0]?.[1] || 0) - (a?.td?.[0]?.[1] || 0))[0]?.td?.[0]?.[1] || 0
    const dayinMs = DAY * 1000;
    const targetNextTest = Math.floor((lastTastedDate + (p.minIntervalDaysNum * dayinMs))/ dayinMs)* dayinMs;
    return new Date().getTime() > targetNextTest;
  })
  
  const isDueTo = (p: PassageModel, dueToList: PassageModel[]) => {
    if(!dueToList || !dueToList.length){
      return false;
    }
    return !!dueToList.find(dtlp => dtlp.id === p.id)
  }

  return [...[...state.passages
    .filter((p) => {
      //if translation right
      const isTranslationRight = p.verseTranslation === trainMode.translation || trainMode.translation === 0; 
      //include tags if not empty
      const hasAllIncludedTags = trainMode.includeTags.length
        //if passage has all of the tags of trainMode
        ? trainMode.includeTags.filter((tag) => p.tags.includes(tag)).length ===
          trainMode.includeTags.length
        : true;
      //exclude tags if not empty
      const doesNotHasAnyExcludedTags = trainMode.excludeTags.length
        //if passage has none of the tags of trainMode 
        ? !trainMode.excludeTags.filter((tag) => p.tags.includes(tag)).length
        : true;
      const hasTargetLevelAvalible = trainMode.testAsLevel 
        ? p.maxLevel > trainMode.testAsLevel - 1 || state.settings.devModeEnabled
        : true;
      return (
        isTranslationRight && hasAllIncludedTags && doesNotHasAnyExcludedTags && hasTargetLevelAvalible
      );
    })]
    .sort((a, b) => {
      switch (trainMode.sort) {
        case SORTINGOPTION.address:
          return getAddresOrder(b.address) - getAddresOrder(a.address);
        case SORTINGOPTION.maxLevel:
          return b.maxLevel - a.maxLevel;
        case SORTINGOPTION.selectedLevel:
          return b.selectedLevel - a.selectedLevel;
        case SORTINGOPTION.resentlyCreated:
          return b.dateCreated - a.dateCreated;
        case SORTINGOPTION.oldestToTrain:
          //if due to
          if(isDueTo(a, passagesDueTo)){
            return -Infinity
          }
          if(isDueTo(b, passagesDueTo)){
            return Infinity
          }
          return a.dateTested - b.dateTested;
        default:
          console.warn("Undefined sorting option", trainMode.sort)
          return 0;
      }
    })
    .slice(0, trainMode.length || Math.min(state.passages.length, 100) )] //limiting max number to 100
    .sort(() => (Math.random() > 0.5 ? -1 : 1))//shuffling again JUST FOR MORE VARIABILITY!!!
};

export const generateTests: (state: AppStateModel, trainMode: TrainModeModel) => TestModel[] = (state, trainMode) => {
  const passages = state.passages;
  const history = state.testsHistory;
  if (!passages.length) {
    console.log("there are no passages to create tests");
    return [];
  }
  const sessionId = Math.round(Math.random() * 10000000);

  const tests: TestModel[] = getPassagesByTrainMode(state, trainMode).map(
    (p) => {
      const initialTest = createTest(sessionId, p.id, p.selectedLevel);
      return generateATest(initialTest, passages, trainMode.testAsLevel, history);
    }
  );
  return tests;
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
  const littleClearerInitialTest = {...initialTest, errorNumber: null, errorType: null} as TestModel
  const testTenghtSafeTest: TestModel =
    passages.length > 3
      ? littleClearerInitialTest
      : littleClearerInitialTest.l === TESTLEVEL.l11
      ? { ...littleClearerInitialTest, l: TESTLEVEL.l10 }
      : littleClearerInitialTest;
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
      randBool || passages.length < 4 ? createL10Test : createL11Test,
    [PASSAGELEVEL.l2]: randBool ? createL20Test : createL21Test,
    [PASSAGELEVEL.l3]: createL30Test,
    [PASSAGELEVEL.l4]: createL40Test,
    [PASSAGELEVEL.l5]: createL50Test
  };
  const onlyLevelTestLevels: Record<PASSAGELEVEL, TESTLEVEL> = {
    //l11 cant be created without 4 passages minimum
    [PASSAGELEVEL.l1]:
      randBool || passages.length < 4 ? TESTLEVEL.l10 : TESTLEVEL.l11,
    [PASSAGELEVEL.l2]: randBool ? TESTLEVEL.l20 : TESTLEVEL.l21,
    [PASSAGELEVEL.l3]: TESTLEVEL.l30,
    [PASSAGELEVEL.l4]: TESTLEVEL.l40,
    [PASSAGELEVEL.l5]: TESTLEVEL.l50
  };
  if (typeof targetTestLevel === "number") {//if specific level is selected
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

