import { LANGCODE, TestLevel } from "./constants"

export interface AppStateModel {
  version: string
  lastChange: number
  langCode: LANGCODE
  dateSyncTry: number
  dateSyncSuccess: number
  theme: "dark"|"light"|"auto"
  apiVersion: string
  chapterNumbering: "eastern"|"vestern"
  passages: PassageModel[]
  testsActive: TestModel[]
  testsHistory: TestModel[]
  reminderTimes: number[]
  userId: number | null
}

export interface PassageModel{
  id: number
  ownerId: number | null //userId
  address: AddressType
  verseText: string
  verseTranslation: string
  dateCreated: number
  dateEdited: number
  dateTested: number
  minIntervalDaysNum: number | null
  selectedLevel: TestLevel
  maxLevel: TestLevel //set on end by a history of tests
  isNewLevelAwalible: boolean
  tags: string[] //archive and custom
  isReminderOn: boolean
  isCollapsed: boolean
}

export interface TestModel{//for every passage every practice session
  id: number
  sessionId: number //tests are created before every session and deleted in not finished
  passageId: number
  userId: number | null
  dateStarted: number
  dateFinished: number
  level: TestLevel
  isError: boolean
  errorType: "wrongAddressToVerse" | "wrongVerseToAddress" | "wrongWord" | "wrongFirstWord" | "other" | null
  wrongAddress: AddressType | null
  wrongWords: [number, string] | null //word index, wrong word string
}

export interface AddressType{
  bookIndex: number
  startChapterNum: number
  startVerseNum: number
  endChapterNum: number
  endVerseNum: number
}

export enum ActionName {
  setLang = "setLang"
}
export type ActionModel = {
  name: ActionName.setLang
  payload: LANGCODE
}