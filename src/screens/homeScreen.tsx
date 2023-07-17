import React, { FC, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SCREEN, SETTINGS, THEMETYPE } from '../constants';
import { StackNavigationHelpers } from '@react-navigation/stack/src/types';
import { navigateWithState } from '../screeenManagement';
import { Button } from '../components/Button';
import { DaggerLogoSVG } from '../svg/daggetLogo';
import { getStroke } from '../tools/getStats';
import { WeekActivityComponent } from '../components/weekActivityComponent';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../tools/useApp';
import { IconName } from '../components/Icon';
import { SelectModal } from '../components/SelectModal';
import { ActionName } from '../models';
import { getPassagesByTrainMode } from '../tools/generateTests';

export interface ScreenModel {
    route: any;
    navigation: StackNavigationHelpers;
}

export const HomeScreen: FC<ScreenModel> = ({ route, navigation }) => {
    const { state, t, theme } = useApp({ route, navigation });

    const [showTrainModesList, setShowTrainModesList] = useState(false);

    const strokeData = getStroke(state.testsHistory);
    const activeTrainModes = state.settings.trainModesList.filter(
        (m) => m.enabled
    );
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
            </View>
            <WeekActivityComponent theme={theme} state={state} t={t} />
            <View style={homeStyle.buttonView}>
                <Button
                    theme={theme}
                    type="main"
                    color="green"
                    title={t('homePractice')}
                    onPress={() =>
                        activeTrainModes.length > 1
                            ? setShowTrainModesList(true)
                            : navigateWithState({
                                  navigation,
                                  screen: SCREEN.test,
                                  state: state
                              })
                    }
                    icon={
                        activeTrainModes.length > 1
                            ? IconName.selectArrow
                            : undefined
                    }
                    iconAlign="right"
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
                />
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
                />
            </View>
            <SelectModal
                isShown={showTrainModesList}
                options={activeTrainModes.map((m) => ({
                    value: m.id.toString(),
                    label: `${m.name} (${
                        getPassagesByTrainMode(state, m).length
                    })`
                }))}
                disabledIndexes={activeTrainModes.map((m, i) =>
                    !getPassagesByTrainMode(state, m).length ? i : Infinity
                )}
                selectedIndex={activeTrainModes.indexOf(
                    activeTrainModes.filter(
                        (m) => m.id === state.settings.activeTrainModeId
                    )[0]
                )}
                onSelect={(value) => {
                    setShowTrainModesList(false);
                    navigateWithState({
                        navigation,
                        screen: SCREEN.test,
                        state: state,
                        action: {
                            name: ActionName.setSettingsParam,
                            payload: {
                                param: SETTINGS.activeTrainModeId,
                                value: parseInt(value, 10)
                            }
                        }
                    });
                }}
                onCancel={() => {
                    setShowTrainModesList(false);
                }}
                theme={theme}
            />
            <StatusBar
                style={
                    state.settings.theme === THEMETYPE.light ? 'dark' : 'light'
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
