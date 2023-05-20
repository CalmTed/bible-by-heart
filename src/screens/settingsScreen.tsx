import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ToastAndroid } from "react-native"
import { storageName, globalStyle, SCREEN, LANGCODE, alowedStateVersions, VERSION } from "../constants"
import { ActionName, AppStateModel, exportingModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createAppState } from "../initials"
import { createT } from "../l10n"
import { Button, IconButton } from "../components/Button"
import storage from "../storage"
import { reduce } from "../tools/reduce"
import { Header } from "../components/Header"
import { IconName } from "../components/Icon"
import { Input } from "../components/Input"
import timeToString from "../tools/timeToString"
import { ScreenModel } from "./homeScreen"

export const SettingsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const [exportedText, setExportedText] = useState("");
  const [importedText, setImportedText] = useState("");
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

  const handleExportData: (state: AppStateModel) => void  = (state) => {
    if(!exportedText.length){
      const exortingObject:exportingModel = {
        version: VERSION,
        passages: state.passages
      }
      setExportedText(JSON.stringify(exortingObject, null,undefined))
    }else{
      setExportedText("")
    }
  }
  const handleImportData: (stateString: string) => void = (stateString) => {
    try{
      //validate json
      const importedData:exportingModel = JSON.parse(stateString)
      //validate version
      if(alowedStateVersions.includes(importedData.version)){
        //setState
        setState(prv => 
          reduce(prv, {
            name: ActionName.setPassagesList,
            payload: importedData.passages
          }) || prv
        )
        ToastAndroid.show("Imported!", 100)
      }else{
        ToastAndroid.show(`Wrong version: ${importedData.version}, allowed: ${alowedStateVersions.join(", ")}`, 100)
      }
    }catch(e){
      ToastAndroid.show("Unable to parce data", 100)
    }
  }

  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <Header navigation={navigation} showBackButton={false} title={t("settingsScreenTitle")} additionalChild={
      <IconButton icon={IconName.done} onPress={() => navigateWithState({screen: SCREEN.home, state, navigation})}/>
    } />
    
    <ScrollView style={settingsStyle.buttonView}>
      <View style={settingsStyle.groupView}>
        <Button type="secondary" title={`${t("settingsChangeLang")} ${t("flag")}`} onPress={() => setState(st => reduce(st, {name: ActionName.setLang, payload: st.langCode === LANGCODE.en ? LANGCODE.ua : LANGCODE.en}) || st)} />
        
      </View>
      <View style={settingsStyle.groupView}>
        <Button type="outline" color={state.devMode ? "green" : "gray"} title={`${t("settingsToggleDevMode")} ${state.devMode ? "on" : "off"}`} onPress={() => setState(st => reduce(st, {name: ActionName.setDevMode, payload: !state.devMode}) || st)} />
        <Text style={globalStyle.text}>{}</Text>
      </View>
      

      {!!state.devMode && <View>
        <View style={settingsStyle.groupView}>
          <Button type="outline" color="gray" title={t("settingsExport")} onPress={() => handleExportData(state)} />
          <Input style={settingsStyle.textarea} placeholder="" value={exportedText} multiline numberOfLines={1} disabled={false} onChange={()=>{setExportedText(exportedText)}} onSubmit={() => {}}/>
        </View>
        <View style={settingsStyle.groupView}>
          <Button type="outline" color="gray" title={t("settingsImport")} onPress={() => handleImportData(importedText)} disabled={!importedText.length} />
          <Input style={settingsStyle.textarea} value={importedText} multiline numberOfLines={1} onChange={(newVal) => setImportedText(newVal)} onSubmit={(newVal) => handleImportData(newVal)} placeholder="" />
        </View>
        <View style={settingsStyle.groupView}>
          <Button title={t("settingsClearHistory")} onPress={() => setState(prv => {return {...prv, testsHistory: []}})} type="outline" color="red" />
          <Button title={t("settingsClearPassages")} onPress={() => setState(prv => {return {...prv, passages: []}})} type="outline" color="red" />
          <Button title={t("settingsClearData")} onPress={() => setState(() => {return createAppState()})} type="outline" color="red" />
        </View>
        <Text style={globalStyle.text}>{t("DateEdited")}: {timeToString(state.lastChange)}</Text>
      </View>}
      <Text style={globalStyle.text}>{t("version")}: {VERSION}</Text>
    </ScrollView>
  </View>
}

const settingsStyle = StyleSheet.create({
  buttonView: {
    width: "100%",
    paddingHorizontal: 20
  },
  groupView:{
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap"
  },
  textarea: {
    width: "100%",
    minHeight: 20,
    maxHeight: 300
  }
})