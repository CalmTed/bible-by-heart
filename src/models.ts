import { LANGCODE, PASSAGE_LEVEL, SORTING_OPTION, TEST_LEVEL } from './constants';

export interface AppStateModel {
    version: string;
    lastChange: number;
    langCode: LANGCODE;
    dateSyncTry: number;
    dateSyncSuccess: number;
    theme: 'dark' | 'light' | 'auto';
    apiVersion: string;
    chapterNumbering: 'eastern' | 'vestern';
    passages: PassageModel[];
    testsActive: TestModel[];
    testsHistory: TestModel[];
    reminderTimes: number[];
    userId: number | null;
    devMode: boolean;
    filters: {
        tags: string[],
        selectedLevels: PASSAGE_LEVEL[],
        maxLevels: PASSAGE_LEVEL[]
    },
    sort: SORTING_OPTION
}

export interface PassageModel {
    id: number;
    ownerId: number | null; //userId
    address: AddressType;
    versesNumber: number;
    verseText: string;
    verseTranslation: string | null;
    dateCreated: number;
    dateEdited: number;
    dateTested: number;
    minIntervalDaysNum: number | null;
    selectedLevel: PASSAGE_LEVEL;
    maxLevel: PASSAGE_LEVEL; //set on end by a history of tests
    isNewLevelAwalible: boolean;
    tags: string[]; //archive and custom
    isReminderOn: boolean;
    isCollapsed: boolean;
}

export interface exportingModel {
    version: string;
    passages: PassageModel[];
}

export interface TestModel {
    //for every passage every practice session
    id: number;
    sessionId: number; //tests are created before every session and deleted if not finished
    passageId: number;
    userId: number | null;
    dateStarted: number;
    dateFinished: number;
    level: TEST_LEVEL;
    testData: {
        addressOptions?: AddressType[];
        passagesOptions?: PassageModel[];
        missingWords?: number[]; //word index
        showAddressOrFirstWords?: boolean;
    };
    errorNumber: number | null; // 0 if passed without error
    errorType:
        | (
              | 'wrongAddressToVerse'
              | 'wrongVerseToAddress'
              | 'wrongWord'
              | 'wrongFirstWord'
              | 'moreThenOneCharacter'
              | 'other'
          )
        | null;
    wrongAddress: AddressType[];
    wrongPassagesId: number[];
    wrongWords: [number, string][]; //word index, wrong word string
}

export interface AddressType {
    bookIndex: number;
    startChapterNum: number;
    startVerseNum: number;
    endChapterNum: number;
    endVerseNum: number;
}

export enum ActionName {
    setLang = 'setLang',
    setPassage = 'setPassage',
    setPassagesList = 'setPassagesList',
    removePassage = 'removePassage',
    setActiveTests = 'setActiveTests',
    updateTest = 'updateTest',
    finishTesting = 'finishTesting',
    setPassageLevel = 'setPassageLevel',
    disableNewLevelFlag = 'disableNewLevelFlag',
    setDevMode = 'setDevMode',
    setSorting = 'setSorting',
    toggleFilter = 'toggleFilter'
}
export type ActionModel =
    | {
          name: ActionName.setLang;
          payload: LANGCODE;
      }
    | {
          name: ActionName.setPassage;
          payload: PassageModel;
      }
    | {
          name: ActionName.setPassagesList;
          payload: PassageModel[];
      }
    | {
          name: ActionName.removePassage;
          payload: number; //passageId
      }
    | {
          name: ActionName.setActiveTests;
          payload: TestModel[];
      }
    | {
          name: ActionName.updateTest;
          payload: {
              test: TestModel;
              isRight: boolean;
          };
      }
    | {
          name: ActionName.finishTesting;
          payload: {
              tests: TestModel[];
          };
      }
    | {
          name: ActionName.setPassageLevel;
          payload: {
              passageId: number;
              level: PASSAGE_LEVEL;
          };
      }
    | {
          name: ActionName.disableNewLevelFlag;
          payload: number;
      }
    | {
        name: ActionName.setDevMode;
        payload: boolean;
    }
    | {
            name: ActionName.setSorting;
            payload: SORTING_OPTION
        }
    | {
        name: ActionName.toggleFilter;
        payload: {
            tag?: string
            selectedLevel?: PASSAGE_LEVEL
            maxLevel?: PASSAGE_LEVEL
        }
    };
