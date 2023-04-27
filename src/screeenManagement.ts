import { StackNavigationHelpers } from "@react-navigation/stack/src/types";
import { ActionModel, ActionName, AppStateModel } from "./models";
import { SCREEN } from "./constants";

export const navigateWithState: (arg: {navigation: StackNavigationHelpers, screen: SCREEN, state: AppStateModel, action?: ActionModel}) => void = ({navigation, screen, state, action}) => {
  console.log("Nevigating to", screen)
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
        changedState = {...state, langCode: action.payload}
    break;
  }
  if(changedState){
    changedState.lastChange = new Date().getTime();
  }
  return changedState;
}