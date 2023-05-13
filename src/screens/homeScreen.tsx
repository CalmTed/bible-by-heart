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

  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <View style={homeStyle.logoView}>
      <DaggerLogoSVG/>
      <Text style={homeStyle.titleText}>{t("appName")}</Text>
      <Text style={{...globalStyle.text, color: COLOR.textSecond}}>Total practiced: {state.testsHistory.length} times</Text>
      <Text style={{...globalStyle.text, color: COLOR.textSecond}}>Made {state.testsHistory.map(t => t.errorNumber || 0).reduce((partialSum, a) => partialSum + a, 0)} erros</Text>
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