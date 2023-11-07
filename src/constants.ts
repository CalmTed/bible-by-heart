import { StyleSheet } from "react-native";
import { PassageModel } from "./models";

export const VERSION = "0.0.8";

export const alowedStateVersions = [
  "0.0.4",
  "0.0.5",
  "0.0.6",
  "0.0.7",
  VERSION
]; //make translators for imported data

export const API_VERSION = "0.0.1";
//cant sync with oudated version
//can convert one stare version to the new one
//convert the state if version is outdated

export enum LANGCODE {
  en = "en",
  ua = "ua"
}

export const STORAGE_NAME = "data";
export const STORAGE_BACKUP_NAME = "backup";

export const ARCHIVED_NAME = "Archived";

export const BACKGROUND_NOTIFICATION_NAME = "backgroundNotificationName";
export const CUSTOM_TRANSLATION_NAME = "null";

export const PERFECT_TESTS_TO_PROCEED = 4;
export const TEST_LIST_NUMBER = 10;
export const MAX_L50_TRIES = 5; //with bonus for a long passage
export const ERRORS_TO_DOWNGRADE = 2;
export const DEFAULT_TRAINMODE_ID = 3;

export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = HOUR * 24;

export enum SCREEN {
  home = "home",
  listPassage = "listPassage",
  editPassage = "editPassage",
  addressPicker = "addressPicker",
  test = "test",
  testResults = "testResults",
  settings = "settings"
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
  testRight: [0, 50, 100, 40],
  testWrong: [0, 200],
  wordClick: 15
};

//TODO will make it later
// const colors = Platform.select({
//     ios: {
//         bgDark: "#E7DF0B",
//         bgLight: "#7FDE34"
//         },
//     android: {
//         bgDark: PlatformColor('@android:color/system_accent1_200'),
//         bgLight: PlatformColor('@android:color/system_accent3_500'),
//         }})

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
  devMode = "devMode",

  remindersEnabled = "remindersEnabled",
  remindersSmartTime = "remindersSmartTime",
  remindersList = "remindersList",

  hapticsEnabled = "hapticsEnabled",
  soundsEnabled = "soundsEnabled",
  compressOldTestsData = "compressOldTestsData",
  leftSwipeTag = "leftSwipeTag",
  autoIncreeseLevel = "autoIncreeseLevel",

  translations = "translations",
  homeScreenStatsType = "homeScreenStatsType",
  homeScreenWeeklyMetric = "homeScreenWeeklyMetric",

  trainModesList = "trainModesList",
  activeTrainModeId = "activeTrainModeId"
}

export const PASSAGE_ROWS_TO_EXPORT = [
  "address","verseText", "verseTranslation", "tags"
] as (keyof PassageModel)[]

export const TRANSLATIONS_TO_FETCH = [
  1
]