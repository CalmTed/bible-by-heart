import { FC, useEffect, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from "react-native"
import { COLOR, globalStyle } from "../constants"
import { AddressType, PassageModel } from "../models"
import { Button, IconButton } from "./Button"
import { IconName } from "./Icon"
import { WORD } from "../l10n"
import addressToString from "../tools/addressToString"
import { TextInput } from "react-native-gesture-handler"
import timeToString from "../tools/timeToString"
import { getVersesNumber } from "../initials"

interface PassageEditorModel{
  visible: boolean
  passage: PassageModel
  onCancel: () => void
  onConfirm: (passage: PassageModel) => void
  onRemove: (arg: number) => void
  t: (w: WORD) => string
}

export const PassageEditor: FC<PassageEditorModel> = ({visible, passage, onCancel, onConfirm, onRemove, t}) => {
  useEffect(()=>{
    setPassage(passage);
  },[visible])
  const [tempPassage, setPassage] = useState(passage);
  const handleBack = () => {
    //TODO: confirm if changed
    onCancel();
  }
  const handleConfirm = () => {
    onConfirm(tempPassage);
  }
  const handleTextChange = (newVal: string) => {
    setPassage(prv => {
      return {...prv, verseText: newVal}
    })
  }
  const handleRemove = (id: number) => {
    onRemove(id)
  }

  const handleTagAdd = (tag: string) => {
    setPassage(prv => {
      if(!tag || prv.tags.includes(tag)){
        return prv;
      }
      return {...prv, tags: [...prv.tags, tag]}
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
  return <Modal visible={visible}>
    <View style={PEstyle.headerView}>
      <IconButton  style={PEstyle.headerBotton} icon={IconName.back} onPress={handleBack} />
      <Text style={PEstyle.headerTitle}>{ t("EditPassageTitle") }</Text>
      <IconButton  style={PEstyle.headerBotton} icon={IconName.done} onPress={handleConfirm} />
    </View>

    <View style={PEstyle.listView}>
      <ScrollView>
        <View style={PEstyle.bodyTop}>
          {/* TODO:change address on click */}
          <Pressable onPress={()=>{ToastAndroid.show("TODO",1)}}>
            <Text style={PEstyle.bodyTopAddress}>{addressToString(tempPassage.address, t)}{!!tempPassage.versesNumber ? `(${tempPassage.versesNumber})` : `(${getVersesNumber(tempPassage.address)})`}</Text>
          </Pressable>
          <IconButton onPress={handleReminderToggle} icon={tempPassage.isReminderOn ? IconName.bellGradient : IconName.bellOutline}/>
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
            {tempPassage.tags.map(p => <TagItem key={p} title={p} onRemove={() => handleTagRemove(p)}/>)}
          </View>
          <TextInput placeholderTextColor={COLOR.textSecond} style={PEstyle.tagListInput} placeholder={t("AddTag")} maxLength={15} onSubmitEditing={newVal => handleTagAdd(newVal.nativeEvent.text.trim())}></TextInput>
        </View>
        <View style={PEstyle.bodyMeta}>
          <Text style={PEstyle.bodyMetaText}>{t("DateCreated")}: {timeToString(tempPassage.dateCreated)}</Text>
          <Text style={PEstyle.bodyMetaText}>{t("DateEdited")}: {timeToString(tempPassage.dateEdited)}</Text>
          <Text style={PEstyle.bodyMetaText}>{tempPassage.dateTested ? t("DateTested") + ": "+ timeToString(tempPassage.dateTested) : ""}</Text>
        </View>
        <View style={PEstyle.bodyButtons}>
          <Button title={t("Archive")} onPress={() => handleTagAdd(t("Archived"))} disabled={tempPassage.tags.includes(t("Archived"))}/>
          <Button title={t("Remove")} onPress={() => handleRemove(tempPassage.id)} color="red"/>
        </View>
      </ScrollView>
    </View>
  </Modal>
}

const TagItem: FC<{title: string, onRemove: () => void}> = ({title, onRemove}) => {
  return <View style={PEstyle.tagItemView}>
    <Text  style={PEstyle.tagItemText}>{title}</Text>
    <IconButton icon={IconName.cross} onPress={onRemove}/>
  </View>
}

const PEstyle = StyleSheet.create({
  //top
  headerView:{
    ...globalStyle.view,
    height: 60,
    alignContent: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerTitle: {
    flex: 1,
    color: COLOR.text,
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
    backgroundColor: COLOR.bg,
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
    color: COLOR.text,
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
    backgroundColor: COLOR.bgSecond,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: COLOR.text,
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
  tagItemView: {
    borderRadius: 50,
    paddingLeft: 15,
    margin: 3,
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    borderColor: COLOR.mainColor,
    borderWidth: 2,
  },
  tagItemText: {
    color: COLOR.text,
    fontSize: 16
  },
  tagListInput: {
    color: COLOR.text,
    
  },
  bodyMeta: {
    padding: 20,
    paddingVertical: 10,
    width: "100%",
  },
  bodyMetaText: {
    color: COLOR.textSecond
  },
  bodyButtons: {
    width: "100%",
    flexDirection: "row"
  }
});