import { useColorScheme } from 'react-native';
import {
    COLOR_DARK,
    COLOR_LIGHT,
    THEME_DARK,
    THEME_LIGHT,
    THEME_TYPE
} from '../constants';

export interface ThemeAndColorsModel {
    theme: typeof THEME_DARK;
    colors: typeof COLOR_DARK;
}

export const getTheme: (theme: THEME_TYPE) => ThemeAndColorsModel = (theme) => {
    const colorScheme = useColorScheme();
    if (
        (theme === THEME_TYPE.auto && colorScheme === 'dark') ||
        theme === THEME_TYPE.dark
    ) {
        return {
            theme: THEME_DARK,
            colors: COLOR_DARK
        };
    } else {
        return {
            theme: THEME_LIGHT,
            colors: COLOR_LIGHT
        };
    }
};
