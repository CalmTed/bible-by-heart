import { StyleSheet } from "react-native";
import { PassageModel } from "./models";
import { API_VERSION } from "bbh-shared";

export const VERSION = "0.1.0";

export const alowedStateVersions = [
  "0.0.4",
  "0.0.5",
  "0.0.6",
  "0.0.7",
  "0.0.8",
  "0.0.9",
  VERSION
]; //make translators for imported data

// API_VERSION is sourced from the shared contract (bbh-shared) - the single source
// of truth shared with the server. Can't sync with an outdated version.
export { API_VERSION };

export enum LANGCODE {
  en = "en",
  ua = "ua"
}

export const STORAGE_NAME = "data";
// Two separate recovery slots on purpose (8.1.8). STORAGE_BACKUP_NAME is the
// rolling daily backup written by AppProvider - it is always at the CURRENT
// state version and is overwritten every 24h. STORAGE_PRECONVERT_BACKUP_NAME
// holds the raw state as it was BEFORE the very first state-version conversion
// this install ever ran; it is written once and never overwritten, so a broken
// converter (or a chain of them) can never destroy the last known-good data.
// They shared one key until 8.1.8, which meant the daily backup silently ate
// the pre-conversion snapshot within a day of an upgrade.
export const STORAGE_BACKUP_NAME = "backup";
export const STORAGE_PRECONVERT_BACKUP_NAME = "preConvertBackup";
export const STORAGE_LOGGER = "logs";

export const ARCHIVED_NAME = "Archived";

export const BACKGROUND_NOTIFICATION_NAME = "backgroundNotificationName";
export const CUSTOM_TRANSLATION_NAME = "null";

export const PERFECT_TESTS_TO_PROCEED = 4;
export const TEST_LIST_NUMBER = 10;
export const MAX_L50_TRIES = 5; //with bonus for a long passage
export const ERRORS_TO_DOWNGRADE = 2;
export const DEFAULT_TRAINMODE_ID = 3;
export const SENTENCE_SEPARATOR = /[.!?;]/g;
export const MINIMUM_SENTENCE_LENGTH = 20;
export const FIRST_FEW_WORDS = 4;

export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = HOUR * 24;

export const LOGGER_MAX_ARRAY_SIZE = 1000;

export const ACCESS_TOKEN_NAME = "accessToken";
export const REFRESH_TOKEN_NAME = "refreshToken";

export const APIVERSION_LAST_CHECK = "apiVersionLastCheck";
export const APIVERSION_MAX_TIME = MINUTE;
export const APIVERSION_STATUS = "apiVersionStatus";

export const PRIVACY_POLICY_LINK =
  "https://biblebyheart.app/static/bible-by-heart-privacy-policy.html";
export const TERMS_OF_SERVICE_LINK =
  "https://biblebyheart.app/static/bible-by-heart-terms-of-service.html";

export enum SCREEN {
  home = "home",
  listPassage = "listPassage",
  passage = "passage",
  stats = "stats",
  test = "test",
  testResults = "testResults",
  settings = "settings",
  calendar = "calendar",
  login = "login",
  register = "register",
  // Settings sub-menus — real stack screens (used to be MiniModals nested in the
  // settings list; converted to screens to drop the modal slide animation).
  settingsList = "settingsList",
  settingsTests = "settingsTests",
  settingsNotifications = "settingsNotifications",
  settingsStats = "settingsStats",
  settingsAbout = "settingsAbout",
  settingsUser = "settingsUser",
  // Nested lists inside the sub-menus above (were modal-in-modal).
  settingsTranslations = "settingsTranslations",
  settingsReminders = "settingsReminders",
  settingsTrainModes = "settingsTrainModes"
}

export enum SORTINGOPTION {
  //sorting option: address, dateCreated, dateTrained, selectedLevel, mexLevel, errorCount
  address = "address",
  resentlyCreated = "resentlyCreated",
  oldestToTrain = "oldestToTrain",
  selectedLevel = "selectedLevel",
  maxLevel = "maxLevel"
}

export enum STATSMETRICS {
  minutes = "minutes",
  sesstions = "sessions",
  verses = "verses"
}

export enum THEMETYPE {
  auto = "auto",
  dark = "dark",
  light = "light"
}

export const VIBRATION_PATTERNS = {
  testRight: [0, 20, 190, 20],
  testWrong: [0, 300],
  wordClick: 10,
  APSelectVerse: 10
};

export const COLOR_DARK = {
  bg: "#272A27",
  bgBackdrop: "#272A2799",
  bgSecond: "#2C302C",
  text: "#ECECEC",
  textSecond: "#A0A0A0",
  textDanger: "#E5633B",
  mainColor: "#1A9E37",
  gradient1: "#1A9E37",
  gradient2: "#1A869E",
  redGradient1: "#E53B3B",
  redGradient2: "#E5633B"
};

export const COLOR_LIGHT = {
  bg: "#E0EEE0",
  bgBackdrop: "#E9E9E999",
  bgSecond: "#D0DDD0",
  text: "#323933",
  textSecond: "#898989",
  textDanger: "#E49278",
  mainColor: "#7FDE34",
  gradient1: "#E7DF0B",
  gradient2: "#7FDE34",
  redGradient1: "#E77D7B",
  redGradient2: "#E49278"
};

export const THEME_DARK = StyleSheet.create({
  screen: {
    paddingTop: 30,
    backgroundColor: COLOR_DARK.bg,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start"
  },
  view: {
    backgroundColor: COLOR_DARK.bg,
    width: "100%",
    height: "100%",
    alignItems: "center"
  },
  text: {
    color: COLOR_DARK.text,
    fontSize: 14
  },
  subText: {
    color: COLOR_DARK.textSecond,
    fontSize: 18
  },
  headerText: {
    color: COLOR_DARK.text,
    fontSize: 21,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  rowView: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  fullWidth: {
    width: "100%"
  },
  flexOne: {
    flex: 1
  },
  marginVertical: {
    marginVertical: 20
  },
  gap20: {
    gap: 20
  }
});

export const THEME_LIGHT: typeof THEME_DARK = {
  screen: {
    ...THEME_DARK.screen,
    backgroundColor: COLOR_LIGHT.bg
  },
  view: {
    ...THEME_DARK.view,
    backgroundColor: COLOR_LIGHT.bg
  },
  text: {
    ...THEME_DARK.text,
    color: COLOR_LIGHT.text
  },
  subText: {
    ...THEME_DARK.subText,
    color: COLOR_LIGHT.textSecond
  },
  headerText: {
    ...THEME_DARK.headerText,
    color: COLOR_LIGHT.text
  },
  rowView: {
    ...THEME_DARK.rowView
  },
  fullWidth: {
    ...THEME_DARK.fullWidth
  },
  flexOne: {
    ...THEME_DARK.flexOne
  },
  marginVertical: {
    ...THEME_DARK.marginVertical
  },
  gap20: {
    ...THEME_DARK.gap20
  }
};

export enum TESTLEVEL {
  l10 = 10,
  l11 = 11,
  l20 = 20,
  l21 = 21,
  l30 = 30,
  l40 = 40,
  l50 = 50
}
export enum PASSAGELEVEL {
  l1 = 1,
  l2 = 2,
  l3 = 3,
  l4 = 4,
  l5 = 5
}

export enum SETTINGS {
  langCode = "langCode",
  theme = "theme",
  chapterNumbering = "chapterNumbering",
  devModeActivationTime = "devModeActivationTime",
  devModeEnabled = "devModeEnabled",

  remindersEnabled = "remindersEnabled",
  remindersSmartTime = "remindersSmartTime",
  remindersList = "remindersList",

  hapticsEnabled = "hapticsEnabled",
  soundsEnabled = "soundsEnabled",
  compressOldTestsData = "compressOldTestsData",
  leftSwipeTag = "leftSwipeTag",
  autoIncreaseLevel = "autoIncreaseLevel",

  translations = "translations",
  homeScreenStatsType = "homeScreenStatsType",
  homeScreenWeeklyMetric = "homeScreenWeeklyMetric",

  trainModesList = "trainModesList",
  activeTrainModeId = "activeTrainModeId"
}

export const PASSAGE_ROWS_TO_EXPORT = [
  "address",
  "verseText",
  "verseTranslation",
  "tags"
] as (keyof PassageModel)[];

export const TRANSLATIONS_TO_FETCH = [1];

export enum API_LINK {
  apiVersion = "api/version",
  icon = "static/logo.png",
  createUser = "api/user/create",
  login = "api/user/login",
  refreshToken = "api/user/refreshToken",
  logout = "api/user/logout",
  getUserData = "api/user/get",
  editUserData = "api/user/edit",
  removeUser = "api/user/remove",
  requestEmailComfirmation = "api/user/requestEmailConfirmation",
  requestPasswordReset = "api/user/requestPaswordReset"
}
