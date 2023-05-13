import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { storageName, globalStyle, SCREEN} from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { AppStateModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createT } from "../l10n"
import { Button } from "../components/Button"
import storage from "../storage"
import { FinishCupSVG } from "../svg/finishCup"

export interface ScreenModel {
  route: any
  navigation: StackNavigationHelpers
}

export const FinishScreen: FC<ScreenModel> = ({route, navigation}) => {
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

  return <View style={{...globalStyle.screen,...globalStyle.view, ...finishStyle.screen}}>
    <View style={finishStyle.logoView}>
      <FinishCupSVG/>
      <Text style={finishStyle.titleText}>{t("titleWelldone")}</Text>
    </View>
    <View style={finishStyle.buttonView}>
      <Button
        type="main"
        title={t("Continue")}
        onPress={() => navigateWithState({navigation, screen: SCREEN.home, state: state})} 
      />
    </View>
  </View>
}

const finishStyle = StyleSheet.create({
  screen: {
    justifyContent: "center",
    height: "100%"
  },
  logoView: {
    alignItems: "center",
    justifyContent: "center",
    flex: 4
  },
  titleText: {
    ...globalStyle.text,
    fontSize: 35,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  buttonView: {
    flex: 1,
    alignItems: "center"
  }
})