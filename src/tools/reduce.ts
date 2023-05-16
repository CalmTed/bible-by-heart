import { PERFECT_TESTS_TO_PRCEED, PassageLevel } from "../constants";
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
        const sortedTests = action.payload.isRight ? updatedTests : [
            ...updatedTests.filter(t => !!t.dateFinished),
            ...updatedTests.filter(t => !t.dateFinished && !t.errorNumber),
            ...updatedTests.filter(t => !t.dateFinished && !!t.errorNumber)
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
                [PassageLevel.l1]: PassageLevel.l2,
                [PassageLevel.l2]: PassageLevel.l3,
                [PassageLevel.l3]: PassageLevel.l4,
                [PassageLevel.l4]: PassageLevel.l5,
            }
            const level = !hasErrorFromLastThreeTests && p.maxLevel !== PassageLevel.l5 ? nextLevel[p.maxLevel] : p.maxLevel
            const flag = level !== p.maxLevel
            return {
                ...p,
                maxLevel: level,
                isNewLevelAwalible: flag,
                dateTested: new Date().getTime()
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
  }
  if (changedState) {
      changedState.lastChange = new Date().getTime();
  }
  return changedState;
};