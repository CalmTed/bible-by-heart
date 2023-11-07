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
  PassageModel,
  ReminderModel,
  TestModel,
  TrainModeModel,
  TranslationModel
} from "./models";
import { createT } from "./l10n";

const genId: () => number = () => {
  return Math.round(Math.random() * 1000000000);
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
      [SETTINGS.devMode]: false,
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
      [SETTINGS.devMode]: false,
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

export const createAppState: () => AppStateModel = () => {
  try {
    return createAppState008();
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
      translation: lang === LANGCODE.en ? 1 : 2,
      includeTags: [],
      excludeTags: [ARCHIVED_NAME],
      testAsLevel: null,
      sort: SORTINGOPTION.oldestToTrain
    }
  ];
};

export const getVersesNumber: (adress: AddressType) => number = (address) => {
  //if one verse (end == null || edn == start)
  if (
    (!address.endChapterNum && !address.endVerseNum) ||
    (address.endChapterNum === address.startChapterNum &&
      address.endVerseNum === address.startVerseNum)
  ) {
    return 1;
  }
  //if same chapter but diff verses (endVerse - startVerse)
  if (
    address.endChapterNum === address.startChapterNum &&
    address.endVerseNum !== address.startVerseNum
  ) {
    return Math.abs(address.endVerseNum - address.startVerseNum) + 1;
  }
  //if if next chapter from reference: (from start-verse to the end of start-chapter) + (from start of end-chapter to the end-verse)
  const fromStartingChapter =
    bibleReference[address.bookIndex].chapters[address.startChapterNum] -
    address.startVerseNum +
    1;
  const fromEndingChapter = address.endVerseNum;
  if (Math.abs(address.endChapterNum - address.startChapterNum) === 1) {
    return fromStartingChapter + fromEndingChapter;
  }
  //if diff chapter from reference: (like prev) + (all verses of middle chapters)
  const howManyChaptersBetween =
    Math.abs(address.endChapterNum - address.startChapterNum) - 1;
  if (howManyChaptersBetween > 0) {
    const fromAllChaptersBetween = Array(howManyChaptersBetween)
      .fill(0)
      .map((z, i) => {
        return bibleReference[address.bookIndex].chapters[
          address.startChapterNum + i + 1
        ];
      })
      .reduce((partialSum, a) => partialSum + a, 0);
    return fromStartingChapter + fromAllChaptersBetween + fromEndingChapter;
  }
  console.error(JSON.stringify(address));
  return NaN;
};

export const createPassage: (
  address: AddressType,
  text?: string,
  translation?: number,
  ownnerId?: number
) => PassageModel = (address, text, translation, ownerId) => {
  return {
    id: genId(),
    ownerId: ownerId || null,
    address: address,
    versesNumber: getVersesNumber(address),
    verseText: text || "",
    verseTranslation: translation || null,
    dateCreated: new Date().getTime(),
    dateEdited: new Date().getTime(),
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
    id: genId(),
    sessionId,
    passageId,
    userId: userId || null,
    triesDuration: [],
    isFinished: false,
    level: selectedLevelMatrix(level),
    testData: {},
    errorNumber: null,
    errorType: null,
    wrongAddress: [],
    wrongWords: [],
    wrongPassagesId: []
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
