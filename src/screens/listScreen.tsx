import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, StyleProp, TextStyle } from "react-native"
import { storageName, globalStyle, COLOR } from "../constants"
import { ActionName, AddressType, AppStateModel, PassageModel } from "../models"
import { navigateWithState, reduce } from "../screeenManagement"
import { SCREEN } from "../constants";
import { Header } from "../components/Header"
import { Button, IconButton } from "../components/Button"
import { Icon, IconName } from "../components/Icon"
import { createAddress, createPassage } from "../initials"
import { AddressPicker } from "../components/AddressPicker"
import { WORD, createT } from "../l10n"
import { ScreenModel } from "./homeScreen"
import storage from "../storage"
import { PassageEditor } from "../components/PassageEditor"
import addressToString from "../tools/addressToString"
import { TouchableOpacity } from "react-native-gesture-handler"

export const ListScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [selectedAddress, setSelectedAddress] = useState(createAddress);
  const [isAPOpen, setAPOpen] = useState(false);
  
  const [isPEOpen, setPEOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState(createPassage(createAddress(), ""));
  const [state, setState] = useState(oldState);

  const [searchText, setSearch] = useState("");
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
    setSelectedPassage(createPassage(address, ""));
    setPEOpen(true);
    //validate address copy start to end if one verse selected 
  }
  const handlePECancel = () => {
    setPEOpen(false);
  }
  const handlePESubmit = (passage: PassageModel) => {
    //reduce set pasage
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setPassage,
        payload: passage
      });
      return newState ? newState : prv;
    })
    setPEOpen(false);
  }
  const  handlePERemove = (id: number) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.removePassage,
        payload: id
      });
      return newState ? newState : prv;
    })
    setPEOpen(false);
  } 
  const handleListItemEdit = (passage: PassageModel) => {
    setSelectedPassage(passage);
    setPEOpen(true);
  } 
  const handleListItemPress = (passage: PassageModel) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setPassage,
        payload: {...passage, isCollapsed: !passage.isCollapsed}
      });
      return newState ? newState : prv;
    })
  } 
  const filteredPassages = state?.passages.filter(p => 
    p.verseText.toLowerCase().includes(searchText.toLowerCase())
    || addressToString(p.address, t).toLowerCase().includes(searchText.toLowerCase())
    || p.tags.join("").toLowerCase().includes(searchText.toLowerCase())
  )
  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <Header navigation={navigation} showBackButton title={t("listScreenTitle")} additionalChildren={[
      <IconButton icon={IconName.add} onPress={handleAPOpen} />,
      <IconButton icon={IconName.done} onPress={() => navigateWithState({navigation, screen: SCREEN.home, state})} />
    ]} />
    <ScrollView style={listStyle.listView}>
      <View style={listStyle.searchView}>
        <Icon iconName={IconName.search} />
        <TextInput style={listStyle.searchTextInput} value={searchText} onChangeText={(newVal) => setSearch(newVal)}/>
        {!!searchText.length && <IconButton icon={IconName.cross} onPress={() => setSearch("")}/>}
      </View>
      {filteredPassages.map(passage => {
        return <ListItem key={passage.id} data={passage} t={t} onPress={() => handleListItemPress(passage)} onEdit={() => handleListItemEdit(passage)}/>
      })}
    </ScrollView>
    <AddressPicker visible={isAPOpen} address={selectedAddress} onCancel={handleAPCancel} onConfirm={handleAPSubmit} t={t}/>
    <PassageEditor visible={isPEOpen} passage={selectedPassage} onCancel={handlePECancel} onConfirm={handlePESubmit} onRemove={handlePERemove} t={t} />
  </View>
}

const ListItem: FC<{data: PassageModel, t:any, onPress: () => void, onEdit: () => void}> = ({data, t, onPress, onEdit}) => {
  const additionalStyles = (data.isCollapsed ? {overflow: "visible"} : {overflow: "hidden", height: 22})
  return <TouchableOpacity onPress={onPress}>
    <View style={listStyle.listItemView}>
      <Text style={listStyle.listItemAddress}>{addressToString(data.address,t)}</Text>
      <Text style={{...listStyle.listItemText, ...additionalStyles} as StyleProp<TextStyle>}>{data.verseText}</Text>
      {data.isCollapsed && <Button title={t("Edit")} onPress={onEdit} />}
    </View>
  </TouchableOpacity>
}

const listStyle = StyleSheet.create({
  searchView: {
    flexDirection: "row",
    paddingHorizontal: 20,
    alignItems: "center",
    height: 50
  },
  searchTextInput: {
    flex: 1,
    color: COLOR.text,
    paddingHorizontal: 20,
    fontSize: 16
  },
  listView: {
    width: "100%",
    
  },
  listItemView: {
    backgroundColor: COLOR.bgSecond,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  listItemAddress: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "500"
  },
  listItemText: {
    color: COLOR.textSecond,
    fontSize: 16
  }
});