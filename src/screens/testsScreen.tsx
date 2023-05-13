import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { storageName, globalStyle, TestLevel, COLOR, PassageLevel } from "../constants"
import { ActionModel, ActionName, AppStateModel, PassageModel, TestModel } from "../models"
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
import { MiniModal } from "../components/miniModal"

export const TestsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const [activeTestIndex, setActiveTest] = useState(0)
  const [levelPickerShown, setLevelPickerShown] = useState(false)
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
  const closeLevelPicker = () => {
    setLevelPickerShown(false)
  }
  const openLevelPicker = () => {
    setLevelPickerShown(true)
  }
  const submitLevelPicker = (level: number) => {
    console.log(level)
    closeLevelPicker()
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
  return <View style={{...globalStyle.screen}}>
    <View style={{
      ...globalStyle.view,
      ...(!state.testsActive.filter(t => !t.dateFinished).length ? testsStyle.viewHidden : {})
      }}>
      <Header navigation={navigation} showBackButton={false} alignChildren="flex-start" additionalChildren={[
        <IconButton icon={IconName.cross} onPress={exitTests} />,
        <View style={{...testsStyle.testNav}}>
          {state.testsActive.map((t, i) => {
            const isFinished = !!state.testsActive[i].dateFinished
            const hasErrors = !!state.testsActive[i].errorNumber
            const color = (isFinished || (activeTestIndex === i && !hasErrors) ) ? "green" : hasErrors ? "red" : "gray";
            return <TestNavDott key={t.id} isCurrent={activeTestIndex === i} color={color}/>
          })}
        </View>
      ]} />
      <View style={{...testsStyle.levelPickerView}}>
        <Button title={ `${t("Level")} ${targetPassage.selectedLevel}`} icon={IconName.selectArrow} onPress={() => openLevelPicker()}/>
        <MiniModal shown={levelPickerShown} handleClose={() => setLevelPickerShown(false)}>
          <Text style={levelPickerStyles.headerText}>{t("LanguagePickerHeading")}</Text>
          <View style={levelPickerStyles.buttonsView}>
            {[PassageLevel.l1,PassageLevel.l2,PassageLevel.l3,PassageLevel.l4,PassageLevel.l5].map(n => {
              const color = targetPassage.selectedLevel === n ? "green" : "gray"
              const disabled = n >targetPassage.maxLevel
              return <Button type={"secondary"} color={color} style={levelPickerStyles.buttonStyle} key={n} title={n.toString()} onPress={() => submitLevelPicker(n)} disabled={disabled}/>
            })}
          </View>
          <Text style={levelPickerStyles.subText}>{t("LanguagePickerSubtext")}</Text>
        </MiniModal>
      </View>
      { activeTestObj?.level === TestLevel.l10 && <L10 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit}/> }
      { activeTestObj?.level === TestLevel.l11 && <L11 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TestLevel.l20 && <L20 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      { activeTestObj?.level === TestLevel.l21 && <L21 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      <Button type="main" color="gray" title={t("Reset")} onPress={handleReset}></Button>
    </View>
  </View>
}

const testsStyle = StyleSheet.create({
  levelPickerView: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%"
  },
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
});

const levelPickerStyles = StyleSheet.create({
  headerText: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontWeight: "500",
    fontSize: 22,
  },
  subText: {
    textAlign: "center",
    color: COLOR.textSecond,
    fontSize: 16
  },
  buttonsView: {
    marginTop: 50,
    marginBottom: 20,
    flexDirection: "row",
    gap: 5
  },
  buttonStyle: {
    margin: 0
  }
})