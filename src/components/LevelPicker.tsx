import React, { FC, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PERFECT_TESTS_TO_PRCEED, PASSAGELEVEL } from '../constants';
import { WORD } from '../l10n';
import { AppStateModel, PassageModel, TestModel } from '../models';
import { MiniModal } from './miniModal';
import { IconName } from './Icon';
import { Button } from './Button';
import { getPerfectTestsNumber } from '../tools/getPerfectTests';
import { getTheme } from '../tools/getTheme';
import { DotIndicator } from './DotIndicator';

interface LevelPickerModel {
    targetPassage: PassageModel;
    handleChange: (level: PASSAGELEVEL, passageId: number) => void;
    handleOpen: (passageId: number) => void;
    t: (w: WORD) => string;
    state: AppStateModel;
    activeTestObj?: TestModel;
    handleRestart?: () => void;
}

export const LevelPicker: FC<LevelPickerModel> = ({
    targetPassage,
    t,
    handleChange,
    handleOpen,
    state,
    activeTestObj,
    handleRestart
}) => {
    const [levelPickerShown, setLevelPickerShown] = useState(false);
    const closeLevelPicker = () => {
        setLevelPickerShown(false);
    };
    const handleLabelPress = () => {
        setLevelPickerShown(true);
        handleOpen(targetPassage.id);
    };
    const theme = getTheme(state.settings.theme);
    const levelPickerStyles = StyleSheet.create({
        levelPickerView: {
            justifyContent: 'flex-start'
        },
        headerText: {
            color: theme.colors.text,
            textTransform: 'uppercase',
            fontWeight: '500',
            fontSize: 22
        },
        subText: {
            textAlign: 'center',
            color: theme.colors.textSecond,
            fontSize: 16
        },
        buttonsView: {
            marginTop: 50,
            marginBottom: 20,
            flexDirection: 'row',
            gap: 5
        },
        buttonStyle: {
            margin: 0
        },
        levelPickerWrapper: {
            flexDirection: 'row',
            justifyContent: 'center'
        }
    });
    return (
        <View style={{ ...levelPickerStyles.levelPickerView }}>
            <View style={{ ...levelPickerStyles.levelPickerWrapper }}>
                <Button
                    theme={theme}
                    title={`${t('Level')} ${targetPassage.selectedLevel}`}
                    icon={IconName.selectArrow}
                    onPress={handleLabelPress}
                />
                {targetPassage.isNewLevelAwalible && (
                    <DotIndicator theme={theme} />
                )}
            </View>
            <MiniModal
                theme={theme}
                shown={levelPickerShown}
                handleClose={() => setLevelPickerShown(false)}
            >
                <Text style={levelPickerStyles.headerText}>
                    {t('LevelPickerHeading')}
                </Text>
                <View style={levelPickerStyles.buttonsView}>
                    {[
                        PASSAGELEVEL.l1,
                        PASSAGELEVEL.l2,
                        PASSAGELEVEL.l3,
                        PASSAGELEVEL.l4,
                        PASSAGELEVEL.l5
                    ].map((n) => {
                        const color =
                            targetPassage.selectedLevel === n
                                ? 'green'
                                : 'gray';
                        const disabled =
                            n > targetPassage.maxLevel &&
                            !state.settings.devMode;
                        return (
                            <Button
                                theme={theme}
                                type={disabled ? 'secondary' : 'outline'}
                                color={color}
                                style={levelPickerStyles.buttonStyle}
                                key={n}
                                title={n.toString()}
                                onPress={() =>
                                    handleChange(n, targetPassage.id)
                                }
                                disabled={disabled}
                            />
                        );
                    })}
                </View>
                {!activeTestObj &&
                    targetPassage.maxLevel !== PASSAGELEVEL.l5 && (
                        <Text style={levelPickerStyles.subText}>
                            {t('LevelPickerSubtext')} (
                            {getPerfectTestsNumber(
                                state.testsHistory,
                                targetPassage
                            )}
                            /{PERFECT_TESTS_TO_PRCEED})
                        </Text>
                    )}
                {!activeTestObj &&
                    targetPassage.maxLevel === PASSAGELEVEL.l5 && (
                        <Text style={levelPickerStyles.subText}>
                            {t('LevelPickerSubtextL5')} (
                            {getPerfectTestsNumber(
                                state.testsHistory,
                                targetPassage
                            )}
                            )
                        </Text>
                    )}
                {activeTestObj &&
                    targetPassage.selectedLevel.toString() ===
                        activeTestObj.level.toString().slice(0, 1) &&
                    targetPassage.selectedLevel === targetPassage.maxLevel &&
                    targetPassage.selectedLevel !== PASSAGELEVEL.l5 && (
                        <Text style={levelPickerStyles.subText}>
                            {t('LevelPickerSubtext')} (
                            {getPerfectTestsNumber(
                                state.testsHistory,
                                targetPassage
                            )}
                            /{PERFECT_TESTS_TO_PRCEED})
                        </Text>
                    )}
                {activeTestObj &&
                    targetPassage.selectedLevel.toString() !==
                        activeTestObj.level.toString().slice(0, 1) && (
                        <Text style={levelPickerStyles.subText}>
                            {t('LevelPickerSubtextSecond')}
                        </Text>
                    )}
                {activeTestObj &&
                    handleRestart &&
                    targetPassage.selectedLevel.toString() !==
                        activeTestObj.level.toString().slice(0, 1) && (
                        <Button
                            theme={theme}
                            title={t('RestartTests')}
                            onPress={() => {
                                closeLevelPicker();
                                handleRestart();
                            }}
                        />
                    )}

                <Button
                    theme={theme}
                    color="green"
                    type="outline"
                    title={t('Close')}
                    onPress={() => closeLevelPicker()}
                />
            </MiniModal>
        </View>
    );
};
