import React, { FC, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEST_LEVEL, PASSAGE_LEVEL, archivedName } from '../constants';
import { ActionName, PassageModel, TestModel } from '../models';
import { navigateWithState } from '../screeenManagement';
import { SCREEN } from '../constants';
import { Header } from '../components/Header';
import { Button, IconButton } from '../components/Button';
import { IconName } from '../components/Icon';
import { createT } from '../l10n';
import { ScreenModel } from './homeScreen';
import { generateTests } from '../tools/generateTests';
import { reduce } from '../tools/reduce';
import { TestNavDott } from '../components/testNevDott';
import { L10, L11 } from '../components/levels/l1';
import { L20, L21 } from '../components/levels/l2';
import { L30 } from '../components/levels/l3';
import { LevelPicker } from '../components/LevelPicker';
import { L40 } from '../components/levels/l4';
import { L50 } from '../components/levels/l5';
import { useApp } from '../tools/useApp';

export const TestsScreen: FC<ScreenModel> = ({ route, navigation }) => {
    const { state, setState, t, theme } = useApp({ route, navigation });
    const nextUnfinishedTestIndex = state.testsActive.indexOf(
        state.testsActive.filter((t) => !t.isFinished)[0]
    );
    const [activeTestIndex, setActiveTest] = useState(
        nextUnfinishedTestIndex !== -1 ? nextUnfinishedTestIndex : 0
    );

    const exitTests = () => {
        const newState =
            reduce(state, {
                name: ActionName.setActiveTests,
                payload: []
            }) || state;
        navigateWithState({ navigation, screen: SCREEN.home, state: newState });
    };

    const activateTests = () => {
        const generatedTests = generateTests(state);
        if (!generatedTests.length) {
            navigateWithState({ navigation, screen: SCREEN.home, state });
            return;
        }
        setState((prevState) => {
            const newState = reduce(prevState, {
                name: ActionName.setActiveTests,
                payload: generatedTests
            });
            return newState ? newState : prevState;
        });
    };
    const handleReset = () => {
        setState((prevState) => {
            const newState = reduce(prevState, {
                name: ActionName.setActiveTests,
                payload: []
            });
            setActiveTest(0);
            return newState ? newState : prevState;
        });
    };
    const handleTestSubmit: (data: {
        isRight: boolean;
        modifiedTest: TestModel;
    }) => void = ({ isRight, modifiedTest }) => {
        //if there is at least one unfinished then it is the last one
        if (
            isRight &&
            state.testsActive.filter((t) => !t.isFinished).length > 1
        ) {
            //if right but not last
            setActiveTest((prv) => {
                return prv + 1 < state.testsActive.length
                    ? prv + 1
                    : state.testsActive.indexOf(
                          state.testsActive.filter((t) => !t.isFinished)[0]
                      );
            });
        } else if (isRight) {
            //if last test and right then finish
            const newState =
                reduce(state, {
                    name: ActionName.finishTesting,
                    payload: {
                        tests: state.testsActive.map((t) =>
                            t.id === modifiedTest.id ? modifiedTest : t
                        )
                    }
                }) || state;
            navigateWithState({
                navigation,
                screen: SCREEN.testResults,
                state: newState
            });
        }
        setState((prv) => {
            return (
                reduce(prv, {
                    name: ActionName.updateTest,
                    payload: {
                        test: modifiedTest,
                        isRight
                    }
                }) || prv
            );
        });
    };
    const handleLevelPickerOpen = (passageId: number) => {
        setState((prv) => {
            return (
                reduce(prv, {
                    name: ActionName.disableNewLevelFlag,
                    payload: passageId
                }) || prv
            );
        });
    };
    const handleLevelChange = (level: PASSAGE_LEVEL, passageId: number) => {
        setState((prv) => {
            return (
                reduce(prv, {
                    name: ActionName.setPassageLevel,
                    payload: {
                        passageId: passageId,
                        level: level
                    }
                }) || prv
            );
        });
    };

    const testsStyle = StyleSheet.create({
        viewHidden: {
            display: 'none'
        },
        testNav: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            height: '100%',
            overflow: 'scroll'
        },
        centeredView: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 30
        },
        subText: {
            color: theme.colors.text,
            fontSize: 20,
            textAlign: 'center',
            marginHorizontal: 20
        }
    });

    if (
        !state.passages.filter(
            (passage) => !passage.tags.includes(archivedName)
        ).length
    ) {
        return (
            <View style={{ ...theme.theme.screen }}>
                <Header
                    theme={theme}
                    navigation={navigation}
                    showBackButton={true}
                    alignChildren="flex-start"
                />
                <View style={testsStyle.centeredView}>
                    <Text style={testsStyle.subText}>
                        {t('TestsAddPassagesToTest')}
                    </Text>
                    <Button
                        theme={theme}
                        type="main"
                        title={t('AddPassages')}
                        onPress={() =>
                            navigateWithState({
                                screen: SCREEN.listPassage,
                                state,
                                navigation
                            })
                        }
                    />
                </View>
            </View>
        );
    }
    //if no active tests > create them
    if (!state.testsActive.length) {
        activateTests();
        return <View style={{ ...theme.theme.screen }}></View>;
    }
    const activeTestObj: TestModel = {
        ...state.testsActive[activeTestIndex],
        triesDuration:
            state.testsActive[activeTestIndex]?.triesDuration?.filter(
                (t) => t.length === 1
            ).length > 0
                ? state.testsActive[activeTestIndex]?.triesDuration.map((t) =>
                      t.length === 1 ? [...t, new Date().getTime()] : t
                  )
                : [
                      ...(state.testsActive[activeTestIndex]?.triesDuration ||
                          []),
                      [new Date().getTime()]
                  ]
    };
    const targetPassage: PassageModel = state.passages.find(
        (p) => p.id === activeTestObj.passageId
    ) as PassageModel;
    if (!targetPassage) {
        //if passages from old tests left in state
        activateTests();
        return <View style={{ ...theme.theme.screen }}></View>;
    }
    const tempT = createT(
        state.settings.translations.find(
            (t) => t.id === targetPassage.verseTranslation
        )?.addressLanguage || state.settings.langCode
    );
    return (
        <View style={{ ...theme.theme.screen }}>
            <View
                style={{
                    ...theme.theme.view,
                    //if there are any unfinished tests
                    ...(state.testsActive?.filter((t) => !t.isFinished)
                        ?.length === 0
                        ? testsStyle.viewHidden
                        : {})
                }}
            >
                <Header
                    theme={theme}
                    navigation={navigation}
                    showBackButton={false}
                    alignChildren="flex-start"
                    additionalChildren={[
                        <IconButton
                            theme={theme}
                            icon={IconName.cross}
                            onPress={exitTests}
                        />,
                        <View style={{ ...testsStyle.testNav }}>
                            {state.testsActive.map((t, i, arr) => {
                                const isFinished = t.isFinished;
                                const hasErrors = !!t.errorNumber;
                                const isFirst = i === 0;
                                //if it first and unfinished
                                //or if not finished and previus is finished
                                const isLastOfUnfinished =
                                    (isFirst && !isFinished) ||
                                    (!isFinished && arr[i - 1]?.isFinished);
                                const color =
                                    isFinished ||
                                    (activeTestIndex === i && !hasErrors)
                                        ? 'green'
                                        : hasErrors
                                        ? 'red'
                                        : isLastOfUnfinished
                                        ? 'text'
                                        : 'gray';
                                return (
                                    <TestNavDott
                                        theme={theme}
                                        key={t.id}
                                        isCurrent={activeTestIndex === i}
                                        color={color}
                                        onPress={() =>
                                            isFinished ||
                                            isLastOfUnfinished ||
                                            hasErrors
                                                ? setActiveTest(i)
                                                : null
                                        }
                                    />
                                );
                            })}
                        </View>
                    ]}
                />
                <LevelPicker
                    t={t}
                    state={state}
                    targetPassage={targetPassage}
                    activeTestObj={activeTestObj}
                    handleChange={handleLevelChange}
                    handleOpen={handleLevelPickerOpen}
                    handleRestart={handleReset}
                />
                {activeTestObj?.level === TEST_LEVEL.l10 && (
                    <L10
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l11 && (
                    <L11
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l20 && (
                    <L20
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l21 && (
                    <L21
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l30 && (
                    <L30
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l40 && (
                    <L40
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {activeTestObj?.level === TEST_LEVEL.l50 && (
                    <L50
                        test={activeTestObj}
                        state={state}
                        t={tempT}
                        submitTest={handleTestSubmit}
                    />
                )}
                {state.settings.devMode && (
                    <Button
                        theme={theme}
                        type="main"
                        color="gray"
                        title={t('Reset')}
                        onPress={handleReset}
                    ></Button>
                )}
            </View>
        </View>
    );
};
