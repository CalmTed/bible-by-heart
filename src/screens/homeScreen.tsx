import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { storageName, globalStyle, SCREEN, COLOR } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { AppStateModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createT } from "../l10n"
import { Button } from "../components/Button"
import { DaggerLogoSVG } from "../svg/daggetLogo"
import storage from "../storage"

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

  const errorNumber = state.testsHistory.map(t => t.errorNumber || 0).reduce((partialSum, a) => partialSum + a, 0);
  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <View style={homeStyle.logoView}>
      <DaggerLogoSVG/>
      <Text style={homeStyle.titleText}>{t("appName")}</Text>
      <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("TestsCompleted")}: {state.testsHistory.length}</Text>
      <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("ErrorsMade")}: {errorNumber}</Text>
    </View>
    <View style={homeStyle.buttonView}>
      <Button type="main" color="green" title={t("homePractice")} onPress={() => navigateWithState({navigation, screen: SCREEN.test, state: state})} />
      <Button title={t("homeList")} onPress={() => navigateWithState({navigation, screen: SCREEN.listPassage, state: state})}></Button>
      <Button title={t("homeSettings")} onPress={() => navigateWithState({navigation, screen: SCREEN.settings, state: state})}></Button>
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