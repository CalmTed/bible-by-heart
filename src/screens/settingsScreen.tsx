import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ToastAndroid, TextInput } from "react-native"
import { storageName, SCREEN, LANGCODE, VERSION, THEME_TYPE, archivedName, SETTINGS, STATS_METRICS } from "../constants"
import { ActionName, AppStateModel, TranslationModel } from "../models"
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
import { StatusBar } from "expo-status-bar"
import { MiniModal } from "../components/miniModal"
import { Input } from "../components/Input"
import { createAppState, createTranslation } from "../initials"
import { SettingsListWrapper } from "../components/settingsListWrapper"
import { Select } from "../components/Select"

export const SettingsScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);

  const [isDevPasswordModalOpen, setIsDevPasswordModalOpen] = useState(false);
  const [isAboutModalShown,setIsAboutModalShown] = useState(false)
  const [isLegalModalShown,setIsLegalModalShown] = useState(false)
  const [isStateViewerModalOpen,setIsStateViewerModalOpen] = useState(false)
  const [isTranslationsListShown, setTranslationsListShown] = useState(false)
  const getPassword = () => {
    return Math.round(Math.random() * 10000)
  }
  const [devModeKey, setDevModeKey] = useState(getPassword())
  const devModeAnswer = (devModeKey * 2) % 9;

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

  const handleCheckDevPassword = (value: string) => {
    if(value === devModeAnswer.toString()){
      setState(st => 
        reduce(st, {
          name: ActionName.setDevMode,
          payload: true
        }) || st
      )
    }else{
      setDevModeKey(getPassword())
      ToastAndroid.show("nope...", 1000)
    }
    setIsDevPasswordModalOpen(false)
  }
  // const handleExportData: (state: AppStateModel) => void  = (state) => {
  //   if(!exportedText.length){
  //     const exortingObject:exportingModel = {
  //       version: VERSION,
  //       passages: state.passages
  //     }
  //     setExportedText(JSON.stringify(exortingObject, null,undefined))
  //   }else{
  //     setExportedText("")
  //   }
  // }
  // const handleImportData: (stateString: string) => void = (stateString) => {
  //   try{
  //     //validate json
  //     const importedData:exportingModel = JSON.parse(stateString)
  //     //validate version
  //     if(alowedStateVersions.includes(importedData.version)){
  //       //setState
  //       setState(prv => 
  //         reduce(prv, {
  //           name: ActionName.setPassagesList,
  //           payload: importedData.passages
  //         }) || prv
  //       )
  //       ToastAndroid.show("Imported!", 100)
  //     }else{
  //       ToastAndroid.show(`Wrong version: ${importedData.version}, allowed: ${alowedStateVersions.join(", ")}`, 100)
  //     }
  //   }catch(e){
  //     ToastAndroid.show("Unable to parce data", 100)
  //   }
  // }
  const theme = getTheme(state.settings.theme);
  const allTags = [
    archivedName,
    ...state.passages.map( p => p.tags).flat()
  ].filter((v,i,arr) => 
    !arr.slice(0,i).includes(v)
  )//get unique tags
  const languageOptions = Object.entries(LANGCODE).map(([k,v]) => {
    const customT = createT(v)
    return {
      value: k,
      label: `${customT("name")} ${customT("flag")}`
    }
  })
  return <View style={{...theme.theme.screen,...theme.theme.view}}>
    <Header theme={theme} navigation={navigation} showBackButton={false} alignChildren="flex-start" additionalChildren={[
      <IconButton theme={theme} icon={IconName.back} onPress={() => navigateWithState({screen: SCREEN.home, state, navigation})}/>,
      <Text style={theme.theme.headerText}>{t("settingsScreenTitle")}</Text>]}
    />
    <ScrollView style={settingsStyle.scrollView}>
      {/* <View style={settingsStyle.topUserDataView}>
        <View style={{...settingsStyle.userImageView, backgroundColor: theme.colors.textSecond}}>

        </View>
        
        <Button theme={theme} onPress={() => {}} title="Login" type="transparent"/>
        
      </View> */}
      <View style={settingsStyle.menuItemsListView}>

        {/* MAIN */}
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
          options={languageOptions}
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
        {/* LISTS */}
        <SettingsMenuItem
          theme={theme}
          header={t("settsLabelList")}
          type="label"
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsLeftSwipeTag")}
          subtext={`"${state.settings.leftSwipeTag === archivedName ? t(archivedName) : state.settings.leftSwipeTag}"`}
          type="select"
          options={allTags.map((v) => {
            return {
              value: v,
              label: v === archivedName ? t(v) : v
            }
          })}
          selectedIndex={allTags.indexOf(state.settings.leftSwipeTag)}
          onSelect={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setLeftSwipeTag,
                payload: value
              }) || st
            )
          }}
        />
        <SettingsMenuItem
          theme={theme}
          type="action"
          header={t("settsTranslationsListHeader")}
          subtext={t("settsTranslationsListSubtext")}
          actionCallBack={() => setTranslationsListShown(true)}
        />
        <SettingsListWrapper
          theme={theme}
          shown={isTranslationsListShown}
          handleClose={ () => setTranslationsListShown(false) }
          header={t("settsTranslationsListHeader")}
          handleAddNew={ () =>
            setState(st => 
              reduce(st, {
                name: ActionName.setTranslationsList,
                payload: [...state.settings.translations, createTranslation(state.settings.langCode)]
              }) || st
            ) }
          handleRemove={changedItem =>
            setState(st => 
              reduce(st, {
                name: ActionName.setTranslationsList,
                payload: state.settings.translations.filter(t => t.id !== changedItem.id)
              }) || st
          )}
          handleItemChange={ changedItem =>
            setState(st => 
              reduce(st, {
                name: ActionName.setTranslationsList,
                payload: state.settings.translations.map(t => t.id === changedItem.id ? changedItem as TranslationModel : t)
              }) || st
            ) }
          items={state.settings.translations}
          renderListItem={(item) => 
            <Text style={theme.theme.headerText}>
              {`${(item as TranslationModel).name} ${(item as TranslationModel).isDefault ? "*" : ""}`}
            </Text>
          }
          renderEditItem={(item, handleChange, handleRemove ) => {
            const translationItem = item as TranslationModel;
            return <View style={{gap: 20}}>
              {/* name */}
              <Text style={theme.theme.text}>{t("settsTranslationItemName")}:</Text>
              <Input
                value={translationItem.name}
                onChange={value => handleChange({...item, name: value})}
                onSubmit={value => handleChange({...item, name: value})}
                placeholder={t("settsTranslationItemName")}
                theme={theme}
                disabled={!translationItem.editable}
                maxLength={20}
              />
              {/* language */}
              <Text style={theme.theme.text}>{t("settsTranslationItemLanguage")}:</Text>
              <Select
                options={languageOptions}
                selectedIndex={languageOptions.map(o => o.value).indexOf(translationItem.addressLanguage)}
                onSelect={ value => handleChange({...item, addressLanguage: value as LANGCODE})}
                theme={theme}
                disabled={!translationItem.editable}
                />
              {/* remove */}
              <Button theme={theme} 
                onPress={() => setState(st => 
                  reduce(st, {
                    name: ActionName.setTranslationsList,
                    payload: state.settings.translations.map(t => t.id === translationItem.id ? {...translationItem, isDefault: true} : {...t, isDefault: false})
                  }) || st
                )}
                type={!translationItem.isDefault ? "outline": "transparent"}
                disabled={translationItem.isDefault}
                title={t("TranslationSetDefault")}
              />
              <Button theme={theme} onPress={() => handleRemove(translationItem)} type={translationItem.editable ? "outline": "transparent"} color="red" title={t("Remove")} disabled={!translationItem.editable}/>
            </View>
          }
          }
        />
        {/* TESTS */}
        <SettingsMenuItem
          theme={theme}
          header={t("settsLabelTests")}
          type="label"
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsHaptics")}
          subtext={t(state.settings.hapticsEnabled ? "settsEnabled" : "settsDisabled")}
          type="checkbox"
          checkBoxState={state.settings.hapticsEnabled}
          onClick={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setSettingsParam,
                payload: {
                  param: SETTINGS.hapticsEnabled,
                  value: value
                }
              }) || st
            )
          }}
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsAutoIncreseLevel")}
          subtext={t(state.settings.autoIncreeseLevel ? "settsEnabled" : "settsDisabled")}
          type="checkbox"
          checkBoxState={state.settings.autoIncreeseLevel}
          onClick={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setSettingsParam,
                payload: {
                  param: SETTINGS.autoIncreeseLevel,
                  value: value
                }
              }) || st
            )
          }}
        />
        {/* STATS */}
        <SettingsMenuItem
          theme={theme}
          header={t("settsLabelStats")}
          type="label"
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsWeeklyMetrics")}
          subtext={`${t(state.settings.homeScreenWeeklyMetric)}`}
          type="select"
          options={Object.values(STATS_METRICS).map((v) => {
            return {
              value: v,
              label: t(v)
            }
          })}
          selectedIndex={Object.values(STATS_METRICS).indexOf(state.settings.homeScreenWeeklyMetric)}
          onSelect={(value) => {
            setState(st => 
              reduce(st, {
                name: ActionName.setSettingsParam,
                payload: {
                  param: SETTINGS.homeScreenWeeklyMetric,
                  value
                }
              }) || st
            )
          }}
        />
        {/* ABOUT */}
        <SettingsMenuItem
          theme={theme}
          header={t("settsLabelAbout")}
          type="label"
        />
        <SettingsMenuItem
          theme={theme}
          type="action"
          header={t("settsAboutHeader")}
          subtext={`${t("settsAboutSubtext")}: ${VERSION}`}
          actionCallBack={() => {
            setIsAboutModalShown(true)
          }}
        />
        <MiniModal
          theme={theme}
          shown={isAboutModalShown}
          handleClose={() => setIsAboutModalShown(false)}
        >
          
          <Text style={theme.theme.headerText}>{t("AboutHeader")}</Text>
          <Text style={theme.theme.text}>{t("AboutText")}</Text>
          <Text style={theme.theme.text}>{t("version")}: {VERSION}</Text>
          <Button theme={theme} title={t("Close")} onPress={() => setIsAboutModalShown(false)}/>
        </MiniModal>
        <SettingsMenuItem
          theme={theme}
          type="action"
          header={t("settsLegalHeader")}
          subtext={t("settsLegalSubtext")}
          actionCallBack={() => {
            setIsLegalModalShown(true)
          }}
        />
        <MiniModal
          theme={theme}
          shown={isLegalModalShown}
          handleClose={() => setIsLegalModalShown(false)}
        >
          <Text style={theme.theme.headerText}>{t("LegalHeader")}</Text>
          <Text style={theme.theme.text}>{t("LegalText")}</Text>
          <Text style={theme.theme.text}>{t("LegalText2")}</Text>
          <Button theme={theme} title={t("Close")} onPress={() => setIsLegalModalShown(false)}/>
        </MiniModal>
        <SettingsMenuItem
          theme={theme}
          header={t("settsDevMode")}
          subtext={t(state.settings.devMode ? "settsEnabled" : "settsDisabled")}
          type="checkbox"
          checkBoxState={state.settings.devMode}
          onClick={(value) => {
            !value ?
              setState(st => 
                reduce(st, {
                  name: ActionName.setDevMode,
                  payload: value
                }) || st
              ) :
            setIsDevPasswordModalOpen(true)
          }}
        />
        <MiniModal
          theme={theme}
          shown={isDevPasswordModalOpen}
          handleClose={() => setIsDevPasswordModalOpen(false)}
        >
          <Text style={{color: theme.colors.text, fontSize: 16}}>{t("settsDevPasswordHeader")}: {devModeKey}</Text>
          <Input theme={theme} placeholder={t("settsDevPasswordPlaceholder")} onChange={() => {}} onSubmit={handleCheckDevPassword} inputMode="numeric"></Input>
        </MiniModal>
        {/* DEV MODE SETTINGS */}
        {state.settings.devMode && <View style={{flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap"}}>
          <Text style={{color: theme.colors.text, fontSize: 16}}>{t("settsGetDevAnswer")}:</Text>
          <Input inputMode="numeric" theme={theme} onSubmit={(text) => {ToastAndroid.show(`${parseInt(text) * 2 % 9}`, 1000)}} placeholder="1234" onChange={() => {}}></Input>  
        </View>}
        {state.settings.devMode && <View>
          <SettingsMenuItem
          theme={theme}
          header={t("settsShowStateHeader")}
          subtext={t("settsShowStateSubtext")}
          type="action"
          actionCallBack={() => {
            setIsStateViewerModalOpen(true)
          }}
        />
        <MiniModal
          theme={theme}
          shown={isStateViewerModalOpen}
          handleClose={() => setIsStateViewerModalOpen(false)}
          style={{width: "100%"}}
        >
          <ScrollView style={{width: "100%"}}>
            <TextInput style={{...theme.theme.text,width: "100%"}} multiline={true} >{JSON.stringify(state, null , "_ ")}</TextInput>
          </ScrollView>
        </MiniModal>
        </View>
        }
        {state.settings.devMode && <View>
          <SettingsMenuItem theme={theme} type="action" subtext={t("settsOneWayDoor")} header={t("settsClearHistory")} actionCallBack={() => setState(prv => {return {...prv, testsHistory: []}})}/>
          <SettingsMenuItem theme={theme} type="action" subtext={t("settsOneWayDoor")} header={t("settsClearPassages")} actionCallBack={() => setState(prv => {return {...prv, passages: []}})}/>
          <SettingsMenuItem theme={theme} type="action" subtext={t("settsOneWayDoor")} header={t("settsClearData")} actionCallBack={() => setState(() => {return createAppState()})}/>
        </View>
        }
      </View>
        {/* <View style={settingsStyle.groupView}>
          <Button type="outline" color="gray" title={t("settingsExport")} onPress={() => handleExportData(state)} />
          <Input style={settingsStyle.textarea} placeholder="" value={exportedText} multiline numberOfLines={1} disabled={false} onChange={()=>{setExportedText(exportedText)}} onSubmit={() => {}}/>
        </View>
        <View style={settingsStyle.groupView}>
          <Button type="outline" color="gray" title={t("settingsImport")} onPress={() => handleImportData(importedText)} disabled={!importedText.length} />
          <Input style={settingsStyle.textarea} value={importedText} multiline numberOfLines={1} onChange={(newVal) => setImportedText(newVal)} onSubmit={(newVal) => handleImportData(newVal)} placeholder="" />
        </View> */}
    </ScrollView>
    <StatusBar style={state.settings.theme === THEME_TYPE.light ? "dark" : "light"} />
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
  menuItemsListView: {
    width: "100%",
  }
})