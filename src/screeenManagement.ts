import { StackNavigationHelpers } from "@react-navigation/stack/src/types";
import { ActionModel, ActionName, AppStateModel } from "./models";
import { SCREEN } from "./constants";

export const navigateWithState: (arg: {navigation: StackNavigationHelpers, screen: SCREEN, state: AppStateModel, action?: ActionModel}) => void = ({navigation, screen, state, action}) => {
  if(action){
    const newState = reduce(state, action);
    navigation.navigate(screen, {...newState})
  }else{
    navigation.navigate(screen, {...state});
  }
}

export const reduce: (state: AppStateModel, action: ActionModel) => AppStateModel | null = (state, action) => {
  let changedState: AppStateModel | null = null;

  switch(action.name){
    case ActionName.setLang:
        changedState = {...state, langCode: action.payload};
    break;
    case ActionName.setPassage:
      if(state.passages.find(p => p.id === action.payload.id)){
        const changedPassages = state.passages.map(p => p.id === action.payload.id ? {...action.payload, dateEdited: new Date().getTime()} : p)
        changedState = {...state, passages: changedPassages}
      }else{
        changedState = {...state, passages: [...state.passages, action.payload]}
      }
    break;
    case ActionName.removePassage:
      changedState = {...state, passages: state.passages.filter(p => p.id !== action.payload)}
    break;
  }
  if(changedState){
    changedState.lastChange = new Date().getTime();
  }
  return changedState;
}