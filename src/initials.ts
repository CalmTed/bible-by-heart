import { getLocales } from 'expo-localization';
import { bibleReference } from './bibleReference';
import {
    API_VERSION,
    LANGCODE,
    PASSAGE_LEVEL,
    SETTINGS,
    SORTING_OPTION,
    STATS_METRICS,
    TEST_LEVEL,
    THEME_TYPE,
    VERSION,
    archivedName,
    getDefaultTranslations
} from './constants';
import { AddressType, AppStateModel, AppStateModel0_0_6, AppStateModel0_0_7, PassageModel, TestModel, TranslationModel } from './models';

const genId: () => number = () => {
    return Math.round(Math.random() * 1000000000);
};

export const createAppState0_0_7: () => AppStateModel0_0_7 = () => {
    const phoneLangCode = getLocales()[0].languageCode;
    const langCode = phoneLangCode === 'uk' ? LANGCODE.ua : LANGCODE.en;
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
            tags: [archivedName],
            selectedLevels: [],
            maxLevels: [],
            translations: []
        },
        sort: SORTING_OPTION.address,
        settings: {
            [SETTINGS.langCode]: langCode,
            [SETTINGS.theme]: THEME_TYPE.auto,
            [SETTINGS.devMode]: false,
            [SETTINGS.chapterNumbering]: 'vestern',
            [SETTINGS.hapticsEnabled]: true,
            [SETTINGS.soundsEnabled]: true,
            [SETTINGS.compressOldTestsData]: true,
            [SETTINGS.autoIncreeseLevel]: false,
            [SETTINGS.leftSwipeTag]: archivedName, // options from existring tags, archive by default  TODO check on tag removing
        
            [SETTINGS.remindersEnabled]: true,
            [SETTINGS.remindersSmartTime]: true, // based on last month of tests history
            [SETTINGS.remindersList]: [],

            [SETTINGS.translations]: getDefaultTranslations(langCode),//dont need id for now, just user provided name
            [SETTINGS.homeScreenStatsType]: 'auto',//dont need id for now, just user provided name
            [SETTINGS.homeScreenWeeklyMetric]: STATS_METRICS.verses
        }
    };
};

export const createAppState: () => AppStateModel = createAppState0_0_7;

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
    text: string,
    translation?: number,
    ownnerId?: number
) => PassageModel = (address, text, translation, ownerId) => {
    return {
        id: genId(),
        ownerId: ownerId || null,
        address: address,
        versesNumber: getVersesNumber(address),
        verseText: text,
        verseTranslation: translation || null,
        dateCreated: new Date().getTime(),
        dateEdited: new Date().getTime(),
        dateTested: 0,
        minIntervalDaysNum: null,
        selectedLevel: PASSAGE_LEVEL.l1,
        maxLevel: PASSAGE_LEVEL.l1,
        isNewLevelAwalible: false,
        tags: [],
        isReminderOn: false,
        isCollapsed: false
    };
};

export const createTest: (
    sessionId: number,
    passageId: number,
    level: PASSAGE_LEVEL,
    userId?: number
) => TestModel = (sessionId, passageId, level, userId) => {
    const selectedLevel = (level: PASSAGE_LEVEL) => {
        switch (level) {
            case PASSAGE_LEVEL.l1:
                return Math.random() > 0.5 ? TEST_LEVEL.l10 : TEST_LEVEL.l11;
            case PASSAGE_LEVEL.l2:
                return Math.random() > 0.5 ? TEST_LEVEL.l20 : TEST_LEVEL.l21;
            case PASSAGE_LEVEL.l3:
                return TEST_LEVEL.l30;
            case PASSAGE_LEVEL.l4:
                return TEST_LEVEL.l40;
            case PASSAGE_LEVEL.l5:
                return TEST_LEVEL.l50;
        }
    };
    return {
        id: genId(),
        sessionId,
        passageId,
        userId: userId || null,
        triesDuration: [],
        isFinished: false,
        level: selectedLevel(level),
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

export const createTranslation: (lang?: LANGCODE) => TranslationModel = (lang = LANGCODE.en) => {
    return {
        id: genId(),
        addressLanguage: lang,
        name: "---",
        editable: true,
        isDefault: false
    }
}

/* initials archive */

export const createAppState0_0_6: () => AppStateModel0_0_6 = () => {
    const phoneLangCode = getLocales()[0].languageCode;
    const langCode = phoneLangCode === 'uk' ? LANGCODE.ua : LANGCODE.en;
    return {
        version: VERSION,
        lastChange: 0,
        langCode: langCode,
        dateSyncTry: 0,
        dateSyncSuccess: 0,
        theme: 'auto',
        apiVersion: API_VERSION,
        chapterNumbering: 'vestern',
        passages: [],
        testsActive: [],
        testsHistory: [],
        reminderTimes: [],
        userId: null,
        devMode: false,
        filters: {
            tags: [archivedName],
            selectedLevels: [],
            maxLevels: [],
        },
        sort: SORTING_OPTION.address
    };
};