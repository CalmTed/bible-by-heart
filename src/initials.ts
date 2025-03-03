import { getLocales } from "expo-localization";
import { bibleReference } from "./bibleReference";
import {
  API_VERSION,
  LANGCODE,
  PASSAGELEVEL,
  SETTINGS,
  SORTINGOPTION,
  STATSMETRICS,
  TESTLEVEL,
  TEST_LIST_NUMBER,
  THEMETYPE,
  VERSION,
  ARCHIVED_NAME,
  DEFAULT_TRAINMODE_ID
} from "./constants";
import {
  AddressType,
  AppStateModel,
  AppStateModel006,
  AppStateModel007,
  AppStateModel008,
  AppStateModel009,
  PassageModel,
  PassageModel008,
  ReminderModel,
  TestModel,
  TrainModeModel,
  TranslationModel
} from "./models";
import { createT } from "./l10n";
import { getNumberOfVerses } from "./tools/getNumberOfVerses";

const genId: () => number = () => {
  return Math.round(Math.random() * 1000000000);
};

export const createAppState009: () => AppStateModel009 = () => {
  const phoneLangCode = getLocales()[0].languageCode;
  const langCode = phoneLangCode === "uk" ? LANGCODE.ua : LANGCODE.en;
  return {
    version: VERSION,
    lastChange: 0,
    lastBackup: 0,
    dateSyncTry: 0,
    dateSyncSuccess: 0,
    apiVersion: API_VERSION,
    userData: {
      userId: null,
      userName: null, 
      userPicture: null,
      birthDate: null, 
      authToken: null,
      loginType: null,
      updateMessages: [
        //TODO add defaults ones here
      ],
      feedBackMessages: []
    },
    passages: [],
    testsActive: [],
    testsHistory: [],
    filters: {
      tags: [ARCHIVED_NAME],
      selectedLevels: [],
      maxLevels: [],
      translations: []
    },
    sort: SORTINGOPTION.address,
    statsDateRange: {
      from: 0,
      to: -1
    },
    settings: {
      [SETTINGS.langCode]: langCode,
      [SETTINGS.theme]: THEMETYPE.auto,
      [SETTINGS.devModeEnabled]: false,
      [SETTINGS.devModeActivationTime]: null,
      [SETTINGS.chapterNumbering]: "vestern",
      [SETTINGS.hapticsEnabled]: true,
      [SETTINGS.soundsEnabled]: true,
      [SETTINGS.compressOldTestsData]: true,
      [SETTINGS.autoIncreeseLevel]: false,
      [SETTINGS.leftSwipeTag]: ARCHIVED_NAME, // options from existring tags, archive by default  TODO check on tag removing

      [SETTINGS.remindersEnabled]: true,
      [SETTINGS.remindersSmartTime]: true, // based on last month of tests history
      [SETTINGS.remindersList]: [],

      [SETTINGS.translations]: getDefaultTranslations(langCode), //dont need id for now, just user provided name
      [SETTINGS.homeScreenStatsType]: "auto", //dont need id for now, just user provided name
      [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS.verses,
      [SETTINGS.trainModesList]: getDefaultTrainModes(langCode),
      [SETTINGS.activeTrainModeId]: getDefaultTrainModes(langCode)[0].id
    }
  };
};

export const createAppState: () => AppStateModel = () => {
  try {
    return createAppState009();
  } catch (err) {
    throw new Error(`Error: ${err}`);
  }
};

export const getDefaultTranslations: (lang: LANGCODE) => TranslationModel[] = (
  lang
) => [
  {
    id: 1,
    editable: false,
    name: "ESV®",
    addressLanguage: LANGCODE.en,
    isDefault: lang === LANGCODE.en
  },
  {
    id: 2,
    editable: false,
    name: "UCVNTR",
    addressLanguage: LANGCODE.ua,
    isDefault: lang === LANGCODE.ua
  }
];

export const getDefaultTrainModes: (lang: LANGCODE) => TrainModeModel[] = (
  lang
) => {
  return [
    {
      id: DEFAULT_TRAINMODE_ID,
      editable: false,
      name: createT(lang)("DefaultTrainModeName"),
      enabled: true,
      length: TEST_LIST_NUMBER,
      translation: 0,//if users selects other language
      includeTags: [],
      excludeTags: [ARCHIVED_NAME],
      testAsLevel: null,
      sort: SORTINGOPTION.oldestToTrain
    }
  ];
};

export const createPassage009: (
  address: AddressType,
  text?: string,
  translation?: number,
  ownnerId?: number
) => PassageModel = (address, text, translation, ownerId) => {
  const birthTime = new Date().getTime();
  return {
    id: genId(),
    ownerId: ownerId || null,
    address: address,
    versesNumber: getNumberOfVerses(address),
    verseText: text || "",
    verseTranslation: translation || null,
    dateCreated: birthTime,
    dateEdited: birthTime,
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l1,
    maxLevel: PASSAGELEVEL.l1,
    upgradeDates:{
      [PASSAGELEVEL.l1]: birthTime,
      [PASSAGELEVEL.l2]: 0,
      [PASSAGELEVEL.l3]: 0,
      [PASSAGELEVEL.l4]: 0,
      [PASSAGELEVEL.l5]: 0,
    },
    isNewLevelAwalible: false,
    tags: [],
    isReminderOn: false,
    isCollapsed: false
  };
};

export const createPassage = createPassage009;

export const createTest: (
  sessionId: number,
  passageId: number,
  level: PASSAGELEVEL,
  userId?: number
) => TestModel = (sessionId, passageId, level, userId) => {
  const selectedLevelMatrix = (pLevel: PASSAGELEVEL) => {
    switch (pLevel) {
      case PASSAGELEVEL.l1:
        return Math.random() > 0.5 ? TESTLEVEL.l10 : TESTLEVEL.l11;
      case PASSAGELEVEL.l2:
        return Math.random() > 0.5 ? TESTLEVEL.l20 : TESTLEVEL.l21;
      case PASSAGELEVEL.l3:
        return TESTLEVEL.l30;
      case PASSAGELEVEL.l4:
        return TESTLEVEL.l40;
      case PASSAGELEVEL.l5:
        return TESTLEVEL.l50;
    }
  };
  return {
    i: genId(),
    si: sessionId,
    pi: passageId,
    ui: userId || null,
    td: [],
    f: false,
    l: selectedLevelMatrix(level),
    d: {},
    en: null,
    et: [],
    wa: [],
    wp: [],
    ww: []
  };
};

export const createAddress: () => AddressType = () => {
  return {
    bookIndex: NaN,
    startChapterNum: NaN,
    startVerseNum: NaN,
    endChapterNum: NaN,
    endVerseNum: NaN
  };
};

export const createTranslation: (lang?: LANGCODE) => TranslationModel = (
  lang = LANGCODE.en
) => {
  return {
    id: genId(),
    addressLanguage: lang,
    name: createT(lang)("NewTranslationName"),
    editable: true,
    isDefault: false
  };
};

export const createReminder: () => ReminderModel = () => {
  return {
    id: genId(),
    days: {
      dayMO: true,
      dayTU: true,
      dayWE: true,
      dayTH: true,
      dayFR: true,
      daySA: true,
      daySU: true
    },
    timeInSec: 28800,
    enabled: true
  };
};

export const createTrainMode: (
  lang: LANGCODE,
  translationId?: number
) => TrainModeModel = (lang, translationId) => {
  return {
    id: genId(),
    editable: true,
    name: createT(lang)("NewTrainModeName"),
    enabled: true,
    length: 10,
    translation: translationId || null,
    includeTags: [],
    excludeTags: [],
    testAsLevel: null,
    sort: SORTINGOPTION.oldestToTrain
  };
};

/* initials archive */

export const createPassage008: (
  address: AddressType,
  text?: string,
  translation?: number,
  ownnerId?: number
) => PassageModel008 = (address, text, translation, ownerId) => {
  const birthTime = new Date().getTime();
  return {
    id: genId(),
    ownerId: ownerId || null,
    address: address,
    versesNumber: getNumberOfVerses(address),
    verseText: text || "",
    verseTranslation: translation || null,
    dateCreated: birthTime,
    dateEdited: birthTime,
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l1,
    maxLevel: PASSAGELEVEL.l1,
    isNewLevelAwalible: false,
    tags: [],
    isReminderOn: false,
    isCollapsed: false
  };
};

export const createAppState008: () => AppStateModel008 = () => {
  const phoneLangCode = getLocales()[0].languageCode;
  const langCode = phoneLangCode === "uk" ? LANGCODE.ua : LANGCODE.en;
  return {
    version: VERSION,
    lastChange: 0,
    lastBackup: 0,
    dateSyncTry: 0,
    dateSyncSuccess: 0,
    apiVersion: API_VERSION,
    passages: [],
    testsActive: [],
    testsHistory: [],
    userId: null,
    filters: {
      tags: [ARCHIVED_NAME],
      selectedLevels: [],
      maxLevels: [],
      translations: []
    },
    sort: SORTINGOPTION.address,
    settings: {
      [SETTINGS.langCode]: langCode,
      [SETTINGS.theme]: THEMETYPE.auto,
      devMode: false,
      [SETTINGS.chapterNumbering]: "vestern",
      [SETTINGS.hapticsEnabled]: true,
      [SETTINGS.soundsEnabled]: true,
      [SETTINGS.compressOldTestsData]: true,
      [SETTINGS.autoIncreeseLevel]: false,
      [SETTINGS.leftSwipeTag]: ARCHIVED_NAME, // options from existring tags, archive by default  TODO check on tag removing

      [SETTINGS.remindersEnabled]: true,
      [SETTINGS.remindersSmartTime]: true, // based on last month of tests history
      [SETTINGS.remindersList]: [],

      [SETTINGS.translations]: getDefaultTranslations(langCode), //dont need id for now, just user provided name
      [SETTINGS.homeScreenStatsType]: "auto", //dont need id for now, just user provided name
      [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS.verses,
      [SETTINGS.trainModesList]: getDefaultTrainModes(langCode),
      [SETTINGS.activeTrainModeId]: getDefaultTrainModes(langCode)[0].id
    }
  };
};

export const createAppState007: () => AppStateModel007 = () => {
  const phoneLangCode = getLocales()[0].languageCode;
  const langCode = phoneLangCode === "uk" ? LANGCODE.ua : LANGCODE.en;
  return {
    version: VERSION,
    lastChange: 0,
    dateSyncTry: 0,
    dateSyncSuccess: 0,
    apiVersion: API_VERSION,
    passages: [],
    testsActive: [],
    testsHistory: [],
    userId: null,
    filters: {
      tags: [ARCHIVED_NAME],
      selectedLevels: [],
      maxLevels: [],
      translations: []
    },
    sort: SORTINGOPTION.address,
    settings: {
      [SETTINGS.langCode]: langCode,
      [SETTINGS.theme]: THEMETYPE.auto,
      devMode: false,
      [SETTINGS.chapterNumbering]: "vestern",
      [SETTINGS.hapticsEnabled]: true,
      [SETTINGS.soundsEnabled]: true,
      [SETTINGS.compressOldTestsData]: true,
      [SETTINGS.autoIncreeseLevel]: false,
      [SETTINGS.leftSwipeTag]: ARCHIVED_NAME, // options from existring tags, archive by default  TODO check on tag removing

      [SETTINGS.remindersEnabled]: true,
      [SETTINGS.remindersSmartTime]: true, // based on last month of tests history
      [SETTINGS.remindersList]: [],

      [SETTINGS.trainModesList]: [],

      [SETTINGS.translations]: getDefaultTranslations(langCode), //dont need id for now, just user provided name
      [SETTINGS.homeScreenStatsType]: "auto", //dont need id for now, just user provided name
      [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS.verses
    }
  };
};

export const createAppState006: () => AppStateModel006 = () => {
  const phoneLangCode = getLocales()[0].languageCode;
  const langCode = phoneLangCode === "uk" ? LANGCODE.ua : LANGCODE.en;
  return {
    version: VERSION,
    lastChange: 0,
    langCode: langCode,
    dateSyncTry: 0,
    dateSyncSuccess: 0,
    theme: "auto",
    apiVersion: API_VERSION,
    chapterNumbering: "vestern",
    passages: [],
    testsActive: [],
    testsHistory: [],
    reminderTimes: [],
    userId: null,
    devMode: false,
    filters: {
      tags: [ARCHIVED_NAME],
      selectedLevels: [],
      maxLevels: []
    },
    sort: SORTINGOPTION.address
  };
};
