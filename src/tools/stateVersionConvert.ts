import { SETTINGS, VERSION } from "../../src/constants";
import { createAppState007, createAppState008 } from "../../src/initials";
import {
  AppStateModel,
  AppStateModel006,
  AppStateModel007,
  AppStateModel008,
  TestModel006,
  TestModel007
} from "../../src/models";

type ConverterType = (stateFrom: any) => any;

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
        [SETTINGS.devMode]: from.devMode || initial007.settings.devMode,
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
