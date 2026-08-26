/**
 * A realistic 0.0.6-era app state.
 *
 * `versionsConvertionTable` maps 0.0.4, 0.0.5 and 0.0.6 through the same
 * converter (`to007`), so this one shape covers the whole pre-settings era —
 * pass the wanted label to `makeState006()`.
 *
 * Everything is hand written with fixed ids and fixed timestamps: no `create*`
 * factory is used, because those inject random ids and `Date.now()` and a
 * converted state could then only be asserted loosely.
 */
import {
  ARCHIVED_NAME,
  LANGCODE,
  PASSAGELEVEL,
  SORTINGOPTION,
  TESTLEVEL
} from "../../src/constants";
import {
  AddressType,
  AppStateModel006,
  PassageModel008,
  TestModel006
} from "../../src/models";

export const DAY_MS = 24 * 60 * 60 * 1000;
/** 2024-01-01T09:00:00Z — the anchor every other fixture date hangs off. */
export const T0 = new Date("2024-01-01T09:00:00.000Z").getTime();

/* passages */
export const P006_JOHN_ID = 1001;
export const P006_PSALM_ID = 1002;
export const P006_ROMANS_ID = 1003;
export const P006_PHIL_ID = 1004;
/** a passage the user deleted while its tests stayed in history */
export const P006_DELETED_ID = 1999;

/* tests */
export const T006_JOHN_L10_ID = 2001;
export const T006_JOHN_L11_ID = 2002;
export const T006_JOHN_L20_ID = 2003;
export const T006_PSALM_L10_ID = 2004;
export const T006_PSALM_L30_ID = 2005;
export const T006_ORPHAN_ID = 2006;
export const T006_ACTIVE_ID = 2007;

export const P006_JOHN_CREATED = T0;
export const P006_PSALM_CREATED = T0 + DAY_MS / 2;
export const P006_ROMANS_CREATED = T0 + DAY_MS;
export const P006_PHIL_CREATED = T0 + 2 * DAY_MS;

/** finish time of the last level-1 test of John 3:16 — `to009` derives the
 *  level-2 upgrade date from it (the try right before the first l20 test). */
export const T006_JOHN_L11_FINISH = T0 + 2 * DAY_MS + 40 * 1000;
/** same idea for Psalm 23 jumping straight to a level-3 test */
export const T006_PSALM_L10_FINISH = T0 + 4 * DAY_MS + 40 * 1000;

const johnAddress: AddressType = {
  bookIndex: 42, //John
  startChapterNum: 3,
  startVerseNum: 16,
  endChapterNum: 3,
  endVerseNum: 16
};
const psalmAddress: AddressType = {
  bookIndex: 18, //Psalms
  startChapterNum: 23,
  startVerseNum: 1,
  endChapterNum: 23,
  endVerseNum: 6
};
const romansAddress: AddressType = {
  bookIndex: 44, //Romans
  startChapterNum: 8,
  startVerseNum: 28,
  endChapterNum: null,
  endVerseNum: null
};
const philAddress: AddressType = {
  bookIndex: 49, //Philippians
  startChapterNum: 4,
  startVerseNum: 6,
  endChapterNum: 4,
  endVerseNum: 7
};

const makePassages006: () => PassageModel008[] = () => [
  {
    id: P006_JOHN_ID,
    ownerId: null,
    address: johnAddress,
    versesNumber: 1,
    verseText: "For God so loved the world...",
    verseTranslation: 1,
    dateCreated: P006_JOHN_CREATED,
    dateEdited: P006_JOHN_CREATED,
    dateTested: T0 + 3 * DAY_MS,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l2,
    maxLevel: PASSAGELEVEL.l2,
    isNewLevelAwalible: false,
    tags: ["Gospel"],
    isReminderOn: true,
    isCollapsed: false
  },
  {
    id: P006_PSALM_ID,
    ownerId: null,
    address: psalmAddress,
    versesNumber: 6,
    verseText: "The Lord is my shepherd; I shall not want...",
    verseTranslation: 2,
    dateCreated: P006_PSALM_CREATED,
    dateEdited: P006_PSALM_CREATED + DAY_MS,
    dateTested: T0 + 5 * DAY_MS,
    minIntervalDaysNum: 14,
    selectedLevel: PASSAGELEVEL.l3,
    maxLevel: PASSAGELEVEL.l3,
    isNewLevelAwalible: true,
    tags: [ARCHIVED_NAME, "Psalms"],
    isReminderOn: false,
    isCollapsed: true
  },
  {
    //the only passage with an owner — 0.0.9 turns the numeric id into a string
    id: P006_ROMANS_ID,
    ownerId: 42,
    address: romansAddress,
    versesNumber: 1,
    verseText: "And we know that for those who love God all things work together for good...",
    verseTranslation: 1,
    dateCreated: P006_ROMANS_CREATED,
    dateEdited: P006_ROMANS_CREATED,
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l1,
    maxLevel: PASSAGELEVEL.l1,
    isNewLevelAwalible: false,
    tags: [],
    isReminderOn: false,
    isCollapsed: false
  },
  {
    //trained up to level 4 before the app kept a history — the 0.0.9 converter
    //has to fall back to "now" for its upgrade date
    id: P006_PHIL_ID,
    ownerId: null,
    address: philAddress,
    versesNumber: 2,
    verseText: "Do not be anxious about anything...",
    verseTranslation: 1,
    dateCreated: P006_PHIL_CREATED,
    dateEdited: P006_PHIL_CREATED,
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: PASSAGELEVEL.l4,
    maxLevel: PASSAGELEVEL.l4,
    isNewLevelAwalible: false,
    tags: ["Gospel"],
    isReminderOn: false,
    isCollapsed: false
  }
];

const test006: (arg: {
  id: number;
  passageId: number;
  level: TESTLEVEL;
  startedAt: number;
  durationSec?: number;
  extra?: Partial<TestModel006>;
}) => TestModel006 = ({
  id,
  passageId,
  level,
  startedAt,
  durationSec = 40,
  extra = {}
}) => ({
  id,
  sessionId: Math.floor((startedAt - T0) / DAY_MS) + 1,
  passageId,
  userId: null,
  dateStarted: startedAt,
  dateFinished: startedAt + durationSec * 1000,
  level,
  testData: {},
  errorNumber: 0,
  errorType: null,
  wrongAddress: [],
  wrongPassagesId: [],
  wrongWords: [],
  ...extra
});

const makeHistory006: () => TestModel006[] = () => [
  test006({
    id: T006_JOHN_L10_ID,
    passageId: P006_JOHN_ID,
    level: TESTLEVEL.l10,
    startedAt: T0 + DAY_MS
  }),
  test006({
    id: T006_JOHN_L11_ID,
    passageId: P006_JOHN_ID,
    level: TESTLEVEL.l11,
    startedAt: T0 + 2 * DAY_MS,
    extra: {
      errorNumber: 1,
      errorType: "wrongWord",
      wrongWords: [[3, "loveed"]]
    }
  }),
  test006({
    id: T006_JOHN_L20_ID,
    passageId: P006_JOHN_ID,
    level: TESTLEVEL.l20,
    startedAt: T0 + 3 * DAY_MS,
    extra: {
      errorNumber: 2,
      errorType: "wrongAddressToVerse",
      wrongAddress: [psalmAddress],
      wrongPassagesId: [P006_PSALM_ID]
    }
  }),
  test006({
    id: T006_PSALM_L10_ID,
    passageId: P006_PSALM_ID,
    level: TESTLEVEL.l10,
    startedAt: T0 + 4 * DAY_MS
  }),
  test006({
    id: T006_PSALM_L30_ID,
    passageId: P006_PSALM_ID,
    level: TESTLEVEL.l30,
    startedAt: T0 + 5 * DAY_MS,
    durationSec: 120
  }),
  test006({
    //history of a passage the user has deleted since
    id: T006_ORPHAN_ID,
    passageId: P006_DELETED_ID,
    level: TESTLEVEL.l10,
    startedAt: T0 + 6 * DAY_MS
  })
];

/**
 * @param version one of the versions `to007` accepts (0.0.4 / 0.0.5 / 0.0.6).
 */
export const makeState006: (version?: string) => AppStateModel006 = (
  version = "0.0.6"
) => ({
  version,
  apiVersion: "0.0.1",
  lastChange: T0 + 6 * DAY_MS,
  dateSyncTry: T0 + 5 * DAY_MS,
  dateSyncSuccess: T0 + 5 * DAY_MS,
  passages: makePassages006(),
  testsActive: [
    test006({
      id: T006_ACTIVE_ID,
      passageId: P006_ROMANS_ID,
      level: TESTLEVEL.l10,
      startedAt: T0 + 7 * DAY_MS
    })
  ],
  testsHistory: makeHistory006(),
  //flat settings — the whole point of the 0.0.7 hop is folding these into `settings`
  langCode: LANGCODE.ua,
  theme: "dark",
  chapterNumbering: "eastern",
  devMode: true,
  reminderTimes: [28800, 72000],
  userId: 42,
  filters: {
    tags: [ARCHIVED_NAME, "Gospel"],
    selectedLevels: [PASSAGELEVEL.l1, PASSAGELEVEL.l2],
    maxLevels: [PASSAGELEVEL.l3]
  },
  sort: SORTINGOPTION.resentlyCreated
});
