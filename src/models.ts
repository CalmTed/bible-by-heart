import {
  LANGCODE,
  PASSAGELEVEL,
  SETTINGS,
  SORTINGOPTION,
  STATSMETRICS,
  TESTLEVEL,
  THEMETYPE
} from "./constants";
import { WORD } from "./l10n";

export type AppStateModel = AppStateModel009;

export interface AppStateModel009 {
  version: string;
  apiVersion: string; //not implemented yet
  lastChange: number;
  lastBackup: number;
  dateSyncTry: number; //not implemented yet
  dateSyncSuccess: number; //not implemented yet
  passages: PassageModel009[];
  testsActive: TestModel009[];
  testsHistory: TestModel009[];
  userData: { // not implemented yet
    userId: number | null;
    userName: string | null; 
    userPicture: string | null;
    birthDate: number | null
    authToken: string | null
    loginType: null | "email" | "google" | "apple" | "facebook"
    updateMessages: updateMessageModel[]//later could update it from API
    feedBackMessages: feedbackMessageModel[]
  }
  filters: {
    tags: string[];
    selectedLevels: PASSAGELEVEL[];
    maxLevels: PASSAGELEVEL[];
    translations: number[];
  }
  sort: SORTINGOPTION
  statsDateRange: {//negative number for relative value(from now), positive number for timestamp
    from: number
    to: number
  }
  settings: {
    [SETTINGS.langCode]: LANGCODE;
    [SETTINGS.theme]: THEMETYPE;
    [SETTINGS.devModeEnabled]: boolean;
    [SETTINGS.devModeActivationTime]: number | null;
    [SETTINGS.chapterNumbering]: "eastern" | "vestern"; //not implemented yet
    [SETTINGS.hapticsEnabled]: boolean;
    [SETTINGS.soundsEnabled]: boolean; //not implemented yet
    [SETTINGS.compressOldTestsData]: boolean; //not implemented yet
    [SETTINGS.autoIncreeseLevel]: boolean;
    [SETTINGS.leftSwipeTag]: string;

    [SETTINGS.remindersEnabled]: boolean;
    [SETTINGS.remindersSmartTime]: boolean;
    [SETTINGS.remindersList]: ReminderModel[];

    [SETTINGS.translations]: TranslationModel[];
    [SETTINGS.homeScreenStatsType]:
      | "auto"
      | "dayStreak"
      | "absoluteProgress"
      | "monthProgress"; //not implemented yet
    [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS;

    [SETTINGS.trainModesList]: TrainModeModel[]; //new in 0.0.8
    [SETTINGS.activeTrainModeId]: number; //new in 0.0.8
  }
}



export type PassageModel = PassageModel009;

export interface PassageModel009 {
  id: number;
  ownerId: number | null; //userId
  address: AddressType;
  versesNumber: number;
  verseText: string;
  verseTranslation: number | null; //item id from settings.translation
  dateCreated: number;
  dateEdited: number;
  dateTested: number;
  selectedLevel: PASSAGELEVEL;
  maxLevel: PASSAGELEVEL; //set on the end of testing according to history of tests
  upgradeDates: Record<PASSAGELEVEL, number>//number of upgrade to derive relative score
  minIntervalDaysNum: number | null;//aka reminder number of days
  isNewLevelAwalible: boolean;
  tags: string[]; //archive and custom
  isReminderOn: boolean;
  isCollapsed: boolean;
}

export interface ExportingModel {
  version: string;
  passages: PassageModel[];
}

export type TestModel = TestModel009;

export interface TestModel009 {
  //id
  i: number;
  //session id
  si: number; //tests are created before every session and deleted if not finished
  //passage id
  pi: number;
  //user id
  ui: number | null;
  //tries duration 
  td: number[][]; // start and finish
  //is finished
  f: boolean;
  //level
  l: TESTLEVEL;
  //test data
  d: {
    addressOptions?: AddressType[];
    passagesOptions?: PassageModel[];
    missingWords?: number[]; //word index
    showAddressOrFirstWords?: boolean;
    sentenceRange?: number[];//from..to. Default undefinded or [] is [0,-1]
  };
  //error number
  en: number | null; // 0 if passed without error
  //error types list
  et:(
      | "wrongAddressToVerse"
      | "wrongVerseToAddress"
      | "wrongWord"
      | "wrongFirstWord"
      | "moreThenOneCharacter"
      | "downgrading"
      | "other"
    )[];
  //wrong addresses
  wa: AddressType[];
  //wrong passage ids
  wp: number[];
  //wrong words
  ww: [number, string][]; //word index, wrong word string
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
  testAsLevel: PASSAGELEVEL | null; //null is passage level
  sort: SORTINGOPTION;
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
  setLang = "setLang",
  setTheme = "setTheme",
  setPassage = "setPassage",
  setLeftSwipeTag = "setLeftSwipeTag",
  setPassagesList = "setPassagesList",
  removePassage = "removePassage",
  clearActiveTests = "clearActiveTests",
  generateTests = "generateTests",
  updateTest = "updateTest",
  downgradePassage = "downgradePassage",
  finishTesting = "finishTesting",
  setPassageLevel = "setPassageLevel",
  disableNewLevelFlag = "disableNewLevelFlag",
  setDevMode = "setDevMode",
  setSorting = "setSorting",
  toggleFilter = "toggleFilter",
  setSettingsParam = "setSettingsParam",
  setTranslationsList = "setTranslationsList",
  setRemindersList = "setRemindersList",
  setTrainModesList = "setTrainModesList",
  importPassages = "importPassages"
}
export type ActionModel =
  | {
      name: ActionName.setLang;
      payload: LANGCODE;
    }
  | {
      name: ActionName.setTheme;
      payload: THEMETYPE;
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
      name: ActionName.clearActiveTests;
    }
  | {
    name: ActionName.generateTests
    trainModeId?: number;
  }
  | {
      name: ActionName.updateTest;
      payload: {
        test: TestModel;
        isRight: boolean;
      };
    }
  | {
      name: ActionName.downgradePassage;
      payload: {
        test: TestModel;
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
        level: PASSAGELEVEL;
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
      payload: SORTINGOPTION;
    }
  | {
      name: ActionName.toggleFilter;
      payload: {
        tag?: string;
        selectedLevel?: PASSAGELEVEL;
        maxLevel?: PASSAGELEVEL;
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
    } 
  | {
      name: ActionName.importPassages;
      payload: {
        passages: PassageModel[]
      }
  };
  interface updateMessageModel {
    id: number
    header: WORD
    text: WORD
    buttonHeader: WORD
    image: string //small base64 file or external link
    link: string
    isRead: boolean
  } 

  interface feedbackMessageModel {
    id: number
    creatorUserId: number
    timeCreated: number
    timeRead: number | null
    text: string
    //for future
    attachmentLink: string | null
    attechmentType: "photo" | "video" | "file" | "other"
  }






/* state archive */


export interface PassageModel008 {
  id: number;
  ownerId: number | null; //userId
  address: AddressType;
  versesNumber: number;
  verseText: string;
  verseTranslation: number | null; //item id from settings.translation
  dateCreated: number;
  dateEdited: number;
  dateTested: number;
  minIntervalDaysNum: number | null;//aka reminder number of days
  selectedLevel: PASSAGELEVEL;
  maxLevel: PASSAGELEVEL; //set on end by a history of tests
  isNewLevelAwalible: boolean;
  tags: string[]; //archive and custom
  isReminderOn: boolean;
  isCollapsed: boolean;
}

export interface AppStateModel008 {
  version: string;
  apiVersion: string; //not implemented yet
  lastChange: number;
  lastBackup: number;
  dateSyncTry: number; //not implemented yet
  dateSyncSuccess: number; //not implemented yet
  passages: PassageModel008[];
  testsActive: TestModel007[];
  testsHistory: TestModel007[];
  userId: number | null; //not implemented yet
  filters: {
    tags: string[];
    selectedLevels: PASSAGELEVEL[];
    maxLevels: PASSAGELEVEL[];
    translations: number[];
  };
  sort: SORTINGOPTION;
  settings: {
    [SETTINGS.langCode]: LANGCODE;
    [SETTINGS.theme]: THEMETYPE;
    "devMode": boolean;//just devMode settings name was removed
    [SETTINGS.chapterNumbering]: "eastern" | "vestern"; //not implemented yet
    [SETTINGS.hapticsEnabled]: boolean;
    [SETTINGS.soundsEnabled]: boolean; //not implemented yet
    [SETTINGS.compressOldTestsData]: boolean; //not implemented yet
    [SETTINGS.autoIncreeseLevel]: boolean;
    [SETTINGS.leftSwipeTag]: string;

    [SETTINGS.remindersEnabled]: boolean;
    [SETTINGS.remindersSmartTime]: boolean;
    [SETTINGS.remindersList]: ReminderModel[];

    [SETTINGS.translations]: TranslationModel[];
    [SETTINGS.homeScreenStatsType]:
      | "auto"
      | "dayStreak"
      | "absoluteProgress"
      | "monthProgress"; //not implemented yet
    [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS;

    [SETTINGS.trainModesList]: TrainModeModel[]; //new in 0.0.8
    [SETTINGS.activeTrainModeId]: number; //new in 0.0.8
  };
}

export interface TestModel007 {
  //for every passage every practice session
  id: number;
  sessionId: number; //tests are created before every session and deleted if not finished
  passageId: number;
  userId: number | null;
  triesDuration: number[][]; // start and finish
  isFinished: boolean;
  level: TESTLEVEL;
  testData: {
    addressOptions?: AddressType[];
    passagesOptions?: PassageModel008[];
    missingWords?: number[]; //word index
    showAddressOrFirstWords?: boolean;
    sentenceRange?: number[];//from..to. Default undefinded or [] is [0,-1]
  };
  errorNumber: number | null; // 0 if passed without error
  errorType:
    | (
        | "wrongAddressToVerse"
        | "wrongVerseToAddress"
        | "wrongWord"
        | "wrongFirstWord"
        | "moreThenOneCharacter"
        | "other"
      )
    | null;
  wrongAddress: AddressType[];
  wrongPassagesId: number[];
  wrongWords: [number, string][]; //word index, wrong word string
}

export interface AppStateModel007 {
  version: string;
  apiVersion: string;
  lastChange: number;
  dateSyncTry: number;
  dateSyncSuccess: number;
  passages: PassageModel008[];
  testsActive: TestModel007[];
  testsHistory: TestModel007[];
  userId: number | null;
  filters: {
    tags: string[];
    selectedLevels: PASSAGELEVEL[];
    maxLevels: PASSAGELEVEL[];
    translations: number[];
  };
  sort: SORTINGOPTION;
  settings: {
    [SETTINGS.langCode]: LANGCODE;
    [SETTINGS.theme]: THEMETYPE;
    devMode: boolean;
    [SETTINGS.chapterNumbering]: "eastern" | "vestern";
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
      | "auto"
      | "dayStreak"
      | "absoluteProgress"
      | "monthProgress";
    [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS;

    [SETTINGS.trainModesList]: TrainModeModel[]; //new in 0.0.8
  };
}

export interface AppStateModel006 {
  version: string;
  apiVersion: string;
  lastChange: number;
  dateSyncTry: number;
  dateSyncSuccess: number;
  passages: PassageModel008[];
  testsActive: TestModel006[];
  testsHistory: TestModel006[];
  langCode: LANGCODE;
  theme: "dark" | "light" | "auto";
  chapterNumbering: "eastern" | "vestern";
  devMode: boolean;
  reminderTimes: number[];
  userId: number | null;
  filters: {
    tags: string[];
    selectedLevels: PASSAGELEVEL[];
    maxLevels: PASSAGELEVEL[];
  };
  sort: SORTINGOPTION;
}

export interface TestModel006 {
  //for every passage every practice session
  id: number;
  sessionId: number; //tests are created before every session and deleted if not finished
  passageId: number;
  userId: number | null;
  // triesDuration: [number, number][]// start and finish
  dateStarted: number; //was non array in <0.0.7
  dateFinished: number; //was non array in <0.0.7
  level: TESTLEVEL;
  testData: {
    addressOptions?: AddressType[];
    passagesOptions?: PassageModel008[];
    missingWords?: number[]; //word index
    showAddressOrFirstWords?: boolean;
  };
  errorNumber: number | null; // 0 if passed without error
  errorType:
    | (
        | "wrongAddressToVerse"
        | "wrongVerseToAddress"
        | "wrongWord"
        | "wrongFirstWord"
        | "moreThenOneCharacter"
        | "other"
      )
    | null;
  wrongAddress: AddressType[];
  wrongPassagesId: number[];
  wrongWords: [number, string][]; //word index, wrong word string
}
