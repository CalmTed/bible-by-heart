import React, { FC, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { TESTLEVEL, PASSAGELEVEL } from "../constants";
import { ActionModel, ActionName, PassageModel, TestModel } from "../models";
import { navigateWithState } from "../screeenManagement";
import { SCREEN } from "../constants";
import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { IconName } from "../components/Icon";
import { createT } from "../l10n";
import { ScreenModel } from "./homeScreen";
import { reduce } from "../tools/reduce";
import { TestNavDott } from "../components/testNevDott";
import { L10, L11 } from "../components/levels/l1";
import { L20, L21 } from "../components/levels/l2";
import { L30 } from "../components/levels/l3";
import { LevelPicker } from "../components/LevelPicker";
import { L40 } from "../components/levels/l4";
import { L50 } from "../components/levels/l5";
import { useApp } from "../tools/useApp";

export const TestsScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, setState, t, theme } = useApp({ route, navigation });
  const nextUnfinishedTestIndex = state.testsActive.indexOf(
    state.testsActive.filter((tst) => !tst.f)[0]
  );
  const [activeTestIndex, setActiveTest] = useState(
    nextUnfinishedTestIndex !== -1 ? nextUnfinishedTestIndex : 0
  );

  const exitTests = () => {
    const newState =
      reduce(state, {
        name: ActionName.clearActiveTests,
      }) || state;
    navigateWithState({ navigation, screen: SCREEN.home, state: newState });
  };

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
    if (
      isRight &&
      state.testsActive.filter((tst) => !tst.f).length > 1
    ) {
      //if test is right but it is not the last
      setActiveTest(() => {
        //set first of unfinished and not active tests to be active
        return state.testsActive.indexOf(
          state.testsActive.filter(
            (tst) => !tst.f && tst.i !== activeTestObj.i
          )[0]
        );
      });
    } else if (isRight) {
      //if last test and right then finish
      const newState =
        reduce(state, {
          name: ActionName.finishTesting,
          payload: {
            tests: state.testsActive.map((tst) =>
              tst.i === modifiedTest.i ? modifiedTest : tst
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

  //if no active tests > create them
  if (!state.testsActive.length) {
    exitTests()
    return <View style={{ ...theme.theme.screen }} />;
  }
  const activeTestObj: TestModel = {
    ...state.testsActive[activeTestIndex],
    td:
      state.testsActive[activeTestIndex]?.td?.filter(
        (tst) => tst.length === 1
      ).length > 0
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
    exitTests()
    return <View style={{ ...theme.theme.screen }} />;
  }
  const tempT = createT(
    state.settings.translations.find(
      (tr) => tr.id === targetPassage.verseTranslation
    )?.addressLanguage || state.settings.langCode
  );
  const DottList = state.testsActive.length < 13 
  ? () => <View style={{ ...testsStyle.testNav }}>
    {state.testsActive.map((tst, i, arr) => {
      const isFinished = tst.f;
      const hasErrors = !!tst.en;
      const isFirst = i === 0;
      //if it first and unfinished
      //or if not finished and previus is finished
      const isLastOfUnfinished =
        (isFirst && !isFinished) ||
        (!isFinished && arr[i - 1]?.f);
      const color =
        isFinished || (activeTestIndex === i && !hasErrors)
          ? "green"
          : hasErrors
          ? "red"
          : isLastOfUnfinished
          ? "text"
          : "gray";
      return (
        <TestNavDott
          theme={theme}
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
    : () => <View style={{ ...testsStyle.testNav }}>
        <TestNavDott
          theme={theme}
          key={"testDoddGreen"}
          isCurrent={false}
          color={"green"}
          onPress={() => {}}
        />
        <Text style={theme.theme.text}>{state.testsActive.filter(t => t.f).length}x</Text>
        <TestNavDott
          theme={theme}
          key={"testDoddRed"}
          isCurrent={false}
          color={"red"}
          onPress={() => {}}
        />
        <Text style={theme.theme.text}>{state.testsActive.filter(t => t.en && !t.f).length}x</Text>
        <TestNavDott
          theme={theme}
          key={"testDoddGray"}
          isCurrent={false}
          color={"gray"}
          onPress={() => {}}
        />
        <Text style={theme.theme.text}>{state.testsActive.filter(t => !t.td.length).length}x</Text>
    </View>

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
            <DottList/>
          ]}
        />
        <LevelPicker
          t={t}
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
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l11 && (
          <L11
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l20 && (
          <L20
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l21 && (
          <L21
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l30 && (
          <L30
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l40 && (
          <L40
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
        {activeTestObj?.l === TESTLEVEL.l50 && (
          <L50
            test={activeTestObj}
            state={state}
            t={tempT}
            submitTest={handleTestSubmit}
            dispatch={handleDispatch}
          />
        )}
      {
        state.settings.devModeEnabled &&
        <Button theme={theme} onPress={handleReset} title={t("Reset")}/>
        }
      </View>
    </View>
  );
};
