import { LANGCODE, PassageLevel, TestLevel } from './constants';

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
    selectedLevel: PassageLevel;
    maxLevel: PassageLevel; //set on end by a history of tests
    isNewLevelAwalible: boolean;
    tags: string[]; //archive and custom
    isReminderOn: boolean;
    isCollapsed: boolean;
}

export interface TestModel {
    //for every passage every practice session
    id: number;
    sessionId: number; //tests are created before every session and deleted if not finished
    passageId: number;
    userId: number | null;
    dateStarted: number;
    dateFinished: number;
    level: TestLevel;
    testData: {
        addressOptions?: AddressType[];
        passagesOptions?: PassageModel[];
        missingWords?: [number];
        showAddressOrFirstWords?: boolean;
    };
    errorNumber: number | null; // 0 if passed without error
    errorType:
        | (
              | 'wrongAddressToVerse'
              | 'wrongVerseToAddress'
              | 'wrongWord'
              | 'wrongFirstWord'
              | 'other'
          )
        | null;
    wrongAddress: AddressType[];
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
    removePassage = 'removePassage',
    setActivatTests = 'setActivatTests',
    updateTest = 'updateTest',
    finishTesting = 'finishTesting'
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
          name: ActionName.removePassage;
          payload: number; //passageId
      }
    | {
          name: ActionName.setActivatTests;
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
      };
