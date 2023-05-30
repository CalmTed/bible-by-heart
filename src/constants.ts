import { StyleSheet } from 'react-native';

export const VERSION = '0.0.6';

export const alowedStateVersions = ['0.0.4', '0.0.5', VERSION]; //make translators for imported data

export const API_VERSION = '0.0.1';
//cant sync with oudated version
//can convert one stare version to the new one
//recreate the state if version is outdated

export const storageName = 'data';

export const archivedName = 'Archived';

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

export enum LANGCODE {
    en = 'en',
    ua = 'ua'
}

export enum SORTING_OPTION {
        //sorting option: address, dateCreated, dateTrained, selectedLevel, mexLevel, errorCount
    adress = 'address',
    resentlyCreated = 'resentlyCreated',
    oldestToTrain = 'oldestToTrain',
    selectedLevel = 'selectedLevel',
    maxLevel = 'maxLevel'
}

export const COLOR = {
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

export const globalStyle = StyleSheet.create({
    screen: {
        paddingTop: 30,
        backgroundColor: COLOR.bg,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start'
    },
    view: {
        backgroundColor: COLOR.bg,
        width: '100%',
        height: '100%',
        alignItems: 'center'
    },
    text: {
        color: COLOR.text
    },
    subText: {
        color: COLOR.textSecond,
        fontSize: 18
    },
    headerText: {
        color: COLOR.text,
        fontSize: 20,
        fontWeight: "500",
        textTransform: "uppercase"
    },
    rowView: {
        flexDirection: "row",
        flexWrap: "wrap"
    }
});
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
