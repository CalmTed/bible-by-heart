import React, { FC, useEffect, useState } from "react"
import { View, Text, Button, ToastAndroid, StyleSheet } from "react-native"
import { storageName, globalStyle, COLOR } from "../constants"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { AddressType, AppStateModel, PassageModel } from "../models"
import Storage from "react-native-storage"
import AsyncStorage from "@react-native-community/async-storage"
import { navigateWithState } from "../screeenManagement"
import { SCREEN } from "../constants";
import { Header } from "../components/Header"
import { IconButton } from "../components/Button"
import { IconName } from "../components/Icon"
import { createAddress } from "../initials"
import { AddressPicker } from "../components/AddressPicker"
import { createT } from "../l10n"

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
  const [selectedAddress, setSelectedAddress] = useState(createAddress());
  const [isAPOpen, setAPOpen] = useState(false);
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
  
  const handleAPOpen = () => {
    setAPOpen(true);
  }

  const handleAPCancel = () => {
    setAPOpen(false);
    setSelectedAddress(createAddress);
  }
  const handleAPSubmit = (address: AddressType) => {
    setAPOpen(false);
    console.log(address)
    //validate address copy start to end if one verse selected
    //reduce adding a
  }

  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <Header navigation={navigation} showBackButton title={t("listScreenTitle")} additionalChildren={[
      <IconButton icon={IconName.add} onPress={handleAPOpen} />,
      <IconButton icon={IconName.done} onPress={() => navigateWithState({navigation, screen: SCREEN.home, state})} />
    ]} />
    {state?.passages.map(passage => {
      return <ListItem key={passage.id} data={passage} />
    })}
    <AddressPicker visible={isAPOpen} address={selectedAddress} onCancel={handleAPCancel} onConfirm={handleAPSubmit} t={t}/>
  </View>
}

const ListItem: FC<{data: PassageModel}> = ({data}) => {
  return <View style={listStyle.listItemView}>
    <Text style={listStyle.listItemAddress}>{`${data.address.bookIndex} ${data.address.startChapterNum}:${data.address.startVerseNum}-${data.address.endChapterNum}:${data.address.endVerseNum}`}</Text>
    <Text style={listStyle.listItemText}>{data.verseText}</Text>
  </View>
}

const listStyle = StyleSheet.create({
  listItemView: {
    backgroundColor: COLOR.bgSecond
  },
  listItemAddress: {
    color: COLOR.text,
    fontSize: 20
  },
  listItemText: {
    color: COLOR.textSecond,
    fontSize: 16
  }
});