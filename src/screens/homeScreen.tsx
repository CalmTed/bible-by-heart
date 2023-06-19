import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { storageName, SCREEN, LANGCODE } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { AppStateModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createT } from "../l10n"
import { Button } from "../components/Button"
import { DaggerLogoSVG } from "../svg/daggetLogo"
import storage from "../storage"
import { getStroke } from "../tools/getStats"
import { WeekActivityComponent } from "../components/weekActivityComponent"
import { getTheme } from "../tools/getTheme"

export interface ScreenModel {
  route: any
  navigation: StackNavigationHelpers
}

export const HomeScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const t = createT(state?.settings?.langCode || LANGCODE.en);
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
  const strokeData = getStroke(state.testsHistory)
  const theme = getTheme(state.settings.theme);
  return <View style={{...theme.theme.screen,...theme.theme.view}}>
    <View style={homeStyle.logoView}>
      <DaggerLogoSVG isOutline={strokeData.today} color={theme.colors.text}/>
      <Text style={{...homeStyle.titleText, ...theme.theme.text}}>{t("appName")}</Text>
      <Text style={{...theme.theme.text, color: theme.colors.textSecond}}>{t("DaysStroke")}: {strokeData.length}</Text>
      {/* <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("TestsCompleted")}: {state.testsHistory.length}</Text> */}
      {/* <Text style={{...globalStyle.text, color: COLOR.textSecond}}>{t("ErrorsMade")}: {errorNumber}</Text> */}
    </View>
    <WeekActivityComponent theme={theme} state={state} t={t}></WeekActivityComponent>
    <View style={homeStyle.buttonView}>
      <Button theme={theme} type="main" color="green" title={t("homePractice")} onPress={() => navigateWithState({navigation, screen: SCREEN.test, state: state})} />
      <Button theme={theme} title={t("homeList")} onPress={() => navigateWithState({navigation, screen: SCREEN.listPassage, state: state})}></Button>
      <Button theme={theme} title={t("homeSettings")} onPress={() => navigateWithState({navigation, screen: SCREEN.settings, state: state})}></Button>
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
    fontSize: 35,
    fontWeight: "700"
  },
  buttonView: {
    flex: 1,
    alignItems: "center",
    gap: 10
  }
})