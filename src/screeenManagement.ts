import { ActionModel, AppStateModel } from "./models";
import { SCREEN } from "./constants";
import { reduce } from "./utils/reduce";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";

export const navigateWithState: (arg: {
  navigation: StackNavigationHelpers;
  screen: SCREEN;
  state: AppStateModel;
  action?: ActionModel;
  extraData?: Record<string, any>;
}) => void = ({ navigation, screen, state, action, extraData }) => {
  if (action) {
    const newState = reduce(state, action);
    navigation.navigate(screen, { ...newState });
  } else {
    navigation.navigate(screen, { ...state, ...extraData });
  }
};
