import { API_VERSION, LANGCODE, TestLevel, VERSION } from "./constants"
import { AddressType, AppStateModel, PassageModel, TestModel } from "./models"

const genId: () => number = () => {
  return Math.round(Math.random() * 1000000000)
}

export const createAppState: () => AppStateModel = () => {
  return {
    version: VERSION,
    lastChange: 0,
    langCode: LANGCODE.en,
    dateSyncTry: 0,
    dateSyncSuccess: 0,
    theme: "auto",
    apiVersion: API_VERSION,
    chapterNumbering: "vestern",
    passages: [],
    testsActive: [],
    testsHistory: [],
    reminderTimes: [],
    userId: null
  }
}

export const createPassage: (
  address: AddressType,
  text: string,
  translation: string,
  ownnerId?:number
) => PassageModel = (address, text, translation, ownerId) => {
  return {
    id: genId(),
    ownerId: ownerId || null,
    address: address,
    verseText: text,
    verseTranslation: translation,
    dateCreated: new Date().getDate(),
    dateEdited: new Date().getDate(),
    dateTested: 0,
    minIntervalDaysNum: null,
    selectedLevel: TestLevel.l10,
    maxLevel: TestLevel.l10,
    isNewLevelAwalible: false,
    tags: [],
    isReminderOn: false,
    isCollapsed: false
  }
}

export const createTest: (
  sessionId: number,
  passageId: number,
  level: TestLevel,
  userId?: number

) => TestModel = (sessionId, passageId, level, userId) => {
  return {
    id: genId(),
    sessionId,
    passageId,
    userId: userId || null,
    dateStarted: 0,
    dateFinished: 0,
    level,
    isError: false,
    errorType: null,
    wrongAddress: null,
    wrongWords: null
  }
}

export const createAddress: () => AddressType = () => {
  return {
    bookIndex: NaN,
    startChapterNum: NaN,
    startVerseNum: NaN,
    endChapterNum: NaN,
    endVerseNum: NaN
  }
}