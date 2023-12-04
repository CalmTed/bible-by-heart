import {
  PERFECT_TESTS_TO_PROCEED,
  PASSAGELEVEL,
  TESTLEVEL,
  DEFAULT_TRAINMODE_ID,
  ARCHIVED_NAME,
  DAY
} from "../constants";
import {
  ActionModel,
  ActionName,
  AppStateModel,
  PassageModel,
  TestModel,
  TrainModeModel
} from "../models";
import { getPerfectTestsNumber } from "./getPerfectTests";
import { getNumberOfVersesInEnglish } from "./getNumberOfEnglishVerses";
import { checkSchedule } from "./notifications";
import { ToastAndroid } from "react-native";
import { generateATest, generateTests, getPassagesByTrainMode } from "./generateTests";
import { createTest } from "../initials";

export const reduce: (
  state: AppStateModel,
  action: ActionModel
) => AppStateModel | null = (state, action) => {
  let changedState: AppStateModel | null = null;

  switch (action.name) {
    case ActionName.setLang:
      let defaultLangChanged = false//this flag is to set new default translation only once, if there are few translations in the same language
      const noPassages = !state.passages.length
      const updatedTranslations = state.settings.translations.map(translation => {
        const isDefault = translation.isDefault
        const isTransLangSameAsInterface = action.payload === translation.addressLanguage;
        if(!isDefault && isTransLangSameAsInterface && !defaultLangChanged){
          defaultLangChanged = true
          return {...translation, isDefault: true}
        }
        if(isDefault && !isTransLangSameAsInterface){
          return {...translation, isDefault: false}
        }
        return translation;
      })
      const updatedTrainModesList = state.settings.trainModesList.map(trainMode => {
        const isDefault = trainMode.id === DEFAULT_TRAINMODE_ID;
        const modeTranslationLangauge = state.settings.translations.filter(translation => translation.id === trainMode.translation)[0].addressLanguage;
        const isModeLangSameAsInterface = action.payload === modeTranslationLangauge;
        const defaultTranslation = updatedTranslations.filter(translation => translation.isDefault)[0]
        if(isDefault && !isModeLangSameAsInterface){
          return {...trainMode, translation: defaultTranslation.id}
        }else{
          return trainMode;
        }
      })
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          langCode: action.payload,
          translations: noPassages ? updatedTranslations : state.settings.translations,
          trainModesList: noPassages ? updatedTrainModesList : state.settings.trainModesList
        }
      };
      break;
    case ActionName.setTheme:
      changedState = {
        ...state,
        settings: { ...state.settings, theme: action.payload }
      };
      break;
    case ActionName.setLeftSwipeTag:
      changedState = {
        ...state,
        settings: { ...state.settings, leftSwipeTag: action.payload }
      };
      break;
    case ActionName.setSettingsParam:
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.param]: action.payload.value
        }
      };
      break;
    case ActionName.setPassage:
      //check number of verses, not just esv but others too

      //check is exists
      if (state.passages.find((p) => p.id === action.payload.id)) {
        const changedPassages = state.passages.map((p) =>
          p.id === action.payload.id
            ? {
                ...action.payload,
                verseText: action.payload.verseText.trim(),
                dateEdited: new Date().getTime()
              }
            : p
        );
        //if tags changed add to filter new ones
        const allTagsBefore = state.passages
          .map((p) => p.tags)
          .flat()
          .filter((v, i, arr) => !arr.slice(0, i).includes(v));
        const allTagsAfter = changedPassages
          .map((p) => p.tags)
          .flat()
          .filter((v, i, arr) => !arr.slice(0, i).includes(v));
        //add new tags
        //we do not remove old ones b.c. user might be using them
        const newTags = allTagsAfter.filter((t) => !allTagsBefore.includes(t));
        //blocking to add more then 500 verses on english
        if (
          getNumberOfVersesInEnglish(
            state.settings.translations,
            changedPassages
          ) > 500
        ) {
          return state;
        }
        changedState = {
          ...state,
          passages: changedPassages,
          filters: {
            ...state.filters,
            tags: [...state.filters.tags, ...newTags]
          }
        };
      } else {
        changedState = {
          ...state,
          passages: [...state.passages, action.payload]
        };
      }
      break;
    case ActionName.setPassagesList:
      changedState = {
        ...state,
        passages: action.payload
      };
      break;
    case ActionName.setDevMode:
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          devModeEnabled: action.payload,
          devModeActivationTime:
            action.payload 
            && !state.settings.devModeActivationTime 
            ? new Date().getTime() 
            : state.settings.devModeActivationTime
        }
      };
      break;
    case ActionName.removePassage:
      changedState = {
        ...state,
        testsHistory: state.testsHistory.filter(
          (t) => t.pi !== action.payload
        ),
        passages: state.passages.filter((p) => p.id !== action.payload)
      };
      break;
    case ActionName.clearActiveTests:
      if (state.testsActive.length) {
        changedState = { ...state, testsActive: [] };
      }
      break;
    case ActionName.generateTests: 
      //if passages exists
      const nonArchivedPassages = state.passages.filter(p => !p.tags.includes(ARCHIVED_NAME))
      if(nonArchivedPassages.length === 0){
         break;
      }
      //if trainMode filtered passages exists
      //selected or default(settings.activeMode)
      const selectedTrainMode = 
        state.settings.trainModesList.filter(t => 
          action.trainModeId 
          ? t.id === action.trainModeId 
          : t.id === state.settings.activeTrainModeId
        )[0]
      const slectedTrainModeWithPassageLanguage:TrainModeModel = {...selectedTrainMode, translation: nonArchivedPassages[0]?.verseTranslation}
      const filteredPassages = getPassagesByTrainMode(state, selectedTrainMode)
      const filteredWithOtherTranslationPassages = getPassagesByTrainMode(state, slectedTrainModeWithPassageLanguage)
      
      const generatedTests = filteredPassages.length ? generateTests(state, selectedTrainMode) : generateTests(state, slectedTrainModeWithPassageLanguage)
      
      let changedDefaultTrainMode: TrainModeModel
      //if there are no passages other then in unknown translation set default mode language to this language
      if(!filteredPassages.length && filteredWithOtherTranslationPassages.length && !selectedTrainMode.editable){
        changedDefaultTrainMode = slectedTrainModeWithPassageLanguage
      }
      const changedSettings = {
        ...state.settings,
        trainModesList: state.settings.trainModesList.map(tm => tm.id === selectedTrainMode.id ? changedDefaultTrainMode ?? tm : tm),
        activeTrainModeId: selectedTrainMode.id
      }
      if(generatedTests){
        changedState = { ...state, testsActive: generatedTests, settings: changedSettings}
      }else{
        console.warn("Unable to generate tests")
      }
    break;
    case ActionName.updateTest:
      const updatedTests = state.testsActive
        .map((t) => {
          if (t.i === action.payload.test.i) {
            return {
              ...action.payload.test,
              f: action.payload.isRight ? true : t.f,
              td: action.payload.test.td.map(
                (td, i, a) =>
                  i === a.length - 1 ? [...td, new Date().getTime()] : td
              )
            };
          }
          return t;
        })
        .sort((a) =>
          action.payload.isRight ? 0 : a.i === action.payload.test.i ? 1 : -1
        );
      //sorting active tests to float last wrong one to the end
      const sortedTests = action.payload.isRight
        ? updatedTests
        : [
            ...updatedTests.filter((t) => !!t.f), //finished
            ...updatedTests.filter((t) => !t.f && !t.en), //unfinished without error
            ...updatedTests.filter((t) => !t.f && !!t.en) //unfinished with error
          ];
      changedState = { ...state, testsActive: sortedTests };
      break;
    case ActionName.downgradePassage:
      //check if level is higher then 1
      if ([TESTLEVEL.l10, TESTLEVEL.l11].includes(action.payload.test.l)) {
        break;
      }
      const levelDowngradingMap: PASSAGELEVEL[] = [
        //0
        PASSAGELEVEL.l1,
        //1
        PASSAGELEVEL.l1,
        //level 2
        PASSAGELEVEL.l1,
        //level 3
        PASSAGELEVEL.l2,
        //level 4
        PASSAGELEVEL.l3,
        //level 5
        PASSAGELEVEL.l4
      ];
      const targetPassage = state.passages.find(
        (p) => p.id === action.payload.test.pi
      );
      if (!targetPassage) {
        break;
      }
      //change selected level
      const newPassageLevel = levelDowngradingMap[targetPassage.selectedLevel];
      //remove date of upgrading to mex level
      const newUpgradeDates = {
        ...targetPassage.upgradeDates,
        [targetPassage.maxLevel]: 0
      }
      const updatedPassages = state.passages.map((p) =>
        p.id === action.payload.test.pi
          ? ({
              ...p,
              //we taking from selectedLevel, b.c. if selected to hard then max is even harder
              selectedLevel: newPassageLevel,
              maxLevel: newPassageLevel,
              upgradeDates: newUpgradeDates
            } as PassageModel)
          : p
      );
      //regenerate test with new level
      const targetTest: TestModel = state.testsActive.filter((t) =>
      t.i === action.payload.test.i)[0]
      
      const recreatedTest:TestModel = {
        ...generateATest (
          createTest(targetTest.si, targetTest.pi, newPassageLevel),
          state.passages,
          newPassageLevel,
          state.testsHistory
        ),
        wa: targetTest.wa,
        ww: targetTest.ww,
        wp: targetTest.wp
      }
      const updatedActiveTests: TestModel[] = state.testsActive.map((t) =>
        t.i === action.payload.test.i
          ? recreatedTest
          : t
      );
      const updatedTestHistory: TestModel[] = [
        ...state.testsHistory,
        {
          ...action.payload.test,
          f: true,
          td: [[action.payload.test.td[0][0], new Date().getTime()]],
          d: {},
          en: action.payload.test.en || 0 + 1,
          et: [...action.payload.test.et, "downgrading"]
        }
      ]
      changedState = {
        ...state,
        testsHistory: updatedTestHistory,
        testsActive: updatedActiveTests,
        passages: updatedPassages
      };
      break;
    case ActionName.finishTesting:
      //updating last test finish time is finished flag
      const finishingTime = new Date().getTime();
      const testsWithUpdatedLastTest = action.payload.tests.map((t) => {
        //clearing testing data
        //summing triesDuration up to one set from..to
        return {
          ...t,
          td: t.td.map((td) =>
            td.length === 1 ? [...td, finishingTime] : td
          ),
          f: true,
          d: {}
        };
      });
      //updating history
      const newHistory = [...state.testsHistory, ...testsWithUpdatedLastTest];
      const newPassages = state.passages.map((p) => {
        //updating passages max level
        //updating passages new level awalible
        const perfectTestsNumber = getPerfectTestsNumber(newHistory, p);
        const hasErrorFromLastThreeTests =
          perfectTestsNumber <= PERFECT_TESTS_TO_PROCEED;
        const nextLevel = {
          [PASSAGELEVEL.l1]: PASSAGELEVEL.l2,
          [PASSAGELEVEL.l2]: PASSAGELEVEL.l3,
          [PASSAGELEVEL.l3]: PASSAGELEVEL.l4,
          [PASSAGELEVEL.l4]: PASSAGELEVEL.l5
        };
        //if has 4 perfect test stroke and not l5
        const level =
          !hasErrorFromLastThreeTests && p.maxLevel !== PASSAGELEVEL.l5
            ? nextLevel[p.maxLevel]
            : p.maxLevel;
        //if new max level is not the current one
        const flag = level !== p.maxLevel;
        const newUpgradeDates = flag 
          ? {
            ...p.upgradeDates,
            [level]: finishingTime
          }
          : p.upgradeDates
        const lastTest = testsWithUpdatedLastTest.find(
          (t) => t.pi === p.id
        );
        //update passages last tested time
        const lastTestedTime = lastTest
          ? lastTest.td[lastTest.td.length - 1]?.[1]
          : p.dateTested;
        return {
          ...p,
          maxLevel: level,
          selectedLevel:
            state.settings.autoIncreeseLevel && level !== p.selectedLevel
              ? level
              : p.selectedLevel,
          isNewLevelAwalible: flag,
          dateTested: lastTestedTime,
          upgradeDates: newUpgradeDates
        };
      });
      //clear active tests
      changedState = {
        ...state,
        testsActive: [],
        testsHistory: newHistory,
        passages: newPassages
      };
      break;
    case ActionName.setPassageLevel:
      const passagesWithNewLevel = state.passages.map((p) =>
        p.id === action.payload.passageId
          ? { ...p, selectedLevel: action.payload.level }
          : p
      );
      changedState = { ...state, passages: passagesWithNewLevel };
      break;
    case ActionName.disableNewLevelFlag:
      changedState = {
        ...state,
        passages: state.passages.map((p) =>
          p.id === action.payload ? { ...p, isNewLevelAwalible: false } : p
        )
      };
      break;
    case ActionName.setSorting:
      changedState = { ...state, sort: action.payload };
      break;
    case ActionName.toggleFilter:
      //id existed add or remove from list
      const newTags = action.payload.tag
        ? state.filters.tags.includes(action.payload.tag)
          ? state.filters.tags.filter((c) => c !== action.payload.tag)
          : [...state.filters.tags, action.payload.tag]
        : state.filters.tags;
      const newSelectedLevels = action.payload.selectedLevel
        ? state.filters.selectedLevels.includes(action.payload.selectedLevel)
          ? state.filters.selectedLevels.filter(
              (c) => c !== action.payload.selectedLevel
            )
          : [...state.filters.selectedLevels, action.payload.selectedLevel]
        : state.filters.selectedLevels;
      const newMaxLevels = action.payload.maxLevel
        ? state.filters.maxLevels.includes(action.payload.maxLevel)
          ? state.filters.maxLevels.filter((c) => c !== action.payload.maxLevel)
          : [...state.filters.maxLevels, action.payload.maxLevel]
        : state.filters.maxLevels;
      const newTranslationFilters = action.payload.translationId
        ? state.filters.translations.includes(action.payload.translationId)
          ? state.filters.translations.filter(
              (c) => c !== action.payload.translationId
            )
          : [...state.filters.translations, action.payload.translationId]
        : state.filters.translations;
      changedState = {
        ...state,
        filters: {
          tags: newTags,
          selectedLevels: newSelectedLevels,
          maxLevels: newMaxLevels,
          translations: newTranslationFilters
        }
      };
      break;
    case ActionName.setTranslationsList:
      //setting translation to null when deleting translation
      const newPassagesAfterRemovingTranslation =
        state.settings.translations.length > action.payload.length
          ? state.passages.map((passage) =>
              action.payload
                .map((t) => t.id)
                .indexOf(passage.verseTranslation || NaN) === -1
                ? { ...passage, translation: null }
                : passage
            )
          : state.passages;
      changedState = {
        ...state,
        passages: newPassagesAfterRemovingTranslation,
        settings: { ...state.settings, translations: action.payload }
      };
      break;
    case ActionName.setRemindersList:
      changedState = {
        ...state,
        settings: { ...state.settings, remindersList: action.payload }
      };
      checkSchedule(changedState);
      break;
    case ActionName.setTrainModesList:
      changedState = {
        ...state,
        settings: { ...state.settings, trainModesList: action.payload }
      };
      break;
    case ActionName.importPassages:
      if(!action?.payload?.passages?.length){
        break;
      }
      const importedPassages = action.payload.passages;
      changedState = {
        ...state,
        passages: [...state.passages, ...importedPassages]
      }
      break;
    default:
      console.warn("unknown action name: ", action);
  }
  if (changedState) {
    const timeOfChange = new Date().getTime();
    if(
      changedState.settings.devModeActivationTime 
      && changedState.settings.devModeActivationTime + (DAY * 1000) < timeOfChange
      ){
      changedState.settings.devModeActivationTime = null
      changedState.settings.devModeEnabled = false
    }
    changedState.lastChange = timeOfChange;
  }
  try {
    //checking if not corrapted
    const safeObject: AppStateModel = JSON.parse(JSON.stringify(changedState));
    return safeObject;
  } catch (err) {
    ToastAndroid.show("Cant change app state " + err, 10000);
    return state;
  }
};
