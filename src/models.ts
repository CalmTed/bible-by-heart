import { LANGCODE } from "./constants"

export interface AppStateModel {
  version: string
  lastChange: number
  langCode: LANGCODE
}

export enum ActionName {
  setLang = "setLang"
}
export type ActionModel = {
  name: ActionName.setLang
  payload: LANGCODE
}