import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SCREEN, THEME_TYPE } from '../constants';
import { StackNavigationHelpers } from '@react-navigation/stack/src/types';
import { navigateWithState } from '../screeenManagement';
import { Button } from '../components/Button';
import { DaggerLogoSVG } from '../svg/daggetLogo';
import { getStroke } from '../tools/getStats';
import { WeekActivityComponent } from '../components/weekActivityComponent';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../tools/useApp';

export interface ScreenModel {
    route: any;
    navigation: StackNavigationHelpers;
}

export const HomeScreen: FC<ScreenModel> = ({ route, navigation }) => {
    const {state, t, theme} = useApp({route, navigation})

    const strokeData = getStroke(state.testsHistory);
    return (
        <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
            <View style={homeStyle.logoView}>
                <DaggerLogoSVG
                    isOutline={strokeData.today}
                    color={theme.colors.text}
                />
                <Text style={{ ...theme.theme.text, ...homeStyle.titleText }}>
                    {t('appName')}
                </Text>
                <Text
                    style={{
                        ...theme.theme.text,
                        color: theme.colors.textSecond
                    }}
                >
                    {t('DaysStroke')}: {strokeData.length}
                </Text>
                {/* <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("TestsCompleted")}: {state.testsHistory.length}</Text> */}
                {/* <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("ErrorsMade")}: {errorNumber}</Text> */}
            </View>
            <WeekActivityComponent
                theme={theme}
                state={state}
                t={t}
            ></WeekActivityComponent>
            <View style={homeStyle.buttonView}>
                <Button
                    theme={theme}
                    type="main"
                    color="green"
                    title={t('homePractice')}
                    onPress={() =>
                        navigateWithState({
                            navigation,
                            screen: SCREEN.test,
                            state: state
                        })
                    }
                />
                <Button
                    theme={theme}
                    title={t('homeList')}
                    onPress={() =>
                        navigateWithState({
                            navigation,
                            screen: SCREEN.listPassage,
                            state: state
                        })
                    }
                ></Button>
                <Button
                    theme={theme}
                    title={t('homeSettings')}
                    onPress={() =>
                        navigateWithState({
                            navigation,
                            screen: SCREEN.settings,
                            state: state
                        })
                    }
                ></Button>
            </View>
            <StatusBar
                style={
                    state.settings.theme === THEME_TYPE.light ? 'dark' : 'light'
                }
            />
        </View>
    );
};

const homeStyle = StyleSheet.create({
    logoView: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    titleText: {
        fontSize: 35,
        fontWeight: '700'
    },
    buttonView: {
        flex: 1,
        alignItems: 'center',
        gap: 10
    }
});
