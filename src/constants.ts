import { StyleSheet } from 'react-native';

export const VERSION = '1.0.0';

export const API_VERSION = '0.0.1';
//cant sync with oudated version
//can convert one stare version to the new one
//recreate the state if version is outdated

export const storageName = 'data';

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
    }
});
export enum TestLevel {
    l10 = 10,
    l11 = 11,
    l20 = 20,
    l21 = 21,
    l30 = 30,
    l40 = 40,
    l50 = 50
}
export enum PassageLevel {
    l1 = 1,
    l2 = 2,
    l3 = 3,
    l4 = 4,
    l5 = 5
}
