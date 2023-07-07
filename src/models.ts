import {
    LANGCODE,
    PASSAGE_LEVEL,
    SETTINGS,
    SORTING_OPTION,
    STATS_METRICS,
    TEST_LEVEL,
    THEME_TYPE
} from './constants';

export type AppStateModel = AppStateModel0_0_8;

export interface AppStateModel0_0_8 {
    version: string;
    apiVersion: string;//not implemented yet
    lastChange: number;
    dateSyncTry: number;//not implemented yet
    dateSyncSuccess: number;//not implemented yet
    passages: PassageModel[];
    testsActive: TestModel0_0_7[];
    testsHistory: TestModel0_0_7[];
    userId: number | null;//not implemented yet
    filters: {
        tags: string[];
        selectedLevels: PASSAGE_LEVEL[];
        maxLevels: PASSAGE_LEVEL[];
        translations: number[];
    };
    sort: SORTING_OPTION;
    settings: {
        [SETTINGS.langCode]: LANGCODE;
        [SETTINGS.theme]: THEME_TYPE;
        [SETTINGS.devMode]: boolean;
        [SETTINGS.chapterNumbering]: 'eastern' | 'vestern';//not implemented yet
        [SETTINGS.hapticsEnabled]: boolean;
        [SETTINGS.soundsEnabled]: boolean;//not implemented yet
        [SETTINGS.compressOldTestsData]: boolean;//not implemented yet
        [SETTINGS.autoIncreeseLevel]: boolean;
        [SETTINGS.leftSwipeTag]: string;

        [SETTINGS.remindersEnabled]: boolean;
        [SETTINGS.remindersSmartTime]: boolean;
        [SETTINGS.remindersList]: ReminderModel[];

        [SETTINGS.translations]: TranslationModel[];
        [SETTINGS.homeScreenStatsType]:
            | 'auto'
            | 'dayStreak'
            | 'absoluteProgress'
            | 'monthProgress';//not implemented yet
        [SETTINGS.homeScreenWeeklyMetric]: STATS_METRICS;

        [SETTINGS.trainModesList]: TrainModeModel[]; //new in 0.0.8
        [SETTINGS.activeTrainModeId]: number; //new in 0.0.8
    };
}

export interface AppStateModel0_0_7 {
    version: string;
    apiVersion: string;
    lastChange: number;
    dateSyncTry: number;
    dateSyncSuccess: number;
    passages: PassageModel[];
    testsActive: TestModel0_0_7[];
    testsHistory: TestModel0_0_7[];
    userId: number | null;
    filters: {
        tags: string[];
        selectedLevels: PASSAGE_LEVEL[];
        maxLevels: PASSAGE_LEVEL[];
        translations: number[];
    };
    sort: SORTING_OPTION;
    settings: {
        [SETTINGS.langCode]: LANGCODE;
        [SETTINGS.theme]: THEME_TYPE;
        [SETTINGS.devMode]: boolean;
        [SETTINGS.chapterNumbering]: 'eastern' | 'vestern';
        [SETTINGS.hapticsEnabled]: boolean;
        [SETTINGS.soundsEnabled]: boolean;
        [SETTINGS.compressOldTestsData]: boolean;
        [SETTINGS.autoIncreeseLevel]: boolean;
        [SETTINGS.leftSwipeTag]: string; // options from existring tags, archive by default  TODO check on tag removing

        [SETTINGS.remindersEnabled]: boolean;
        [SETTINGS.remindersSmartTime]: boolean; // based on last month of tests history
        [SETTINGS.remindersList]: ReminderModel[];

        [SETTINGS.translations]: TranslationModel[]; //dont need id for now, just user provided name
        [SETTINGS.homeScreenStatsType]:
            | 'auto'
            | 'dayStreak'
            | 'absoluteProgress'
            | 'monthProgress';
        [SETTINGS.homeScreenWeeklyMetric]: STATS_METRICS;

        [SETTINGS.trainModesList]: TrainModeModel[]; //new in 0.0.8
    };
}

export interface PassageModel {
    id: number;
    ownerId: number | null; //userId
    address: AddressType;
    versesNumber: number;
    verseText: string;
    verseTranslation: number | null; //item id from settings.translation
    dateCreated: number;
    dateEdited: number;
    dateTested: number;
    minIntervalDaysNum: number | null;
    selectedLevel: PASSAGE_LEVEL;
    maxLevel: PASSAGE_LEVEL; //set on end by a history of tests
    isNewLevelAwalible: boolean;
    tags: string[]; //archive and custom
    isReminderOn: boolean;
    isCollapsed: boolean;
}

export interface exportingModel {
    version: string;
    passages: PassageModel[];
}

export type TestModel = TestModel0_0_7;

export interface TestModel0_0_7 {
    //for every passage every practice session
    id: number;
    sessionId: number; //tests are created before every session and deleted if not finished
    passageId: number;
    userId: number | null;
    triesDuration: number[][]; // start and finish
    isFinished: boolean;
    level: TEST_LEVEL;
    testData: {
        addressOptions?: AddressType[];
        passagesOptions?: PassageModel[];
        missingWords?: number[]; //word index
        showAddressOrFirstWords?: boolean;
    };
    errorNumber: number | null; // 0 if passed without error
    errorType:
        | (
              | 'wrongAddressToVerse'
              | 'wrongVerseToAddress'
              | 'wrongWord'
              | 'wrongFirstWord'
              | 'moreThenOneCharacter'
              | 'other'
          )
        | null;
    wrongAddress: AddressType[];
    wrongPassagesId: number[];
    wrongWords: [number, string][]; //word index, wrong word string
}

export interface ReminderModel {
    //>=0.0.7
    id: number;
    enabled: boolean;
    timeInSec: number; //in seconds from midnight
    days: {
        dayMO: boolean;
        dayTU: boolean;
        dayWE: boolean;
        dayTH: boolean;
        dayFR: boolean;
        daySA: boolean;
        daySU: boolean;
    };
}
export interface TranslationModel {
    //>=0.0.7
    id: number;
    editable: boolean;
    isDefault: boolean;
    name: string;
    addressLanguage: LANGCODE;
}
export interface TrainModeModel {
    //>=0.0.7
    id: number;
    editable: boolean; //aka removable
    name: string;
    enabled: boolean;
    length: number; //5-20,all
    translation: number | null;
    includeTags: string[];
    excludeTags: string[];
    testAsLevel: PASSAGE_LEVEL | null;//null is passage level
    sort: SORTING_OPTION;
}

export interface OptionModel {
    value: string; // no numbers for now
    label: string; // not WORD because it could be user provided value
}

export interface AddressType {
    bookIndex: number;
    startChapterNum: number;
    startVerseNum: number;
    endChapterNum: number;
    endVerseNum: number;
}

export enum ActionName {
    setLang = 'setLang',
    setTheme = 'setTheme',
    setPassage = 'setPassage',
    setLeftSwipeTag = 'setLeftSwipeTag',
    setPassagesList = 'setPassagesList',
    removePassage = 'removePassage',
    setActiveTests = 'setActiveTests',
    updateTest = 'updateTest',
    finishTesting = 'finishTesting',
    setPassageLevel = 'setPassageLevel',
    disableNewLevelFlag = 'disableNewLevelFlag',
    setDevMode = 'setDevMode',
    setSorting = 'setSorting',
    toggleFilter = 'toggleFilter',
    setSettingsParam = 'setSettingsParam',
    setTranslationsList = 'setTranslationsList',
    setRemindersList = 'setRemindersList',
    setTrainModesList = 'setTrainModesList',
}
export type ActionModel =
    | {
          name: ActionName.setLang;
          payload: LANGCODE;
      }
    | {
          name: ActionName.setTheme;
          payload: THEME_TYPE;
      }
    | {
          name: ActionName.setPassage;
          payload: PassageModel;
      }
    | {
          name: ActionName.setLeftSwipeTag;
          payload: string;
      }
    | {
          name: ActionName.setSettingsParam;
          payload: {
              param: SETTINGS;
              value: boolean | string | number;
          };
      }
    | {
          name: ActionName.setPassagesList;
          payload: PassageModel[];
      }
    | {
          name: ActionName.removePassage;
          payload: number; //passageId
      }
    | {
          name: ActionName.setActiveTests;
          payload: TestModel[];
      }
    | {
          name: ActionName.updateTest;
          payload: {
              test: TestModel;
              isRight: boolean;
          };
      }
    | {
          name: ActionName.finishTesting;
          payload: {
              tests: TestModel[];
          };
      }
    | {
          name: ActionName.setPassageLevel;
          payload: {
              passageId: number;
              level: PASSAGE_LEVEL;
          };
      }
    | {
          name: ActionName.disableNewLevelFlag;
          payload: number;
      }
    | {
          name: ActionName.setDevMode;
          payload: boolean;
      }
    | {
          name: ActionName.setSorting;
          payload: SORTING_OPTION;
      }
    | {
          name: ActionName.toggleFilter;
          payload: {
              tag?: string;
              selectedLevel?: PASSAGE_LEVEL;
              maxLevel?: PASSAGE_LEVEL;
              translationId?: number;
          };
      }
    | {
          name: ActionName.setTranslationsList;
          payload: TranslationModel[];
      }
    | {
          name: ActionName.setRemindersList;
          payload: ReminderModel[];
      }
    | {
          name: ActionName.setTrainModesList;
          payload: TrainModeModel[];
      };

/* state archive */
export interface AppStateModel0_0_6 {
    version: string;
    apiVersion: string;
    lastChange: number;
    dateSyncTry: number;
    dateSyncSuccess: number;
    passages: PassageModel[];
    testsActive: TestModel0_0_6[];
    testsHistory: TestModel0_0_6[];
    langCode: LANGCODE;
    theme: 'dark' | 'light' | 'auto';
    chapterNumbering: 'eastern' | 'vestern';
    devMode: boolean;
    reminderTimes: number[];
    userId: number | null;
    filters: {
        tags: string[];
        selectedLevels: PASSAGE_LEVEL[];
        maxLevels: PASSAGE_LEVEL[];
    };
    sort: SORTING_OPTION;
}

export interface TestModel0_0_6 {
    //for every passage every practice session
    id: number;
    sessionId: number; //tests are created before every session and deleted if not finished
    passageId: number;
    userId: number | null;
    // triesDuration: [number, number][]// start and finish
    dateStarted: number; //was non array in <0.0.7
    dateFinished: number; //was non array in <0.0.7
    level: TEST_LEVEL;
    testData: {
        addressOptions?: AddressType[];
        passagesOptions?: PassageModel[];
        missingWords?: number[]; //word index
        showAddressOrFirstWords?: boolean;
    };
    errorNumber: number | null; // 0 if passed without error
    errorType:
        | (
              | 'wrongAddressToVerse'
              | 'wrongVerseToAddress'
              | 'wrongWord'
              | 'wrongFirstWord'
              | 'moreThenOneCharacter'
              | 'other'
          )
        | null;
    wrongAddress: AddressType[];
    wrongPassagesId: number[];
    wrongWords: [number, string][]; //word index, wrong word string
}
