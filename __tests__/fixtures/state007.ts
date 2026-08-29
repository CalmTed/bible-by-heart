/**
 * A realistic 0.0.7-era app state — the first version with a `settings` object.
 *
 * As with `state006.ts` every id and timestamp is fixed, so the result of the
 * 0.0.7 -> 0.0.8 hop (and of the whole chain) can be asserted exactly.
 *
 * Note the `autoIncreeseLevel` key: that misspelling is what a real 0.0.7/0.0.8
 * state carries on disk — `SETTINGS.autoIncreeseLevel` was the enum member until
 * it was renamed to `autoIncreaseLevel` (commit eb86923, 0.0.9 era). The
 * archived models keep the old key behind a `@ts-ignore`, which degrades it to a
 * numeric index signature, so the fixture re-declares it in an intersection
 * instead of casting.
 */
import {
  ARCHIVED_NAME,
  LANGCODE,
  PASSAGELEVEL,
  SORTINGOPTION,
  STATSMETRICS,
  TESTLEVEL,
  THEMETYPE
} from "../../src/constants";
import {
  AddressType,
  AppStateModel007,
  PassageModel008,
  ReminderModel,
  TestModel007,
  TranslationModel
} from "../../src/models";
import { DAY_MS, T0 } from "./state006";

/* passages */
export const P007_ISAIAH_ID = 3101;
export const P007_MATTHEW_ID = 3102;
export const P007_JAMES_ID = 3103;
/** a passage the user deleted while its tests stayed in history */
export const P007_DELETED_ID = 3999;

/* tests */
export const T007_ISAIAH_L10_ID = 4001;
export const T007_ISAIAH_L21_ID = 4002;
export const T007_MATTHEW_L50_ID = 4003;
export const T007_ORPHAN_ID = 4004;
export const T007_UNFINISHED_ID = 4005;
export const T007_ACTIVE_ID = 4006;

export const P007_ISAIAH_CREATED = T0 + 10 * DAY_MS;
export const P007_MATTHEW_CREATED = T0 + 11 * DAY_MS;
export const P007_JAMES_CREATED = T0 + 12 * DAY_MS;

/** finish time of the level-1 test that precedes the first level-2 test of
 *  Isaiah 41:10 — `to009` uses it as that passage's level-2 upgrade date */
export const T007_ISAIAH_L10_FINISH = T0 + 13 * DAY_MS + 45 * 1000;
/** the level-5 test was answered in two tries — both must survive to 0.1.0 */
export const T007_MATTHEW_L50_TRIES = [
  [T0 + 15 * DAY_MS, T0 + 15 * DAY_MS + 90 * 1000],
  [T0 + 15 * DAY_MS + 120 * 1000, T0 + 15 * DAY_MS + 210 * 1000]
];

export const P007_LEFT_SWIPE_TAG = "Boxed";

const isaiahAddress: AddressType = {
  bookIndex: 22, //Isaiah
  startChapterNum: 41,
  startVerseNum: 10,
  endChapterNum: 41,
  endVerseNum: 10
};
const matthewAddress: AddressType = {
  bookIndex: 39, //Matthew
  startChapterNum: 6,
  startVerseNum: 33,
  endChapterNum: 6,
  endVerseNum: 34
};
const jamesAddress: AddressType = {
  bookIndex: 58, //James
  startChapterNum: 1,
  startVerseNum: 2,
  endChapterNum: 1,
  endVerseNum: 4
};

const makePassages007: () => PassageModel008[] = () => [
  {
    id: P007_ISAIAH_ID,
    ownerId: 7,
    address: isaiahAddress,
    versesNumber: 1,
    verseText: "Fear not, for I am with you...",
    verseTranslation: 1,
    dateCreated: P007_ISAIAH_CREATED,
    dateEdited: P007_ISAIAH_CREATED,
    dateTested: T0 + 14 * DAY_MS,
    minIntervalDaysNum: 7,
    selectedLevel: PASSAGELEVEL.l2,
    maxLevel: PASSAGELEVEL.l2,
    isNewLevelAwalible: false,
    tags: ["Comfort"],
    isReminderOn: true,
    isCollapsed: false
  },
  {
    id: P007_MATTHEW_ID,
    ownerId: null,
    address: matthewAddress,
    versesNumber: 2,
    verseText: "But seek first the kingdom of God...",
    verseTranslation: 1,
    dateCreated: P007_MATTHEW_CREATED,
    dateEdited: P007_MATTHEW_CREATED + DAY_MS,
    dateTested: T0 + 15 * DAY_MS,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l5,
    maxLevel: PASSAGELEVEL.l5,
    isNewLevelAwalible: false,
    tags: ["Gospel", P007_LEFT_SWIPE_TAG],
    isReminderOn: false,
    isCollapsed: false
  },
  {
    id: P007_JAMES_ID,
    ownerId: null,
    address: jamesAddress,
    versesNumber: 3,
    verseText: "Count it all joy, my brothers...",
    verseTranslation: 2,
    dateCreated: P007_JAMES_CREATED,
    dateEdited: P007_JAMES_CREATED,
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l1,
    maxLevel: PASSAGELEVEL.l1,
    isNewLevelAwalible: false,
    tags: [ARCHIVED_NAME],
    isReminderOn: false,
    isCollapsed: true
  }
];

const test007: (arg: {
  id: number;
  passageId: number;
  level: TESTLEVEL;
  triesDuration: number[][];
  extra?: Partial<TestModel007>;
}) => TestModel007 = ({ id, passageId, level, triesDuration, extra = {} }) => ({
  id,
  sessionId: Math.floor((triesDuration[0][0] - T0) / DAY_MS) + 1,
  passageId,
  userId: 7,
  triesDuration,
  isFinished: true,
  level,
  testData: {},
  errorNumber: 0,
  errorType: null,
  wrongAddress: [],
  wrongPassagesId: [],
  wrongWords: [],
  ...extra
});

const makeHistory007: () => TestModel007[] = () => [
  test007({
    id: T007_ISAIAH_L10_ID,
    passageId: P007_ISAIAH_ID,
    level: TESTLEVEL.l10,
    triesDuration: [[T0 + 13 * DAY_MS, T007_ISAIAH_L10_FINISH]],
    extra: {
      //testData is dropped by the 0.0.8 hop — it is only useful mid-session
      testData: {
        addressOptions: [isaiahAddress, matthewAddress],
        showAddressOrFirstWords: true
      }
    }
  }),
  test007({
    id: T007_ISAIAH_L21_ID,
    passageId: P007_ISAIAH_ID,
    level: TESTLEVEL.l21,
    triesDuration: [[T0 + 14 * DAY_MS, T0 + 14 * DAY_MS + 60 * 1000]],
    extra: {
      errorNumber: 1,
      errorType: "wrongFirstWord",
      wrongPassagesId: [P007_MATTHEW_ID]
    }
  }),
  test007({
    id: T007_MATTHEW_L50_ID,
    passageId: P007_MATTHEW_ID,
    level: TESTLEVEL.l50,
    triesDuration: T007_MATTHEW_L50_TRIES,
    extra: {
      errorNumber: 3,
      errorType: "wrongWord",
      wrongWords: [
        [2, "sek"],
        [5, "kindom"]
      ],
      testData: { missingWords: [2, 5], sentenceRange: [0, 1] }
    }
  }),
  test007({
    //history of a passage the user has deleted since
    id: T007_ORPHAN_ID,
    passageId: P007_DELETED_ID,
    level: TESTLEVEL.l30,
    triesDuration: [[T0 + 16 * DAY_MS, T0 + 16 * DAY_MS + 80 * 1000]]
  }),
  {
    //an interrupted session that was written to history — dropped by the 0.0.8 hop
    ...test007({
      id: T007_UNFINISHED_ID,
      passageId: P007_JAMES_ID,
      level: TESTLEVEL.l10,
      triesDuration: [[T0 + 17 * DAY_MS, T0 + 17 * DAY_MS + 20 * 1000]]
    }),
    isFinished: false,
    errorNumber: null
  }
];

// No `sourceId` on purpose: a 0.0.7 translation had none - the field arrives
// with 0.1.1, and giving the fixture one would hide what `to011` has to do.
const makeTranslations007: () => Omit<TranslationModel, "sourceId">[] = () => [
  {
    id: 1,
    editable: false,
    isDefault: false,
    name: "ESV®",
    addressLanguage: LANGCODE.en
  },
  {
    id: 2,
    editable: false,
    isDefault: true,
    name: "UCVNTR",
    addressLanguage: LANGCODE.ua
  },
  {
    id: 3,
    editable: true,
    isDefault: false,
    name: "Огієнко",
    addressLanguage: LANGCODE.ua
  }
];

const makeReminders007: () => ReminderModel[] = () => [
  {
    id: 5001,
    enabled: true,
    timeInSec: 25200,
    days: {
      dayMO: true,
      dayTU: false,
      dayWE: true,
      dayTH: false,
      dayFR: true,
      daySA: false,
      daySU: false
    }
  }
];

/** 0.0.7 settings plus the pre-rename key a real device would have stored. */
export type Settings007WithLegacyKey = AppStateModel007["settings"] & {
  autoIncreeseLevel: boolean;
};

/** a 0.0.7 state whose settings still expose the pre-rename key to the types */
export type State007WithLegacyKey = AppStateModel007 & {
  settings: Settings007WithLegacyKey;
};

const makeSettings007: () => Settings007WithLegacyKey = () => ({
  langCode: LANGCODE.ua,
  theme: THEMETYPE.dark,
  devMode: true,
  chapterNumbering: "eastern",
  hapticsEnabled: false,
  soundsEnabled: false,
  compressOldTestsData: false,
  autoIncreeseLevel: true,
  leftSwipeTag: P007_LEFT_SWIPE_TAG,
  remindersEnabled: true,
  remindersSmartTime: false,
  remindersList: makeReminders007(),
  translations: makeTranslations007(),
  homeScreenStatsType: "dayStreak",
  homeScreenWeeklyMetric: STATSMETRICS.minutes,
  trainModesList: [] //train modes only got defaults in 0.0.8
});

export const makeState007: () => State007WithLegacyKey = () => ({
  version: "0.0.7",
  apiVersion: "0.0.1",
  lastChange: T0 + 17 * DAY_MS,
  dateSyncTry: T0 + 16 * DAY_MS,
  dateSyncSuccess: T0 + 16 * DAY_MS,
  passages: makePassages007(),
  testsActive: [
    test007({
      id: T007_ACTIVE_ID,
      passageId: P007_JAMES_ID,
      level: TESTLEVEL.l10,
      triesDuration: [[T0 + 18 * DAY_MS, T0 + 18 * DAY_MS + 15 * 1000]],
      extra: { isFinished: false }
    })
  ],
  testsHistory: makeHistory007(),
  userId: 7,
  filters: {
    tags: [ARCHIVED_NAME],
    selectedLevels: [PASSAGELEVEL.l5],
    maxLevels: [],
    translations: [1, 3]
  },
  sort: SORTINGOPTION.oldestToTrain,
  settings: makeSettings007()
});
