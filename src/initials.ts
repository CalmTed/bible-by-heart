import { LANGCODE, VERSION } from "./constants"
import { AppStateModel } from "./models"

export const createAppState: () => AppStateModel = () => {
  return {
    version: VERSION,
    lastChange: 0,
    langCode: LANGCODE.en
  }
}