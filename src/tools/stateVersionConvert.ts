    import { SETTINGS, VERSION } from "../../src/constants"
import { createAppState0_0_7 } from "../../src/initials"
import { AppStateModel, AppStateModel0_0_6, AppStateModel0_0_7, TestModel0_0_6, TestModel0_0_7 } from "../../src/models"


type converterType = (stateFrom: any) => any

const to007: converterType = (stateFrom) => {
  const from = stateFrom as never as AppStateModel0_0_6

  /*changing state model 0.0.6 to 0.0.7:
  - removed: 
      theme,
      remidersTimes,
      devMode,
      langCode,
      chapterNumbering
      tests.dateStarted
      tests.dateFinished
  + added: settings object
      langCode, theme, devMode, remindersList, chapterNumbering,
      remindersEnabled, remindersSmartTime, hapticsEnabled, soundsEnabled, compressOldTestsData, leftSwipeTag, autoIncreeseLevel, translations,
    filters.translation
    tests.triesDuration

  */
  const initial0_0_7 = createAppState0_0_7();
  const convertTests: (arg: TestModel0_0_6[]) => TestModel0_0_7[] = (arg) => {
    return arg.map(test => {
      return {
        ...test,
        triesDuration: [[test.dateStarted, test.dateFinished]],
        isFinished: true
      } as TestModel0_0_7
  })
  };
  const to = {
    version: "0.0.7",
    lastChange: from.lastChange,
    dateSyncTry: from.dateSyncTry,
    dateSyncSuccess: from.dateSyncSuccess,
    apiVersion: "0.0.1",
    passages: from.passages,
    testsActive: [],//removing active tests
    testsHistory: convertTests(from.testsHistory),
    userId: from.userId,
    filters: {
        tags: from.filters.tags,
        selectedLevels: from.filters.selectedLevels,
        maxLevels: from.filters.maxLevels,
        translations: []// new in 0.0.7
    },
    sort: from.sort,
    settings: {
      ...initial0_0_7.settings,
      ...{
        [SETTINGS.langCode]: from.langCode || initial0_0_7.settings.langCode,
        [SETTINGS.theme]: from.theme || initial0_0_7.settings.theme,
        [SETTINGS.devMode]: from.devMode || initial0_0_7.settings.devMode,
        [SETTINGS.remindersList]: [] || initial0_0_7.settings.remindersList,//there were no ways for user to edit this
        [SETTINGS.chapterNumbering]: from.chapterNumbering || initial0_0_7.settings.chapterNumbering,//this too, but who cares, right
      }
    }
  } as AppStateModel0_0_7
  return to;
}

export const versionsConvertionTable: {
  from: string[]
  to: string,
  method: converterType
}[] = [
  {
    from: ["0.0.4", "0.0.5", "0.0.6"],
    to: "0.0.7",
    method: to007
  }
]
  

export const convertState: (fromVersionState: any, toVersion?: string, finalVersion?: string) => AppStateModel | null = (fromVersionState, toVersion = VERSION, finalVersion = VERSION) => {
  //get from
  //get to
  const fromVersion = fromVersionState.version
  const finalMatch = versionsConvertionTable.find(item => 
    item.to === finalVersion &&
    item.from.includes(fromVersion)
  )
  const goodMatch = versionsConvertionTable.find(item => 
    item.to === toVersion &&
    item.from.includes(fromVersion) &&
    item.to !== finalVersion
  )
  const partialMatch = versionsConvertionTable.find(item =>
    item.from.includes(fromVersion) &&
    item.to !== toVersion &&
    item.to !== finalVersion
  )
  //if perfectMatch
    //convert and return
    if(finalMatch) {
    return finalMatch.method(fromVersionState)
  }
  //if goodMatch
    //convert and recource-in: call itself f(to, final, final)
  else if(goodMatch) {
    return convertState(
      goodMatch.method(fromVersionState),
      finalVersion,
      finalVersion
    )
  }
  //if partialMatcn 
    //convert and recource-in: call itself f(from, partialMatch.to, final)
  else if(partialMatch) {
    return convertState(
      fromVersionState,
      partialMatch.to,
      finalVersion
    )
  }
  else{
    return null
  }
}

