import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { storageName, globalStyle, TEST_LEVEL, COLOR, PASSAGE_LEVEL } from "../constants"
import { ActionName, AppStateModel, PassageModel, TestModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { SCREEN } from "../constants";
import { Header } from "../components/Header"
import { Button, IconButton } from "../components/Button"
import { IconName } from "../components/Icon"
import { createT } from "../l10n"
import { ScreenModel } from "./homeScreen"
import storage from "../storage"
import { generateTests } from "../tools/generateTests"
import { reduce } from "../tools/reduce"
import { TestNavDott } from "../components/testNevDott"
import { L10, L11 } from "../components/levels/l1"
import { L20, L21 } from "../components/levels/l2"
import { L30 } from "../components/levels/l3"
import { LevelPicker } from "../components/LevelPicker"
import { L40 } from "../components/levels/l4"
import { L50 } from "../components/levels/l5"

export const TestsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const [activeTestIndex, setActiveTest] = useState(0)
  const t = createT(state.langCode);
  useEffect(() => {//updating state on component mounting
    if(oldState.lastChange > state.lastChange){
      setState(oldState);
    }
  }, [JSON.stringify(oldState)]);

  useEffect(() => {//saving to storage every state change
    storage.save({
      key: storageName,
      data: {...state}
    }).then((e) => {
    })
  }, [JSON.stringify(state)]);

  const exitTests = () => {
    const newState = reduce(state, {
      name: ActionName.setActiveTests,
      payload: []
    }) || state
    navigateWithState({navigation, screen: SCREEN.home, state: newState}) 
  }

  const activateTests = () => {
    setState(prevState => {
      const newState = reduce(prevState, {
        name: ActionName.setActiveTests,
        payload: generateTests(state.passages, state.testsHistory)
      })
      return newState ? newState : prevState
    })
  }
  const handleReset = () => {
    setState(prevState => {
      const newState = reduce(prevState, {
        name: ActionName.setActiveTests,
        payload: []
      })
      setActiveTest(0)
      return newState ? newState : prevState
    })
  }
  const handleTestSubmit: (data: {isRight:boolean, modifiedTest: TestModel}) => void = ({isRight, modifiedTest}) => {
    if(isRight && activeTestIndex < state.testsActive.length-1){
      setActiveTest(prv => prv + 1);
    }else if(isRight){
      //if last test and right
      const newState = reduce(state, {
        name: ActionName.finishTesting,
        payload: {
          tests: state.testsActive.map(t => t.id === modifiedTest.id ? modifiedTest : t)
        }
      }) || state
      navigateWithState({navigation, screen: SCREEN.testResults, state: newState})
    }
    setState((prv) => {
      return reduce(prv, {
        name: ActionName.updateTest,
        payload: {
          test: modifiedTest,
          isRight
        }
      }) || prv;
    })
  }
  const handleLevelPickerOpen = (passageId: number) => {
    setState(prv => {
      return reduce(prv, {
        name: ActionName.disableNewLevelFlag,
        payload: passageId
      }) || prv
    })
    }
  const handleLevelChange = (level: PASSAGE_LEVEL, passageId: number) => {
    setState((prv) => {
      return reduce(prv, {
        name: ActionName.setPassageLevel,
        payload: {
          passageId: passageId,
          level: level
        }
      }) || prv
    });
  }

  if(!state.passages.length){
    return <View style={{...globalStyle.screen}}>
      <Header navigation={navigation} showBackButton={true} alignChildren="flex-start"/>
      <View style={testsStyle.centeredView}>
        <Text style={testsStyle.subText}>
          {t("TestsAddPassagesToTest")}
        </Text>
        <Button type="main" title={t("AddPassages")} onPress={() => navigateWithState({screen: SCREEN.listPassage, state, navigation})}/>
      </View>
    </View>
  }
  //if no active tests > create them
  if(!state.testsActive.length){
    activateTests();
    return <View style={{...globalStyle.screen}}></View>
  }
  const activeTestObj = {
    ...state.testsActive[activeTestIndex],
    dateStarted: !!state.testsActive[activeTestIndex]?.dateStarted ? state.testsActive[activeTestIndex]?.dateStarted : new Date().getTime()
  }
  const targetPassage = state.passages.find(p => p.id === activeTestObj.passageId) as PassageModel
  if(!targetPassage){//if passages from old tests left in state
    activateTests();
    return <View style={{...globalStyle.screen}}></View>
  }
  return <View style={{...globalStyle.screen}}>
    <View style={{
      ...globalStyle.view,
      ...!state.testsActive.filter(t => !t.dateFinished).length ? testsStyle.viewHidden : {}
      }}>
      <Header navigation={navigation} showBackButton={false} alignChildren="flex-start" additionalChildren={[
        <IconButton icon={IconName.cross} onPress={exitTests} />,
        <View style={{...testsStyle.testNav}}>
          {state.testsActive.map((t, i) => {
            const isFinished = !!state.testsActive[i].dateFinished
            const hasErrors = !!state.testsActive[i].errorNumber
            const isFirst = i === 0
            //if it first and unfinished
            //or if not finished and previus is finished
            const isNextUnfinished = (isFirst && !isFinished) ||
               (!isFinished && !!state.testsActive[i - 1]?.dateFinished);
            const color = (isFinished || (activeTestIndex === i && !hasErrors) ) ? 
              "green" :
              hasErrors ?
                "red" :
                isNextUnfinished ? 
                  "text" :
                  "gray";
            return <TestNavDott
              key={t.id}
              isCurrent={activeTestIndex === i}
              color={color}
              onPress={() => isFinished || isNextUnfinished ? setActiveTest(i): null}
            />
          })}
        </View>
      ]} />
      <LevelPicker 
        t={t}
        state={state}
        targetPassage={targetPassage}
        activeTestObj={activeTestObj}
        handleChange={handleLevelChange}
        handleOpen={handleLevelPickerOpen}
        handleRestart={handleReset}
      />
      { activeTestObj?.level === TEST_LEVEL.l10 && <L10 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit}/> }
      { activeTestObj?.level === TEST_LEVEL.l11 && <L11 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TEST_LEVEL.l20 && <L20 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TEST_LEVEL.l21 && <L21 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TEST_LEVEL.l30 && <L30 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TEST_LEVEL.l40 && <L40 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TEST_LEVEL.l50 && <L50 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { state.devMode && <Button type="main" color="gray" title={t("Reset")} onPress={handleReset}></Button> }
    </View>
  </View>
}

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
    color: COLOR.text,
    fontSize: 20,
    textAlign: "center",
    marginHorizontal: 20
  },
});

