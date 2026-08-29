import { StyleSheet } from "react-native";
import Constants from "expo-constants";
import { PassageModel } from "./models";
import { API_VERSION } from "bbh-shared";

// The version of the STATE SHAPE, not of the app. `alowedStateVersions` and every
// converter in `stateVersionConvert.ts` are written against it, so it moves only
// when the shape does - it was never meant to track package.json (8.2.32).
export const VERSION = "0.1.0";

// The version of the APP, for anything a user is shown. `app.config.js` already
// takes it from package.json, so reading it back out of the config is the one
// place it cannot drift - which is exactly what it did for six releases while the
// About screen printed the state version instead (8.2.32).
export const APP_VERSION = Constants.expoConfig?.version ?? "";

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
// The tag filter is a hide-list of tag names, so "passages with no tags at all"
// needs a name of its own to be nameable there (8.2.25). A leading control
// character keeps it out of reach of any tag a user could type.
export const NO_TAGS_NAME = "\u0000NoTags";

export const BACKGROUND_NOTIFICATION_NAME = "backgroundNotificationName";
export const CUSTOM_TRANSLATION_NAME = "null";

// How many options a test that asks the user to PICK one has to offer (8.2.36).
// One option is not a test: it cannot be got wrong, and it is still recorded as
// a pass, which is what the level-up maths counts. A level that cannot reach
// this many options is not that level - it becomes the half of its level that
// asks about the address instead, which needs no library to draw decoys from.
export const MIN_TEST_OPTIONS = 4;

export const PERFECT_TESTS_TO_PROCEED = 4;
// How many times a "study this one" session repeats its single passage.
// Deliberately <= PERFECT_TESTS_TO_PROCEED: a drill is practice, and one drill
// alone must not be able to hand out a level upgrade (8.2.1c).
export const STUDY_ONE_REPEATS = 3;
export const TEST_LIST_NUMBER = 10;
export const MAX_L50_TRIES = 5; //with bonus for a long passage
export const ERRORS_TO_DOWNGRADE = 2;
export const DEFAULT_TRAINMODE_ID = 3;
export const MINIMUM_SENTENCE_LENGTH = 20;
export const FIRST_FEW_WORDS = 4;
// Longest passage-option button title before it is cut with an ellipsis (L11, L21).
export const OPTION_TITLE_MAX_LENGTH = 50;
// How many sentences of context L40/L50 show around the range being typed.
export const CONTEXT_SENTENCES = 3;

export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = HOUR * 24;

export const LOGGER_MAX_ARRAY_SIZE = 1000;

// Coalescing window for the state persist in AppContext. Serializing the whole
// state is O(history), so it runs at most once per this many ms instead of once
// per action (8.2.20); whatever is pending is flushed when the app leaves the
// foreground, so nothing can be lost to a kill mid-window.
export const STATE_PERSIST_DEBOUNCE = 1000;

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
  // Passage-list sub-menu - was a full-screen MiniModal inside ListScreen
  // (8.2.2). A scrolling multi-section list is navigation, not a dialog.
  listFilters = "listFilters",
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
  settingsTrainModes = "settingsTrainModes",
  // Dev-mode log viewer - was a full-screen MiniModal inside the About
  // sub-menu (8.2.2).
  settingsLog = "settingsLog"
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
  APSelectVerse: 10,
  // a long press that changed something - the list row collapsing (8.2.8)
  longPress: 30
};

// Candy-UI motion vocabulary (0.3.0). Every reanimated surface pulls its timing
// from here so the whole app springs the same way - inventing per-component
// numbers is what makes an animated app feel assembled rather than designed.
// SPRING is deliberately slightly under-damped: the ~2% overshoot is the "candy"
// bounce. Durations stay short; anything above ~250ms reads as sluggish on the
// old small Androids this app must stay pleasant on.
export const ANIMATION = {
  fadeMs: 160,
  spring: {
    damping: 18,
    stiffness: 220,
    mass: 0.6
  },
  // how far a surface travels while it fades in, in px
  riseDistance: 16,
  // How far the Header falls INTO place from above (8.2.29). A bar is a frame,
  // not content: it arrives from the edge it lives on rather than rising from
  // below like the screen it caps, which read as the two scrambling past each
  // other. Half of riseDistance on purpose - the frame must move LESS than what
  // is arriving underneath it, or the eye follows the wrong thing.
  headerDropDistance: 8,
  // scale a surface starts from before settling at 1
  riseScale: 0.94,
  // How long a surface waits before entering, when something else is already
  // moving underneath it (8.2.3: the Header behind its screen transition). Short
  // enough that the two still read as one gesture, long enough that the order is
  // legible - the card lands, then its header arrives. Starting both at once
  // looks like one thing stuttering rather than two things arriving.
  staggerMs: 90,
  // How far a control sinks under a finger (8.2.4). Deliberately smaller than
  // riseScale: an entrance may be theatrical, a press must not be - it happens
  // dozens of times a session and any bigger reads as the button wobbling.
  pressScale: 0.96,
  // Gesture geometry (8.2.28). `swipeThreshold` is how far a finger has to
  // travel before a swipe counts as asking for a screen rather than as a
  // twitch; `pullTrigger` is the longer pull the practice arrow needs, because
  // that gesture STARTS a session and a session is not something to fall into;
  // `pullMax` is where the arrow stops following the finger, so an enormous
  // drag does not walk it down the screen. Here rather than in the one
  // component for the same reason the spring is: the next surface that takes a
  // swipe must feel like this one, not invent its own numbers.
  swipeThreshold: 60,
  pullTrigger: 88,
  pullMax: 120
};

// The app is one column of content, and on a foldable or a tablet that column
// must stop growing rather than stretch a passage across 1800px (8.2.4). Same
// principle as ANIMATION: the number lives in one place, so every wide-screen
// surface stops at the same width instead of each picking its own.
// The app mark's natural size (8.2.31). The artwork is 255x160, so a caller
// picks a height and the width follows - the home screen scales it to the phone
// it is on rather than every screen hard-coding 255.
export const LOGO_HEIGHT = 160;
export const LOGO_RATIO = 255 / 160;

export const LAYOUT = {
  maxContentWidth: 560,
  // The app bar's own height, above whatever the device's top inset adds. It
  // lives here rather than in `Header.tsx` because `screenTransition.ts` needs
  // it too (8.2.28 gives the vertical screens a gesture band exactly one bar
  // deep), and a util reaching into a component would close the loop
  // navigator -> Header -> AppContext -> navigator.
  headerHeight: 60,
  // How far the last row of a scrolling surface clears the screen edge (8.2.27).
  // A list that ends flush against the bottom reads as cut off rather than
  // finished - and on the two screens that sized their scroll area in percent it
  // WAS cut off. One number, so every list ends the same way.
  scrollBottomGap: 24
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
  // No `paddingTop` here on purpose (8.2.3). It used to be a flat 30, which
  // every screen wore *in addition to* its Header's real device inset - so the
  // bar sat 30px lower than it should on a screen that had one, and screens
  // without one had 30px standing in for a status bar that is 47 on some phones
  // and 24 on others. The top margin belongs to `Header`, which measures it.
  screen: {
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
  },
  // The contentContainerStyle of any scrolling surface (8.2.27): its last row
  // clears the screen edge instead of ending flush against it. Colourless like
  // rowView/gap20, and shared so every list in the app ends the same way.
  scrollContent: {
    paddingBottom: LAYOUT.scrollBottomGap
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
  },
  scrollContent: {
    ...THEME_DARK.scrollContent
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
