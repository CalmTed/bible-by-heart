import { StackNavigationHelpers } from '@react-navigation/stack/src/types';
import { ActionModel, AppStateModel } from './models';
import { SCREEN } from './constants';
import { reduce } from './tools/reduce';

export const navigateWithState: (arg: {
    navigation: StackNavigationHelpers;
    screen: SCREEN;
    state: AppStateModel;
    action?: ActionModel;
}) => void = ({ navigation, screen, state, action }) => {
    if (action) {
        const newState = reduce(state, action);
        navigation.navigate(screen, { ...newState });
    } else {
        navigation.navigate(screen, { ...state });
    }
};
