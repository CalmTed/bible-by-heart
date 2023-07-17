import { useColorScheme } from 'react-native';
import {
    COLOR_DARK,
    COLOR_LIGHT,
    THEME_DARK,
    THEME_LIGHT,
    THEMETYPE
} from '../constants';

export interface ThemeAndColorsModel {
    theme: typeof THEME_DARK;
    colors: typeof COLOR_DARK;
}

export const getTheme: (theme: THEMETYPE) => ThemeAndColorsModel = (theme) => {
    const colorScheme = useColorScheme();
    if (
        (theme === THEMETYPE.auto && colorScheme === 'dark') ||
        theme === THEMETYPE.dark
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
