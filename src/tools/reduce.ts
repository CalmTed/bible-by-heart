import { PERFECT_TESTS_TO_PRCEED, PASSAGE_LEVEL } from "../constants";
import { ActionModel, ActionName, AppStateModel } from "../models";
import { getPerfectTestsNumber } from "./getPerfectTests";


export const reduce: (
  state: AppStateModel,
  action: ActionModel
) => AppStateModel | null = (state, action) => {
  let changedState: AppStateModel | null = null;

  switch (action.name) {
      case ActionName.setLang:
          changedState = { ...state, langCode: action.payload };
          break;
      case ActionName.setPassage:
          if (state.passages.find((p) => p.id === action.payload.id)) {
              const changedPassages = state.passages.map((p) =>
                  p.id === action.payload.id
                      ? {
                            ...action.payload,
                            dateEdited: new Date().getTime()
                        }
                      : p
              );
              changedState = { ...state, passages: changedPassages };
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
                devMode: action.payload
           }
           break;
      case ActionName.removePassage:
          changedState = {
              ...state,
              passages: state.passages.filter((p) => p.id !== action.payload)
          };
          break;
      case ActionName.setActiveTests:
          if(!state.testsActive.length){
              changedState = { ...state, testsActive: action.payload };
          }else{
            changedState = { ...state, testsActive: [] };
          }
          break;
      case ActionName.updateTest:
        const updatedTests = state.testsActive.map(t => {
            if(t.id !== action.payload.test.id){
                return t;
            }
            return action.payload.test
        }).sort((a) => action.payload.isRight ? 0 : a.id === action.payload.test.id ? 1 : -1)
        //sorting active tests to float last wrong one to the end
        const sortedTests = action.payload.isRight ? updatedTests : [
            ...updatedTests.filter(t => !!t.dateFinished),//finished
            ...updatedTests.filter(t => !t.dateFinished && !t.errorNumber),//unfinished without error
            ...updatedTests.filter(t => !t.dateFinished && !!t.errorNumber)//unfinished with error
        ]
        changedState = {...state, testsActive: sortedTests}
        break;
      case ActionName.finishTesting:

        //+clear active tests
        //+update history
        //+update passages last tested time
        const newHistory = [...state.testsHistory, ...action.payload.tests];
        const newPassages = state.passages.map(p => {
            //+update passages max level
            //+update passages new level awalible
            const perfectTestsNumber = getPerfectTestsNumber(newHistory, p);
            const hasErrorFromLastThreeTests = perfectTestsNumber !== PERFECT_TESTS_TO_PRCEED;
            const nextLevel = {
                [PASSAGE_LEVEL.l1]: PASSAGE_LEVEL.l2,
                [PASSAGE_LEVEL.l2]: PASSAGE_LEVEL.l3,
                [PASSAGE_LEVEL.l3]: PASSAGE_LEVEL.l4,
                [PASSAGE_LEVEL.l4]: PASSAGE_LEVEL.l5,
            }
            //if has 3 perfect test stroke and not l5
            const level = !hasErrorFromLastThreeTests && p.maxLevel !== PASSAGE_LEVEL.l5 ? nextLevel[p.maxLevel] : p.maxLevel;
            //if new max level is not the current one
            const flag = level !== p.maxLevel;
            const lastTest = action.payload.tests.find(t => t.passageId === p.id)
            const lastTestedTime = lastTest ? lastTest.dateFinished : p.dateTested
            return {
                ...p,
                maxLevel: level,
                isNewLevelAwalible: flag,
                dateTested: lastTestedTime
            }
        })
        changedState = {...state, testsActive: [], testsHistory: newHistory, passages: newPassages}
        break;
      case ActionName.setPassageLevel: 
        const passagesWithNewLevel = state.passages.map(p => p.id === action.payload.passageId ? {...p, selectedLevel: action.payload.level} : p)
        changedState = {...state, passages: passagesWithNewLevel}
      break;
      case ActionName.disableNewLevelFlag:
        changedState = {...state, passages: state.passages.map(p => p.id === action.payload ? {...p, isNewLevelAwalible: false} : p)}
      break;
      case ActionName.setSorting:
        changedState = {...state, sort: action.payload}
      break;
      case ActionName.toggleFilter:
        //id existed add or remove from list
        const newTags = action.payload.tag ?
            state.filters.tags.includes(action.payload.tag) ?
                state.filters.tags.filter(c => c !== action.payload.tag) :
                [...state.filters.tags, action.payload.tag] :
            state.filters.tags;
        const newSelectedLevels = action.payload.selectedLevel ?
            state.filters.selectedLevels.includes(action.payload.selectedLevel) ?
                state.filters.selectedLevels.filter(c => c !== action.payload.selectedLevel) :
                [...state.filters.selectedLevels, action.payload.selectedLevel] :
            state.filters.selectedLevels;
        const newMaxLevels = action.payload.maxLevel ?
            state.filters.maxLevels.includes(action.payload.maxLevel) ?
                state.filters.maxLevels.filter(c => c !== action.payload.maxLevel) :
                [...state.filters.maxLevels, action.payload.maxLevel] :
            state.filters.maxLevels;
        changedState = {...state, filters: {tags: newTags, selectedLevels: newSelectedLevels, maxLevels: newMaxLevels}}
      break;
  }
  if (changedState) {
      changedState.lastChange = new Date().getTime();
  }
  return changedState;
};