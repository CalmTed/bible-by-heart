import React, { FC, useEffect, useState } from "react"
import { View, Text, Button, ToastAndroid } from "react-native"
import { storageName, globalStyle } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { AppStateModel } from "../models"
import Storage from "react-native-storage"
import AsyncStorage from "@react-native-community/async-storage"
import { navigateWithState } from "../screeenManagement"
import { SCREEN } from "../constants";

export interface ScreenModel {
  route: any
  navigation: StackNavigationHelpers
}

const storage = new Storage({
  size: 100,
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

export const ListScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
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
    <Text style={{...globalStyle.text, fontSize: 30}}>{state.lastChange}</Text>
    <Button title="Back" onPress={() => navigateWithState({navigation, screen: SCREEN.home, state})}></Button>
  </View>
}