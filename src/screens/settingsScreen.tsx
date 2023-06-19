import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ToastAndroid } from "react-native"
import { storageName, SCREEN, LANGCODE, alowedStateVersions, VERSION, THEME_TYPE } from "../constants"
import { ActionName, AppStateModel, exportingModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { createT } from "../l10n"
import { Button, IconButton } from "../components/Button"
import storage from "../storage"
import { reduce } from "../tools/reduce"
import { Header } from "../components/Header"
import { IconName } from "../components/Icon"
import { ScreenModel } from "./homeScreen"
import { SettingsMenuItem } from "../components/setttingsMenuItem"
import { getTheme } from "../tools/getTheme"

export const SettingsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);
  const [exportedText, setExportedText] = useState("");
  const [importedText, setImportedText] = useState("");
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
  const theme = getTheme(state.settings.theme);
  return <View style={{...theme.theme.screen,...theme.theme.view}}>
    <Header theme={theme} navigation={navigation} showBackButton={false} title={t("settingsScreenTitle")} additionalChild={
      <IconButton theme={theme} icon={IconName.done} onPress={() => navigateWithState({screen: SCREEN.home, state, navigation})}/>
    } />
    <ScrollView style={settingsStyle.scrollView}>
      <View style={settingsStyle.topUserDataView}>
        <View style={{...settingsStyle.userImageView, backgroundColor: theme.colors.bgSecond}}>

        </View>
        {/* if not logon */}
        <Button theme={theme} onPress={() => {}} title="Login" type="transparent"/>
        {/* if logon */}
      </View>
      <View>
        <SettingsMenuItem
          theme={theme}
          header={t("settsLabelMain")}
          type="label"
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsChangeLang")}
          subtext={`${t("name")} ${t("flag")}`}
          type="select"
          options={Object.entries(LANGCODE).map(([k,v]) => {
            const customT = createT(v)
            return {
              value: k,
              label: `${customT("name")} ${customT("flag")}`
            }
          })}
          selectedIndex={Object.keys(LANGCODE).indexOf(state.settings.langCode)}
          onSelect={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setLang,
                payload: value as LANGCODE
              }) || st
            )
          }}
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsChangeTheme")}
          subtext={t(state.settings.theme)}
          type="select"
          options={Object.entries(THEME_TYPE).map(([k,v]) => {
            return {
              value: k,
              label: t(v)
            }
          })}
          selectedIndex={Object.keys(THEME_TYPE).indexOf(state.settings.theme)}
          onSelect={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setTheme,
                payload: value as THEME_TYPE
              }) || st
            )
          }}
        />
      </View>
    {/* <View style={settingsStyle.groupView}>
      <Button type="secondary" title={`${t("settingsChangeLang")} ${t("flag")}`} onPress={() => setState(st => reduce(st, {name: ActionName.setLang, payload: st.settings.langCode === LANGCODE.en ? LANGCODE.ua : LANGCODE.en}) || st)} />
    </View>
      <View style={settingsStyle.groupView}>
        <Button type="outline" color={state.settings.devMode ? "green" : "gray"} title={`${t("settingsToggleDevMode")} ${state.settings.devMode ? "on" : "off"}`} onPress={() => setState(st => reduce(st, {name: ActionName.setDevMode, payload: !state.settings.devMode}) || st)} />
        <Text style={globalStyle.text}>{}</Text>
      </View>
      
      {!!state.settings.devMode && <View>
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
      <Text style={globalStyle.text}>{t("version")}: {VERSION}/{state.version}</Text> 
      <Text style={globalStyle.text}>{JSON.stringify(state)}</Text> */}
    </ScrollView>
  </View>
}

const settingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  },
  topUserDataView:{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 20,
    marginBottom: 25,
  },
  userImageView: {
    borderRadius: 50,
    width: 75,
    aspectRatio: 1
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
  },
})