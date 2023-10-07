import {
  PERFECT_TESTS_TO_PROCEED,
  PASSAGELEVEL,
  TESTLEVEL,
  LANGCODE
} from "../constants";
import {
  ActionModel,
  ActionName,
  AppStateModel,
  PassageModel
} from "../models";
import { getPerfectTestsNumber } from "./getPerfectTests";
import { getNumberOfVersesInEnglish } from "./getNumberOfEnglishVerses";
import { checkSchedule } from "./notifications";
import { ToastAndroid } from "react-native";
import { generateATest } from "./generateTests";
import { createAddress, createPassage } from "../initials";
import { addressFromString } from "./addressFromString";

export const reduce: (
  state: AppStateModel,
  action: ActionModel
) => AppStateModel | null = (state, action) => {
  let changedState: AppStateModel | null = null;

  switch (action.name) {
    case ActionName.setLang:
      changedState = {
        ...state,
        settings: { ...state.settings, langCode: action.payload }
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
          devMode: action.payload
        }
      };
      break;
    case ActionName.removePassage:
      changedState = {
        ...state,
        testsHistory: state.testsHistory.filter(
          (t) => t.passageId !== action.payload
        ),
        passages: state.passages.filter((p) => p.id !== action.payload)
      };
      break;
    case ActionName.setActiveTests:
      if (!state.testsActive.length) {
        changedState = { ...state, testsActive: action.payload };
      } else {
        changedState = { ...state, testsActive: [] };
      }
      break;
    case ActionName.updateTest:
      const updatedTests = state.testsActive
        .map((t) => {
          if (t.id === action.payload.test.id) {
            return {
              ...action.payload.test,
              isFinished: action.payload.isRight ? true : t.isFinished,
              triesDuration: action.payload.test.triesDuration.map(
                (td, i, a) =>
                  i === a.length - 1 ? [...td, new Date().getTime()] : td
              )
            };
          }
          return t;
        })
        .sort((a) =>
          action.payload.isRight ? 0 : a.id === action.payload.test.id ? 1 : -1
        );
      //sorting active tests to float last wrong one to the end
      const sortedTests = action.payload.isRight
        ? updatedTests
        : [
            ...updatedTests.filter((t) => !!t.isFinished), //finished
            ...updatedTests.filter((t) => !t.isFinished && !t.errorNumber), //unfinished without error
            ...updatedTests.filter((t) => !t.isFinished && !!t.errorNumber) //unfinished with error
          ];
      changedState = { ...state, testsActive: sortedTests };
      break;
    case ActionName.downgradePassage:
      //check if level is higher then 1
      if ([TESTLEVEL.l10, TESTLEVEL.l11].includes(action.payload.test.level)) {
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
      const targetPasasge = state.passages.find(
        (p) => p.id === action.payload.test.passageId
      );
      if (!targetPasasge) {
        break;
      }
      const newPassageLevel = levelDowngradingMap[targetPasasge.selectedLevel];
      console.log("downgrading. new level:",newPassageLevel)
      //change selected level
      const updatedPassages = state.passages.map((p) =>
        p.id === action.payload.test.passageId
          ? ({
              ...p,
              //we taking from selectedLevel, b.c. if selected to hard then max is even harder
              selectedLevel: newPassageLevel,
              maxLevel: newPassageLevel
            } as PassageModel)
          : p
      );
      //regenerate test with new level
      const updatedActiveTests = state.testsActive.map((t) =>
        t.id === action.payload.test.id
          ? generateATest (
              t,
              state.passages,
              newPassageLevel,
              state.testsHistory
            )
          : t
      );
      changedState = {
        ...state,
        testsActive: updatedActiveTests,
        passages: updatedPassages
      };
      break;
    case ActionName.finishTesting:
      //updating last test finish time is finished flag
      const testsWithUpdatedLastTest = action.payload.tests.map((t) => {
        return {
          ...t,
          triesDuration: t.triesDuration.map((td) =>
            td.length === 1 ? [...td, new Date().getTime()] : td
          ),
          isFinished: true,
          testData: {}
        };
      });
      //+update history
      const newHistory = [...state.testsHistory, ...testsWithUpdatedLastTest];
      const newPassages = state.passages.map((p) => {
        //+update passages max level
        //+update passages new level awalible
        const perfectTestsNumber = getPerfectTestsNumber(newHistory, p);
        const hasErrorFromLastThreeTests =
          perfectTestsNumber !== PERFECT_TESTS_TO_PROCEED;
        const nextLevel = {
          [PASSAGELEVEL.l1]: PASSAGELEVEL.l2,
          [PASSAGELEVEL.l2]: PASSAGELEVEL.l3,
          [PASSAGELEVEL.l3]: PASSAGELEVEL.l4,
          [PASSAGELEVEL.l4]: PASSAGELEVEL.l5
        };
        //if has 3 perfect test stroke and not l5
        const level =
          !hasErrorFromLastThreeTests && p.maxLevel !== PASSAGELEVEL.l5
            ? nextLevel[p.maxLevel]
            : p.maxLevel;
        //if new max level is not the current one
        const flag = level !== p.maxLevel;
        const lastTest = testsWithUpdatedLastTest.find(
          (t) => t.passageId === p.id
        );
        //update passages last tested time
        const lastTestedTime = lastTest
          ? lastTest.triesDuration[lastTest.triesDuration.length - 1]?.[1]
          : p.dateTested;
        return {
          ...p,
          maxLevel: level,
          selectedLevel:
            state.settings.autoIncreeseLevel && level !== p.selectedLevel
              ? level
              : p.selectedLevel,
          isNewLevelAwalible: flag,
          dateTested: lastTestedTime
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
      //validate:
      //data exists
      const dataExists = action.payload.headers && action.payload.data && action.payload.headers.length && action.payload.data.length
      //same number of columns
      const sameColumnsNumber = 
      action.payload.data.map(row =>
        Math.abs(action.payload.headers.length - row.length)
        ).reduce((ps, s) => {
          return ps + s;
        }, 0) === 0
      //valid header names
      const validHeaders = action.payload.headers.filter(h => {
        return Object.keys(createPassage( createAddress() , "")).includes(h)//initial passage have all nneded passages
      }
      )
      //required headers: address
      const hasRequiredHeaders = action.payload.headers.includes("address")
      //BE AWARE: we dont check fot data type here b.c. we read it from strings and see all as strings even tags param(witch have , as separator)
      if(!dataExists || !sameColumnsNumber || !hasRequiredHeaders){
        break;
      }
      //generate passages
      const importedPassages: PassageModel[] = action.payload.data.map(passage => {
        const addressColumnIndex = action.payload.headers.indexOf("address")
        const address = addressFromString(passage[addressColumnIndex])
        if(!address){
          console.log("Not an address")
          return null;
        }
        const newPassage = createPassage(address);
        action.payload.headers.map((header, headerIndex) => {
          const typedHeader = header as keyof PassageModel
          if(typedHeader === "address"){
            return;
          }
          if(typedHeader === "tags"){
            newPassage.tags = passage[headerIndex]?.split(",").filter(t => t.length).map(t => t.trim()) ?? []
          }
          if(typedHeader === "verseTranslation"){
            newPassage.verseTranslation = state.settings.translations.find(translation => translation.name === passage[headerIndex])?.id || null
          }
          //done in a hackable way on purpose
          if(typeof newPassage[typedHeader] === typeof passage[headerIndex]){
            newPassage[typedHeader] = passage[headerIndex] as never//this is not on purpose
          }
        })
        return newPassage;

      }).filter(p => p !== null) as PassageModel[]
      //find translation with translationName or set to null
      //edit params
      changedState = {
        ...state,
        passages: [...state.passages, ...importedPassages]
      }
      break;
    default:
      console.warn("unknown action name: ", action);
  }
  if (changedState) {
    changedState.lastChange = new Date().getTime();
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
