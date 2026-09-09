import React, { FC, useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { LAYOUT, TESTLEVEL, PASSAGELEVEL, SCREEN } from "../constants";
import {
  ActionModel,
  ActionName,
  LevelComponentModel,
  PassageModel,
  ScreenPropsModel,
  TestModel
} from "../models";

import { Text } from "../components/Text";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { IconName } from "../components/Icon";
import { reduce } from "../utils/reduce";
import { TestNavDot } from "../components/TestNavDot";
import { L10 } from "../components/levels/L10";
import { L11 } from "../components/levels/L11";
import { L20 } from "../components/levels/L20";
import { L21 } from "../components/levels/L21";
import { L30 } from "../components/levels/L30";
import { L40 } from "../components/levels/L40";
import { L50 } from "../components/levels/L50";
import { LevelPicker } from "../components/LevelPicker";
import { useAppContext } from "../context/AppContext";
import { ConfirmModal } from "../components/ConfirmModal";
import { Entrance } from "../components/Entrance";

// Which component plays which test level. A Record over the whole enum on
// purpose: adding a level is then a type error here until it is answered, which
// is what the seven near-identical `activeTest.l === TESTLEVEL.lXX && <LXX .../>`
// blocks this replaced could never enforce.
const LEVEL_COMPONENTS: Record<TESTLEVEL, FC<LevelComponentModel>> = {
  [TESTLEVEL.l10]: L10,
  [TESTLEVEL.l11]: L11,
  [TESTLEVEL.l20]: L20,
  [TESTLEVEL.l21]: L21,
  [TESTLEVEL.l30]: L30,
  [TESTLEVEL.l40]: L40,
  [TESTLEVEL.l50]: L50
};

// More tests than this and the row stops being a row of dots and becomes a
// tally of how many are done / wrong / untouched.
const MAX_DOTS = 13;

const testsStyle = StyleSheet.create({
  testNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: "100%",
    overflow: "scroll"
  },
  // The session's one column. The Header above it still spans - a bar spans, a
  // column does not - but a verse must not run the full width of an unfolded
  // foldable, and the answer buttons must not drift a hand's width apart from
  // each other.
  testColumn: {
    flex: 1,
    width: "100%",
    maxWidth: LAYOUT.maxContentWidth,
    alignItems: "center"
  },
  viewHidden: {
    display: "none"
  }
});

interface TestNavBarModel {
  tests: TestModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/**
 * The training session's header content: one dot per test, or a tally when there
 * are too many of them to read.
 *
 * A real component at module level, not a closure built inside `TestsScreen`'s
 * render. A component defined during render is a NEW component type on every
 * render, so React unmounts and remounts the whole row - every dot and every
 * gradient in it - each time anything in the session changes. Same rule
 * `SwipeActionPanel` follows in `ListScreen`, for the same reason.
 */
const TestNavBar: FC<TestNavBarModel> = ({ tests, activeIndex, onSelect }) => {
  if (tests.length >= MAX_DOTS) {
    return (
      <View style={testsStyle.testNav}>
        <TestNavDot isCurrent={false} color="green" />
        <Text>{`${tests.filter((tst) => tst.f).length}x`}</Text>
        <TestNavDot isCurrent={false} color="red" />
        <Text>{`${tests.filter((tst) => tst.en && !tst.f).length}x`}</Text>
        <TestNavDot isCurrent={false} color="gray" />
        <Text>{`${tests.filter((tst) => !tst.td.length).length}x`}</Text>
      </View>
    );
  }
  return (
    <View style={testsStyle.testNav}>
      {tests.map((tst, i, arr) => {
        const isFinished = tst.f;
        const hasErrors = !!tst.en;
        const isFirst = i === 0;
        //if it first and unfinished
        //or if not finished and previus is finished
        const isLastOfUnfinished =
          (isFirst && !isFinished) || (!isFinished && arr[i - 1]?.f);
        const color =
          isFinished || (activeIndex === i && !hasErrors)
            ? "green"
            : hasErrors
              ? "red"
              : isLastOfUnfinished
                ? "text"
                : "gray";
        return (
          <TestNavDot
            key={tst.i}
            isCurrent={activeIndex === i}
            color={color}
            onPress={() =>
              isFinished || isLastOfUnfinished || hasErrors ? onSelect(i) : null
            }
          />
        );
      })}
    </View>
  );
};

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
  // `StackNavigationHelpers` prop it needed a @ts-ignore.
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
  // (reported from a device). Focus-gating fixes it: while results/finish is
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
  // Typed as possibly missing on purpose: the Record above is exhaustive over
  // TESTLEVEL, but a state carrying a level this build does not know must render
  // an empty session the cross can leave, not throw into the ErrorBoundary.
  const LevelComponent: FC<LevelComponentModel> | undefined =
    LEVEL_COMPONENTS[activeTestObj.l];

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
          backIcon={IconName.cross}
          onBack={() => setShowExitConfirm(true)}
        >
          <TestNavBar
            tests={state.testsActive}
            activeIndex={activeTestIndex}
            onSelect={setActiveTest}
          />
        </Header>
        {/* The whole body arrives as one thing whenever the session moves to
            another test — level label included, because the label is part of
            what changed. `replayKey` is the test id, so answering a test and
            jumping between dots both replay it, while a re-render caused by
            anything else (an error marked, a level changed) does not. */}
        <Entrance replayKey={activeTestObj.i} style={testsStyle.testColumn}>
          <LevelPicker
            state={state}
            targetPassage={targetPassage}
            testLevel={activeTestObj.l}
            handleChange={handleLevelChange}
            handleOpen={handleLevelPickerOpen}
            handleRestart={handleReset}
          />
          {/* Keyed by the test, so moving to the next one MOUNTS a level
              rather than handing it new props. Two tests of the same level are
              the same component type in the same slot, so React would otherwise
              keep the instance and every piece of answer-in-progress state in
              it: level 3's filled-in words, level 5's typed text, a level's
              open picker. An effect can only put that right AFTER the frame
              that already showed it — which on level 3 is the whole verse,
              readable, above the options asking for it. */}
          {LevelComponent && (
            <LevelComponent
              key={activeTestObj.i}
              test={activeTestObj}
              state={state}
              submitTest={handleTestSubmit}
              dispatch={handleDispatch}
            />
          )}
          {state.settings.devModeEnabled && (
            <Button onPress={handleReset} title={t("Reset")} />
          )}
        </Entrance>
      </View>
      <ConfirmModal
        shown={showExitConfirm}
        text={t("TestExitConfirmationText")}
        cancelTitle={t("Cancel")}
        confirmTitle={t("ExitTesting")}
        confirmColor="green"
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          exitTests();
          setShowExitConfirm(false);
        }}
      />
    </View>
  );
};
