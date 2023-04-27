import React, { FC, useEffect, useState } from "react"
import { View, Text, Modal, StyleSheet, TouchableWithoutFeedback, ScrollView, ToastAndroid } from "react-native"
import { storageName, globalStyle, SCREEN, LANGCODE } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { ActionName, AppStateModel } from "../models"
import Storage from "react-native-storage"
import AsyncStorage from "@react-native-community/async-storage"
import { navigateWithState, reduce } from "../screeenManagement"
import { createAppState } from "../initials"
import { createT } from "../l10n"
import { Button } from "../components/Button"
import { DaggerLogoSVG } from "../svg/daggetLogo"

export interface ScreenModel {
  route: any
  navigation: StackNavigationHelpers
}

const storage = new Storage({
  size: 100,
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

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
    </View>
    <View style={homeStyle.buttonView}>
      <Button type="main" title={t("homePractice")} onPress={() => {}} />
      <Button title={t("homeList")} onPress={() => navigateWithState({navigation, screen: SCREEN.listPassage, state: state})}></Button>
      <Button title={t("homeChangeLang")} onPress={() => setState(st => reduce(st, {name: ActionName.setLang, payload: st.langCode === LANGCODE.en ? LANGCODE.ua : LANGCODE.en}) || st)} />
      <Button title={t("homeClearData")} onPress={() => setState(createAppState())} />
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
    alignItems: "center"
  }
})