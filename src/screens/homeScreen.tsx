import React, { FC, useEffect, useState } from "react"
import { View, Text, Modal, StyleSheet, TouchableWithoutFeedback, ScrollView, ToastAndroid } from "react-native"
import { storageName, globalStyle, SCREEN, LANGCODE, COLOR } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { ActionName, AppStateModel, PassageModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createAddress, createAppState, createPassage } from "../initials"
import { createT } from "../l10n"
import { Button } from "../components/Button"
import { DaggerLogoSVG } from "../svg/daggetLogo"
import storage from "../storage"
import { reduce } from "../tools/reduce"

export interface ScreenModel {
  route: any
  navigation: StackNavigationHelpers
}

export const HomeScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const t = createT(state.langCode);
  useEffect(() => {
    setState(oldState);
  }, [JSON.stringify(oldState)]);

  useEffect(() => {
    storage.save({
      key: storageName,
      data: {...state}
    }).then((e) => {
    })
  }, [JSON.stringify(state)]);

  const testPassagesList: PassageModel[] = [
    createPassage({bookIndex: 0, startChapterNum: 1, startVerseNum: 2, endChapterNum: NaN, endVerseNum: NaN}, "Test passage"),
    createPassage({bookIndex: 3, startChapterNum: 12, startVerseNum: 12, endChapterNum: 12, endVerseNum: 16}, "You need to add support for React Native-specific ESLint rules in the settings. You can add these rules with the following command: $ npm install --save-dev eslint-plugin-react-native Now, you need to add a few directives to the config file. 'react-native' to the 'plugin' section. 'react-native/react-native': true to the 'env' sectio"),
    createPassage({bookIndex: 10, startChapterNum: 2, startVerseNum: 1, endChapterNum: 3, endVerseNum: 1}, "Github actions to run ESLint and TypeScript checks View on GitHub Steps 1. Install ESLint, and its plugins for React and React Native Simply run below! yarn add -D eslint eslint-plugin-react eslint-plugin-react Docs")
  ]
  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <View style={homeStyle.logoView}>
      <DaggerLogoSVG/>
      <Text style={homeStyle.titleText}>{t("appName")}</Text>
      <Text style={globalStyle.text}>Total practiced: {state.testsHistory.length} times</Text>
      <Text style={globalStyle.text}>Made {state.testsHistory.map(t => t.errorNumber || 0).reduce((partialSum, a) => partialSum + a, 0)} erros</Text>
    </View>
    <View style={homeStyle.buttonView}>
      <Button type="main" title={t("homePractice")} onPress={() => navigateWithState({navigation, screen: SCREEN.test, state: state})} />
      <Button title={t("homeList")} onPress={() => navigateWithState({navigation, screen: SCREEN.listPassage, state: state})}></Button>
      <Button title={t("homeChangeLang")} onPress={() => setState(st => reduce(st, {name: ActionName.setLang, payload: st.langCode === LANGCODE.en ? LANGCODE.ua : LANGCODE.en}) || st)} />
      {/* <Button title={"Set test data"} onPress={() => setState({...createAppState(), passages: testPassagesList})} type="outline" color="red" /> */}
      <Button title={t("homeClearData")} onPress={() => setState(prv => {return {...prv, testsHistory: []}})} type="outline" color="red" />
    </View>
  </View>
}

const homeStyle = StyleSheet.create({
  logoView: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  titleText: {
    ...globalStyle.text,
    fontSize: 35,
    fontWeight: "700"
  },
  buttonView: {
    flex: 1,
    alignItems: "center",
    gap: 10
  }
})