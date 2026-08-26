import React, { FC, useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet, Text } from "react-native";
import { TESTLEVEL, PASSAGELEVEL, SCREEN } from "../constants";
import {
  ActionModel,
  ActionName,
  PassageModel,
  ScreenPropsModel,
  TestModel
} from "../models";

import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { IconName } from "../components/Icon";
import { reduce } from "../utils/reduce";
import { TestNavDot } from "../components/TestNavDot";
import { L10, L11 } from "../components/levels/Level1";
import { L20, L21 } from "../components/levels/Level2";
import { L30 } from "../components/levels/Level3";
import { LevelPicker } from "../components/LevelPicker";
import { L40 } from "../components/levels/Level4";
import { L50 } from "../components/levels/Level5";
import { useAppContext } from "../context/AppContext";
import { MiniModal } from "../components/MiniModal";

export const TestsScreen: FC<ScreenPropsModel<SCREEN.test>> = ({
  navigation
}) => {
  const { state, setState, t, theme } = useAppContext();
  const isFocused = useIsFocused();
  const nextUnfinishedTestIndex = state.testsActive.indexOf(
    state.testsActive.filter((tst) => !tst.f)[0]
  );
  const [activeTestIndex, setActiveTest] = useState(
    nextUnfinishedTestIndex !== -1 ? nextUnfinishedTestIndex : 0
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // `beforeRemove` is only in the STACK navigation type — with the old loose
  // `StackNavigationHelpers` prop it needed a @ts-ignore (8.1.14).
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (showExitConfirm) {
          return;
        }
        setShowExitConfirm(true);
        e.preventDefault();
      }),

    [navigation, showExitConfirm]
  );

  const exitTests = () => {
    setState(
      (prev) => reduce(prev, { name: ActionName.clearActiveTests }) || prev
    );
    navigation.navigate(SCREEN.home);
  };

  // Bounce out of an empty/invalid session (stale deep link, or a test that
  // points at a deleted passage) — but ONLY while this screen is focused.
  // Finishing the last test clears `testsActive` AND navigates to the results
  // screen; this used to run as a side effect DURING render (the guards below),
  // so on that same re-render the now-background TestsScreen shoved Home on top
  // of the finish screen — finish "skipped", reachable only via back
  // (device feedback 2026-07-11). Focus-gating fixes it: while results/finish is
  // focused this no-ops; pressing back onto an empty session still redirects home.
  useEffect(() => {
    if (!isFocused) {
      return;
    }
    const activeTest = state.testsActive[activeTestIndex];
    const passageMissing =
      !!activeTest && !state.passages.some((p) => p.id === activeTest.pi);
    if (!state.testsActive.length || passageMissing) {
      exitTests();
    }
  }, [isFocused, state.testsActive, state.passages, activeTestIndex]);

  const handleReset = () => {
    setActiveTest(0);
    setState((prevState) => {
      const newState = reduce(prevState, {
        name: ActionName.generateTests
      });
      return newState ? newState : prevState;
    });
  };
  const handleTestSubmit: (data: {
    isRight: boolean;
    modifiedTest: TestModel;
  }) => void = ({ isRight, modifiedTest }) => {
    //if there is at least one unfinished then it is the last one
    if (isRight && state.testsActive.filter((tst) => !tst.f).length > 1) {
      //if test is right but it is not the last
      setActiveTest(() => {
        //set first of unfinished and not active tests to be active
        return state.testsActive.indexOf(
          state.testsActive.filter(
            (tst) => !tst.f && tst.i !== activeTestObj.i
          )[0]
        );
      });
      setState((prv) => {
        return (
          reduce(prv, {
            name: ActionName.updateTest,
            payload: { test: modifiedTest, isRight }
          }) || prv
        );
      });
    } else if (isRight) {
      //if last test and right then finish: commit the session to history
      //(finishTesting) into the global state, then open the results screen.
      //State is global now, so nothing is threaded through route params.
      setState(
        (prv) =>
          reduce(prv, {
            name: ActionName.finishTesting,
            payload: {
              tests: prv.testsActive.map((tst) =>
                tst.i === modifiedTest.i ? modifiedTest : tst
              )
            }
          }) || prv
      );
      navigation.navigate(SCREEN.testResults);
    } else {
      //wrong answer
      setState((prv) => {
        return (
          reduce(prv, {
            name: ActionName.updateTest,
            payload: { test: modifiedTest, isRight }
          }) || prv
        );
      });
    }
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
  const handleLevelChange = (level: PASSAGELEVEL, passageId: number) => {
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
  //to rerender specific test on downgrading
  const handleDispatch = (action: ActionModel) => {
    setState((prv) => {
      return reduce(prv, action) || prv;
    });
  };

  const testsStyle = StyleSheet.create({
    viewHidden: {
      display: "none"
    },
    testNav: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      height: "100%",
      overflow: "scroll"
    },
    centeredView: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 30
    },
    subText: {
      color: theme.colors.text,
      fontSize: 20,
      textAlign: "center",
      marginHorizontal: 20
    }
  });

  //nothing valid to render — the focus-gated effect above handles redirecting
  if (!state.testsActive.length) {
    return <View style={{ ...theme.theme.screen }} />;
  }
  const activeTestObj: TestModel = {
    ...state.testsActive[activeTestIndex],
    td:
      state.testsActive[activeTestIndex]?.td?.filter((tst) => tst.length === 1)
        .length > 0
        ? state.testsActive[activeTestIndex]?.td.map((tst) =>
            tst.length === 1 ? [...tst, new Date().getTime()] : tst
          )
        : [
            ...(state.testsActive[activeTestIndex]?.td || []),
            [new Date().getTime()]
          ]
  };
  const targetPassage: PassageModel = state.passages.find(
    (p) => p.id === activeTestObj.pi
  ) as PassageModel;
  if (!targetPassage) {
    return <View style={{ ...theme.theme.screen }} />;
  }
  const DottList =
    state.testsActive.length < 13
      ? () => (
          <View style={{ ...testsStyle.testNav }}>
            {state.testsActive.map((tst, i, arr) => {
              const isFinished = tst.f;
              const hasErrors = !!tst.en;
              const isFirst = i === 0;
              //if it first and unfinished
              //or if not finished and previus is finished
              const isLastOfUnfinished =
                (isFirst && !isFinished) || (!isFinished && arr[i - 1]?.f);
              const color =
                isFinished || (activeTestIndex === i && !hasErrors)
                  ? "green"
                  : hasErrors
                    ? "red"
                    : isLastOfUnfinished
                      ? "text"
                      : "gray";
              return (
                <TestNavDot
                  key={tst.i}
                  isCurrent={activeTestIndex === i}
                  color={color}
                  onPress={() =>
                    isFinished || isLastOfUnfinished || hasErrors
                      ? setActiveTest(i)
                      : null
                  }
                />
              );
            })}
          </View>
        )
      : () => (
          <View style={{ ...testsStyle.testNav }}>
            <TestNavDot
              key={"testDoddGreen"}
              isCurrent={false}
              color={"green"}
              onPress={() => {}}
            />
            <Text style={theme.theme.text}>
              {state.testsActive.filter((t) => t.f).length}x
            </Text>
            <TestNavDot
              key={"testDoddRed"}
              isCurrent={false}
              color={"red"}
              onPress={() => {}}
            />
            <Text style={theme.theme.text}>
              {state.testsActive.filter((t) => t.en && !t.f).length}x
            </Text>
            <TestNavDot
              key={"testDoddGray"}
              isCurrent={false}
              color={"gray"}
              onPress={() => {}}
            />
            <Text style={theme.theme.text}>
              {state.testsActive.filter((t) => !t.td.length).length}x
            </Text>
          </View>
        );

  return (
    <View style={{ ...theme.theme.screen }}>
      <View
        style={{
          ...theme.theme.view,
          //if there are any unfinished tests
          ...(state.testsActive?.filter((tst) => !tst.f)?.length === 0
            ? testsStyle.viewHidden
            : {})
        }}
      >
        <Header
          navigation={navigation}
          showBackButton={false}
          alignChildren="flex-start"
          additionalChildren={[
            <IconButton
              key="icon"
              icon={IconName.cross}
              onPress={() => setShowExitConfirm(true)}
            />,
            <DottList key="list" />
          ]}
        />
        <LevelPicker
          state={state}
          targetPassage={targetPassage}
          testLevel={activeTestObj.l}
          handleChange={handleLevelChange}
          handleOpen={handleLevelPickerOpen}
          handleRestart={handleReset}
        />
        {activeTestObj?.l === TESTLEVEL.l10 && (
          <L10
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l11 && (
          <L11
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l20 && (
          <L20
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l21 && (
          <L21
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l30 && (
          <L30
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l40 && (
          <L40
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l50 && (
          <L50
            test={activeTestObj}
            state={state}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {state.settings.devModeEnabled && (
          <Button onPress={handleReset} title={t("Reset")} />
        )}
        {/* {
        state.settings.devModeEnabled &&
        <Button theme={theme} onPress={() => {
          handleTestSubmit({
            isRight: true,
            modifiedTest:activeTestObj
          })
        }} title={t("Pass")}/>
        } */}
      </View>
      <MiniModal
        shown={showExitConfirm}
        handleClose={() => setShowExitConfirm(false)}
      >
        <Text style={{ ...theme.theme.text, fontSize: 18 }}>
          {t("TestExitConfirmationText")}
        </Text>
        <View
          style={{
            ...theme.theme.rowView,
            ...theme.theme.marginVertical,
            ...theme.theme.gap20
          }}
        >
          <Button
            onPress={() => setShowExitConfirm(false)}
            type="secondary"
            title={t("Cancel")}
          />
          <Button
            onPress={() => {
              exitTests();
              setShowExitConfirm(false);
            }}
            type="main"
            color="green"
            title={t("ExitTesting")}
          />
        </View>
      </MiniModal>
    </View>
  );
};
