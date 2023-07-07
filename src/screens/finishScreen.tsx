import React, { FC, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { storageName, SCREEN } from '../constants';
import { AppStateModel } from '../models';
import { navigateWithState } from '../screeenManagement';
import { createT } from '../l10n';
import { Button } from '../components/Button';
import storage from '../storage';
import { FinishCupSVG } from '../svg/finishCup';
import { ScreenModel } from './homeScreen';
import { getTheme } from '../tools/getTheme';
import { useApp } from '../tools/useApp';

export const FinishScreen: FC<ScreenModel> = ({ route, navigation }) => {
    const { state, setState, t, theme } = useApp({ route, navigation });

    return (
        <View
            style={{
                ...theme.theme.screen,
                ...theme.theme.view,
                ...finishStyle.screen
            }}
        >
            <View style={finishStyle.logoView}>
                <FinishCupSVG />
                <Text style={{ ...theme.theme.text, ...finishStyle.titleText }}>
                    {t('titleWelldone')}
                </Text>
            </View>
            <View style={finishStyle.buttonView}>
                <Button
                    theme={theme}
                    type="main"
                    title={t('Continue')}
                    onPress={() =>
                        navigateWithState({
                            navigation,
                            screen: SCREEN.home,
                            state: state
                        })
                    }
                />
            </View>
        </View>
    );
};

const finishStyle = StyleSheet.create({
    screen: {
        justifyContent: 'center',
        height: '100%'
    },
    logoView: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 4
    },
    titleText: {
        fontSize: 35,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    buttonView: {
        flex: 1,
        alignItems: 'center'
    }
});
