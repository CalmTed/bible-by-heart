import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { storageName, globalStyle, COLOR, TestLevel } from "../constants"
import { ActionName, AddressType, AppStateModel, TestModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { SCREEN } from "../constants";
import { Header } from "../components/Header"
import { Button, IconButton } from "../components/Button"
import { IconName } from "../components/Icon"
import { createAddress, createPassage } from "../initials"
import { AddressPicker } from "../components/AddressPicker"
import { WORD, createT } from "../l10n"
import { ScreenModel } from "./homeScreen"
import storage from "../storage"
import { generateTests } from "../tools/generateTests"
import addressToString from "../tools/addressToString"
import { reduce } from "../tools/reduce"
import { TestNavDott } from "../components/testNevDott"

export const TestsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const [activeTestIndex, setActiveTest] = useState(0)
  const t = createT(state.langCode);
  useEffect(() => {//updating state on component mounting
    setState(oldState);
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
      name: ActionName.setActivatTests,
      payload: []
    }) || state
    navigateWithState({navigation, screen: SCREEN.home, state: newState}) 
  }

  const activateTests = () => {
    setState(prevState => {
      const newState = reduce(prevState, {
        name: ActionName.setActivatTests,
        payload: generateTests(state.passages, state.testsHistory)
      })
      return newState ? newState : prevState
    })
  }
  const handleReset = () => {
    setState(prevState => {
      const newState = reduce(prevState, {
        name: ActionName.setActivatTests,
        payload: []
      })
      return newState ? newState : prevState
    })
  }
  const handleTestSubmit: (data: {isRight:boolean, modifiedTest: TestModel}) => void = ({isRight, modifiedTest}) => {
    //update test
    //shuffle list if needed
    if(isRight && activeTestIndex < state.testsActive.length-1){
      setActiveTest(prv => prv + 1);
    }else if(isRight){
      //submit tests
      //remove active
      //add history  
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
    //toggle test
  }

  //if no active tests > create them
  if(!state.testsActive.length){
    setActiveTest(0)
    activateTests();
    return <View style={{...globalStyle.screen}}></View>
  }
  const activeTestObj = {
    ...state.testsActive[activeTestIndex],
    dateStarted: !!state.testsActive[activeTestIndex]?.dateStarted ? state.testsActive[activeTestIndex]?.dateStarted : new Date().getTime()
  }
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
            const color = (isFinished || activeTestIndex === i) && !hasErrors ? "green" : hasErrors ? "red" : "gray";
            return <TestNavDott key={t.id} isCurrent={activeTestIndex === i} color={color}/>
          })}
        </View>
      ]} />
      { activeTestObj?.level === TestLevel.l10 && <L10 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit}/> }
      { activeTestObj?.level === TestLevel.l11 && <L11 test={activeTestObj} state={state} t={t} submitTest={handleTestSubmit} /> }
      <Button type="main" color="gray" title="Reset" onPress={handleReset}></Button>
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
  }
});

interface LevelComponentModel {
  test: TestModel
  state: AppStateModel
  t: (w: WORD) => string
  submitTest: (data:{isRight: boolean, modifiedTest: TestModel}) => void
}

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    flex: 1
  },
  passageText: {
    fontSize: 18,
    letterSpacing: 0.5,
    margin: 20
  },
  optionButtonsWrapper: {
    flex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  }
})

const L10: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const handleTestSubmit = (value: AddressType) => {
    const targetPassage = state.passages.find(p => test.passageId === p.id)
    if(!targetPassage){
      return <View></View>;
    }
    
    if(JSON.stringify(targetPassage.address) === JSON.stringify(value)){
      //set right: error: 0
      submitTest({isRight: true, modifiedTest: {
        ...test,
        dateFinished: new Date().getTime()
      }})
    }else{
      //add error
      submitTest({isRight: false, modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongAddressToVerse",
        wrongAddress: [...test.wrongAddress, value]
      }})
    }
  }
  return <View style={{...levelComponentStyle.levelComponentView}}>
    <ScrollView style={{...levelComponentStyle.passageTextView}}>
      <Text style={{...globalStyle.text, ...levelComponentStyle.passageText}}>{state.passages.find(p => p.id === test.passageId)?.verseText}</Text>
    </ScrollView>
    <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      { 
      test.testData.addressOptions && test.testData.addressOptions.map(op => {
        return <Button key={JSON.stringify(op)} title={addressToString(op,t)} type="outline" color="green" onPress={() => handleTestSubmit(op)}/>
      })}
    </View>
  </View>
}

const L11: FC<LevelComponentModel> = ({test, state, t}) => {
  const activePassage = state.passages.find(p => p.id === test.passageId)
  return <View>
    {activePassage && <Text style={{...globalStyle.text}}>{addressToString(activePassage.address, t)}</Text>}
  </View>
}

