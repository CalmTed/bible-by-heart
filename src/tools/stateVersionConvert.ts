import { PASSAGELEVEL, SETTINGS, VERSION } from "../../src/constants";
import { createAppState007, createAppState008, createPassage009} from "../../src/initials";
import {
  AppStateModel,
  AppStateModel006,
  AppStateModel007,
  AppStateModel008,
  AppStateModel009,
  PassageModel008,
  PassageModel009,
  TestModel006,
  TestModel007,
  TestModel009
} from "../../src/models";
import { testLevelToPassageLevel } from "./levelsConvertion";

type ConverterType = (stateFrom: any) => any;

const to009: ConverterType = (stateFrom) => {
  const from = stateFrom as AppStateModel008
  const convertHistory: (listFrom: TestModel007[]) => TestModel009[] = (listFrom) => {
    const passagesIds = from.passages.map(p => p.id)
    const listTo = listFrom
      .filter(t => t.isFinished && passagesIds.includes(t.passageId))
      .map(t => {
        return {
          i: t.id,
          si: t.sessionId,
          pi: t.passageId,
          ui: null,
          td: t.triesDuration,
          f: true,
          l: t.level,
          d: t.testData,
          en: t.errorNumber,
          et: t.errorType ? [t.errorType] : [],
          wa: t.wrongAddress, 
          wp: t.wrongPassagesId,
          ww: t.wrongWords,
        } as TestModel009
      }).map(({i,si,pi,td,l,en,et,wa,wp,ww}) => {
        //we ignore here here: ui,f,d
        //10 out of 13
        return {i,si,pi,td,l,en,et,wa,wp,ww}
      }) 
    return listTo as TestModel009[]
  }
  const convertPassages: (fromPassages: PassageModel008[], fromHistory: TestModel007[]) => PassageModel009[] = (fromPassages, fromHistory) => {
    return fromPassages.map(fromP => {
      let updatedPassage: PassageModel009 = {
        ...fromP,
        upgradeDates: {
          ...createPassage009(fromP.address).upgradeDates,
          [PASSAGELEVEL.l1]: fromP.dateCreated
        }
      }
      //if this is first occurance of new level mark it as upgrade time
      //speficaly: if upgrateTime for this TESTLEVEL.convertToPassageLevel() is 0
      //BE AWARE: we expect user to not to be able to train in a higher level then max level
      let previusOccurance: TestModel007 | undefined
      fromHistory.sort((a,b) => a.triesDuration[0][1] - b.triesDuration[0][1]).forEach(fromT => {
        if(fromT.passageId === updatedPassage.id){
          const convertedPassageLevel = testLevelToPassageLevel(fromT.level)
          if(updatedPassage.upgradeDates[convertedPassageLevel] === 0){
            updatedPassage = {
              ...updatedPassage,
              upgradeDates: {
                ...updatedPassage.upgradeDates,
                [convertedPassageLevel]: previusOccurance ? previusOccurance.triesDuration[0][1] : fromT.triesDuration[0][1]
              }
            }            
          }
          previusOccurance = fromT
        }
      })
      //in the case if there are no history(for the most curius reasons :) )
      if(updatedPassage.upgradeDates[updatedPassage.maxLevel] === 0){
        updatedPassage.upgradeDates[updatedPassage.maxLevel] = new Date().getTime()
      }
      return updatedPassage
    })
  }
  const to: AppStateModel009 = {
    version: "0.0.9",//updated value
    lastChange: from.lastChange,
    lastBackup: from.lastBackup,
    dateSyncTry: 0,//not implemented yet
    dateSyncSuccess: 0,//not implemented yet
    apiVersion: from.apiVersion,
    userData: {//new group
      userId: null,
      userName: null, 
      userPicture: null,
      birthDate: null, 
      authToken: null,
      loginType: null,
      updateMessages: [
        //TODO add defaults ones here
      ],//later could update it from API
      feedBackMessages: []
    },
    statsDateRange: {
      from: 0,
      to: -1
    },
    passages: convertPassages(from.passages, from.testsHistory),
    testsActive: [],//should be empty
    testsHistory: convertHistory(from.testsHistory),
    filters: from.filters,
    sort: from.sort,
    settings: {
      [SETTINGS.langCode]: from.settings.langCode,
      [SETTINGS.theme]: from.settings.theme,
      [SETTINGS.devModeEnabled]: false,//upadted value
      [SETTINGS.devModeActivationTime]: null, //new parameter
      [SETTINGS.chapterNumbering]: "vestern",//not implemented yet
      [SETTINGS.hapticsEnabled]: from.settings.hapticsEnabled,
      [SETTINGS.soundsEnabled]: from.settings.soundsEnabled,//not implemented yet
      [SETTINGS.compressOldTestsData]: true,//not implemented yet
      [SETTINGS.autoIncreeseLevel]: from.settings.autoIncreeseLevel,
      [SETTINGS.leftSwipeTag]: from.settings.leftSwipeTag, // options from existring tags, archive by default  TODO check on tag removing

      [SETTINGS.remindersEnabled]: from.settings.remindersEnabled,
      [SETTINGS.remindersSmartTime]: from.settings.remindersSmartTime, // based on last month of tests history
      [SETTINGS.remindersList]: from.settings.remindersList,

      [SETTINGS.translations]: from.settings.translations, //dont need id for now, just user provided name
      [SETTINGS.homeScreenStatsType]: "auto", //dont need id for now, just user provided name
      [SETTINGS.homeScreenWeeklyMetric]: from.settings.homeScreenWeeklyMetric,
      [SETTINGS.trainModesList]: from.settings.trainModesList,
      [SETTINGS.activeTrainModeId]: from.settings.activeTrainModeId
    }
  }
  return to;
}

const to008: ConverterType = (stateFrom) => {
  const from = stateFrom as AppStateModel007;
  const convertTests: (arg: TestModel007[]) => TestModel007[] = (arg) => {
    return (
      arg
        //remove unfinished
        .filter((test) => test.isFinished)
        .map((test) => ({
          ...test,
          //remove .testData
          testData: {},
          //change times
          triesDuration: test?.triesDuration || [
            (test as never as TestModel006)?.dateStarted,
            (test as never as TestModel006)?.dateFinished
          ]
        }))
    );
  };

  const initial008 = createAppState008();
  const to = {
    version: "0.0.8",
    lastChange: from.lastChange,
    lastBackup: 0,
    dateSyncTry: from.dateSyncTry,
    dateSyncSuccess: from.dateSyncSuccess,
    apiVersion: "0.0.1",
    passages: from.passages,
    testsActive: [], //removing active tests
    testsHistory: convertTests(from.testsHistory),
    userId: from.userId,
    filters: {
      tags: from.filters.tags,
      selectedLevels: from.filters.selectedLevels,
      maxLevels: from.filters.maxLevels,
      translations: from.filters.translations
    },
    sort: from.sort,
    settings: {
      ...from.settings,
      [SETTINGS.trainModesList]: initial008.settings.trainModesList,
      [SETTINGS.activeTrainModeId]: initial008.settings.activeTrainModeId
    }
  } as AppStateModel008;
  return to;
};

const to007: ConverterType = (stateFrom) => {
  const from = stateFrom as AppStateModel006;

  /*changing state model 0.0.6 to 0.0.7:
  - removed: 
      theme,
      remidersTimes,
      devMode,
      langCode,
      chapterNumbering
      tests.dateStarted
      tests.dateFinished
  + added: settings object
      langCode, theme, devMode, remindersList, chapterNumbering,
      remindersEnabled, remindersSmartTime, hapticsEnabled, soundsEnabled, compressOldTestsData, leftSwipeTag, autoIncreeseLevel, translations,
    filters.translation
    tests.triesDuration

  */
  const initial007 = createAppState007();
  const convertTests: (arg: TestModel006[]) => TestModel007[] = (arg) => {
    return arg.map((test) => {
      return {
        ...test,
        triesDuration: [[test.dateStarted, test.dateFinished]],
        isFinished: true
      } as TestModel007;
    });
  };
  const to = {
    version: "0.0.7",
    lastChange: from.lastChange,
    dateSyncTry: from.dateSyncTry,
    dateSyncSuccess: from.dateSyncSuccess,
    apiVersion: "0.0.1",
    passages: from.passages,
    testsActive: [], //removing active tests
    testsHistory: convertTests(from.testsHistory),
    userId: from.userId,
    filters: {
      tags: from.filters.tags,
      selectedLevels: from.filters.selectedLevels,
      maxLevels: from.filters.maxLevels,
      translations: [] // new in 0.0.7
    },
    sort: from.sort,
    settings: {
      ...initial007.settings,
      ...{
        [SETTINGS.langCode]: from.langCode || initial007.settings.langCode,
        [SETTINGS.theme]: from.theme || initial007.settings.theme,
        devMode: from.devMode || initial007.settings.devMode,
        [SETTINGS.remindersList]: [] || initial007.settings.remindersList, //there were no ways for user to edit this
        [SETTINGS.chapterNumbering]:
          from.chapterNumbering || initial007.settings.chapterNumbering //this too, but who cares, right
      }
    }
  } as AppStateModel007;
  return to;
};

export const versionsConvertionTable: {
  from: string[];
  to: string;
  method: ConverterType;
}[] = [
  {
    from: ["0.0.4", "0.0.5", "0.0.6"],
    to: "0.0.7",
    method: to007
  },
  {
    from: ["0.0.7"],
    to: "0.0.8",
    method: to008
  },
  {
    from: ["0.0.8"],
    to: "0.0.9",
    method: to009
  }
];

export const convertState: (
  fromVersionState: any,
  toVersion?: string,
  finalVersion?: string
) => AppStateModel | null = (
  fromVersionState,
  toVersion = VERSION,
  finalVersion = VERSION
) => {
  //get from
  //get to
  const fromVersion = fromVersionState.version;
  const finalMatch = versionsConvertionTable.find(
    (item) => item.to === finalVersion && item.from.includes(fromVersion)
  );
  const goodMatch = versionsConvertionTable.find(
    (item) =>
      item.to === toVersion &&
      item.from.includes(fromVersion) &&
      item.to !== finalVersion
  );
  const partialMatch = versionsConvertionTable.find(
    (item) =>
      item.from.includes(fromVersion) &&
      item.to !== toVersion &&
      item.to !== finalVersion
  );
  //if perfectMatch
  //convert and return
  if (finalMatch) {
    return finalMatch.method(fromVersionState);
  }
  //if goodMatch
  //convert and recource-in: call itself f(to, final, final)
  else if (goodMatch) {
    return convertState(
      goodMatch.method(fromVersionState),
      finalVersion,
      finalVersion
    );
  }
  //if partialMatcn
  //convert and recource-in: call itself f(from, partialMatch.to, final)
  else if (partialMatch) {
    return convertState(fromVersionState, partialMatch.to, finalVersion);
  } else {
    return null;
  }
};
