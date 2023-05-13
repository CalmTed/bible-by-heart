import { ActionModel, ActionName, AppStateModel } from "../models";


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
        //clear active tests
        //update history
        //update passages last tested time
        
        //TODO update passages max level
        //TODO update passages new level awalible
        const newHistory = [...state.testsHistory, ...action.payload.tests];
        const newPassages = state.passages.map(p => {
            return {
                ...p,
                dateTested: new Date().getTime()
            }
        })
        changedState = {...state, testsActive: [], testsHistory: newHistory, passages: newPassages}
        break;
  }
  if (changedState) {
      changedState.lastChange = new Date().getTime();
  }
  return changedState;
};