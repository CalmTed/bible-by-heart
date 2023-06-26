import { StyleSheet } from 'react-native';
import { TranslationModel } from './models';

export const VERSION = '0.0.7';

export const alowedStateVersions = ['0.0.4', '0.0.5', '0.0.6', VERSION]; //make translators for imported data

export const API_VERSION = '0.0.1';
//cant sync with oudated version
//can convert one stare version to the new one
//recreate the state if version is outdated

export enum LANGCODE {
    en = 'en',
    ua = 'ua'
}

export const storageName = 'data';

export const archivedName = 'Archived';

export const getDefaultTranslations: (lang: LANGCODE) =>  TranslationModel[] = (lang) => [
    {
        id: 1,
        editable: false,
        name: "ESV",
        addressLanguage: LANGCODE.en,
        isDefault: lang === LANGCODE.en
    },
    {
        id: 2,
        editable: false,
        name: "UCVNTR",
        addressLanguage: LANGCODE.ua,
        isDefault: lang === LANGCODE.ua
    },
]

export const PERFECT_TESTS_TO_PRCEED = 3;
export const TEST_LIST_NUMBER = 10;
export const MAX_L50_TRIES = 5;

export enum SCREEN {
    home = 'home',
    listPassage = 'listPassage',
    editPassage = 'editPassage',
    addressPicker = 'addressPicker',
    test = 'test',
    testResults = 'testResults',
    settings = 'settings'
}



export enum SORTING_OPTION {
        //sorting option: address, dateCreated, dateTrained, selectedLevel, mexLevel, errorCount
    address = 'address',
    resentlyCreated = 'resentlyCreated',
    oldestToTrain = 'oldestToTrain',
    selectedLevel = 'selectedLevel',
    maxLevel = 'maxLevel'
}

export enum STATS_METRICS {
    minutes = 'minutes',
    sesstions = 'sessions',
    verses = 'verses'
}

export enum THEME_TYPE{
    auto = "auto",
    dark = "dark",
    light = "light"
}

export const VIBRATION_PATTERNS = {
    testRight: [0,50,100,40],
    testWrong: [0,200],
    wordClick: 15
}

export const COLOR_DARK = {
    bg: '#272A27',
    bgBackdrop: '#272A2799',
    bgSecond: '#2C302C',
    text: '#ECECEC',
    textSecond: '#A0A0A0',
    textDanger: '#E5633B',
    mainColor: '#1A9E37',
    gradient1: '#1A9E37',
    gradient2: '#1A869E',
    redGradient1: '#E53B3B',
    redGradient2: '#E5633B'
};

export const COLOR_LIGHT = {
    bg: '#E0EEE0',
    bgBackdrop: '#E9E9E999',
    bgSecond: '#D0DDD0',
    text: '#323933',
    textSecond: '#898989',
    textDanger: '#E49278',
    mainColor: '#7FDE34',
    gradient1: '#E7DF0B',
    gradient2: '#7FDE34',
    redGradient1: '#E77D7B',
    redGradient2: '#E49278'
};

export const THEME_DARK = StyleSheet.create({
    screen: {
        paddingTop: 30,
        backgroundColor: COLOR_DARK.bg,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start'
    },
    view: {
        backgroundColor: COLOR_DARK.bg,
        width: '100%',
        height: '100%',
        alignItems: 'center'
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
});

export const THEME_LIGHT: typeof THEME_DARK = {
    screen: {
        ...THEME_DARK.screen,
        backgroundColor: COLOR_LIGHT.bg,
    },
    view: {
        ...THEME_DARK.view,
        backgroundColor: COLOR_LIGHT.bg,
    },
    text: {
        ...THEME_DARK.text,
        color: COLOR_LIGHT.text
    },
    subText: {
        ...THEME_DARK.subText,
        color: COLOR_LIGHT.textSecond,
    },
    headerText: {
        ...THEME_DARK.headerText,
        color: COLOR_LIGHT.text,
    },
    rowView: {
        ...THEME_DARK.rowView,
    }
}

export enum TEST_LEVEL {
    l10 = 10,
    l11 = 11,
    l20 = 20,
    l21 = 21,
    l30 = 30,
    l40 = 40,
    l50 = 50
}
export enum PASSAGE_LEVEL {
    l1 = 1,
    l2 = 2,
    l3 = 3,
    l4 = 4,
    l5 = 5
}

export enum SETTINGS{
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
    homeScreenWeeklyMetric = "homeScreenWeeklyMetric"
}

