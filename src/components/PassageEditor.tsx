import { FC, useEffect, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PASSAGE_LEVEL, archivedName } from "../constants"
import { AddressType, AppStateModel, PassageModel } from "../models"
import { Button, IconButton } from "./Button"
import { IconName } from "./Icon"
import { WORD } from "../l10n"
import addressToString from "../tools/addressToString"
import { TextInput } from "react-native-gesture-handler"
import timeToString from "../tools/timeToString"
import { getVersesNumber } from "../initials"
import { AddressPicker } from "./AddressPicker"
import { LevelPicker } from "./LevelPicker"
import { ThemeAndColorsModel, getTheme } from "../tools/getTheme"

interface PassageEditorModel{
  visible: boolean
  passage: PassageModel
  onCancel: () => void
  onConfirm: (passage: PassageModel) => void
  onRemove: (arg: number) => void
  t: (w: WORD) => string
  state: AppStateModel
}

export const PassageEditor: FC<PassageEditorModel> = ({visible, passage, onCancel, onConfirm, onRemove, t, state}) => {
  const [isAPVisible, setAPVisible] = useState(false)
  const [tempPassage, setPassage] = useState(passage);

  useEffect(()=>{
    setPassage(passage);
  },[visible])
  
  const handleBack = () => {
    //TODO: confirm if changed
    onCancel();
  }
  const handleConfirm = () => {
    onConfirm(tempPassage);
  }
  const handleTextChange = (newVal: string) => {
    setPassage(prv => {
      return {...prv, verseText: newVal.trim()}
    })
  }
  const handleRemove = (id: number) => {
    onRemove(id)
  }

  const handleTagAdd = (tag: string) => {
    setPassage(prv => {
      if(tag === t("Archive") || !tag || (tag !== archivedName && prv.tags.includes(tag))){
        return prv;
      }
      const newTags = tag === archivedName && prv.tags.includes(archivedName) ? prv.tags.filter(t => t !== archivedName) : [...prv.tags, tag]
      return {...prv, tags: newTags}
    })
  }
  const handleTagRemove = (tag: string) => {
    setPassage(prv => {
      return {...prv, tags: prv.tags.filter(t => t !== tag)}
    })
  }
  const handleReminderToggle = () => {
    setPassage(prv => {
      return {...prv, isReminderOn: !prv.isReminderOn}
    })
  }
  const handleAddresChange = (newAdress: AddressType) => {
    setPassage(prv => {
      return {...prv, address: newAdress}
    })
    setAPVisible(false);
  }
  const handleLevelPickerOpen = () => {
    setPassage(prv => {
      return {...prv, isNewLevelAwalible: false}
    })
  }
  const handleLevelChange = (level: PASSAGE_LEVEL) => {
    setPassage(prv => {
      return {...prv, selectedLevel: level}
    })
  }
  const theme = getTheme(state.settings.theme);
  const PEstyle = StyleSheet.create({
    //top
    headerView:{
      height: 60,
      alignContent: "center",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 18,
      textTransform: "uppercase",
      fontWeight: "500",
      paddingHorizontal: 10
    },
    headerBotton: {
      height: "100%",
      aspectRatio: 1,
    },
    listView: {
      backgroundColor: theme.colors.bg,
      height: "93%",
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "stretch",
      justifyContent: "space-evenly"
    },
    bodyTop: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      height: 60,
      justifyContent: "space-between",
      alignItem: "center"
    },
    //address
    bodyTopAddress: {
      color: theme.colors.text,
      textTransform: "uppercase",
      fontSize: 20,
      fontWeight: "500",
      alignItems: "flex-start",
      marginLeft: 5
    },
    //text
    bodyText: {
      marginHorizontal: 20,
      marginVertical: 0
    },
    bodyTextInput: {
      backgroundColor: theme.colors.bgSecond,
      paddingHorizontal: 10,
      paddingVertical: 10,
      color: theme.colors.text,
      fontSize: 16,
      borderRadius: 10,
      textAlignVertical:"top"
    },
    //meta
    tagItemListBlock: {
      padding: 5,
      marginHorizontal: 15
    },
    tagItemList: {
      flexDirection: "row",
      flexWrap: "wrap"
    },
    tagListInput: {
      color: theme.colors.text,
      
    },
    bodyMeta: {
      padding: 20,
      paddingVertical: 10,
      width: "100%",
    },
    bodyMetaText: {
      color: theme.colors.textSecond
    },
    bodyButtons: {
      width: "100%",
      flexDirection: "row"
    }
  });
  return <Modal visible={visible}>
    <View style={{ ...theme.theme.view,...PEstyle.headerView}}>
      <IconButton theme={theme} style={PEstyle.headerBotton} icon={IconName.back} onPress={handleBack} />
      <Text style={PEstyle.headerTitle}>{ t("EditPassageTitle") }</Text>
      <IconButton theme={theme} style={PEstyle.headerBotton} icon={IconName.done} onPress={handleConfirm} />
    </View>

    <View style={PEstyle.listView}>
      <ScrollView>
        <View style={PEstyle.bodyTop}>
          <Pressable onPress={() => setAPVisible(true)}>
            <Text style={PEstyle.bodyTopAddress}>{addressToString(tempPassage.address, t)}{`(${getVersesNumber(tempPassage.address)})`}</Text>
          </Pressable>
          {/* <IconButton onPress={handleReminderToggle} icon={tempPassage.isReminderOn ? IconName.bellGradient : IconName.bellOutline}/> */}
        </View>
        <View style={PEstyle.bodyText}>
          <TextInput
            style={PEstyle.bodyTextInput}
            multiline
            numberOfLines={8}
            onChangeText={handleTextChange}
          >{tempPassage.verseText}</TextInput>
        </View>
        <View style={PEstyle.tagItemListBlock}>
          
          <View style={PEstyle.tagItemList}>
            {tempPassage.tags.map(p => <TagItem key={p}  theme={theme} title={p === archivedName ? t("Archived") : p.slice(0,20)} onRemove={() => handleTagRemove(p)}/>)}
          </View>
          <TextInput placeholderTextColor={theme.colors.textSecond} style={PEstyle.tagListInput} placeholder={t("AddTag")} maxLength={15} onSubmitEditing={newVal => handleTagAdd(newVal.nativeEvent.text.trim())}></TextInput>
        </View>
        <View style={PEstyle.bodyMeta}>
          <Text style={PEstyle.bodyMetaText}>{t("DateCreated")}: {timeToString(tempPassage.dateCreated)}</Text>
          <Text style={PEstyle.bodyMetaText}>{t("DateEdited")}: {timeToString(tempPassage.dateEdited)}</Text>
          <Text style={PEstyle.bodyMetaText}>{tempPassage.dateTested ? t("DateTested") + ": "+ timeToString(tempPassage.dateTested) : ""}</Text>
        </View>
        <LevelPicker 
          t={t}
          targetPassage={tempPassage}
          handleChange={handleLevelChange}
          handleOpen={handleLevelPickerOpen}
          state={state}
        />
        <View style={PEstyle.bodyButtons}>
          <Button theme={theme} title={tempPassage.tags.includes(archivedName) ? t("Unrchive") : t("Archive")} onPress={() => handleTagAdd(archivedName)}/>
          <Button theme={theme} title={t("Remove")} onPress={() => handleRemove(tempPassage.id)} color="red"/>
        </View>
      </ScrollView>
    </View>
    <AddressPicker theme={theme} visible={isAPVisible} address={tempPassage.address} onCancel={() => setAPVisible(false)} onConfirm={handleAddresChange} t={t}/>
  </Modal>
}

const TagItem: FC<{title: string, onRemove: () => void, theme: ThemeAndColorsModel}> = ({title, onRemove, theme}) => {
  const tagItemStyles = StyleSheet.create({
    tagItemView: {
      borderRadius: 50,
      paddingLeft: 15,
      margin: 3,
      flexDirection: "row",
      height: 40,
      alignItems: "center",
      borderColor: theme.colors.mainColor,
      borderWidth: 2,
    },
    tagItemText: {
      color: theme.colors.text,
      fontSize: 16
    }
  })
  return <View style={tagItemStyles.tagItemView}>
    <Text  style={tagItemStyles.tagItemText}>{title}</Text>
    <IconButton theme={theme} icon={IconName.cross} onPress={onRemove}/>
  </View>
}