import { FC, useEffect, useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { COLOR, globalStyle } from "../constants"
import { AddressType } from "../models"
import { Header } from "../components/Header"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { IconButton } from "./Button"
import { IconName } from "./Icon"
import { WORD } from "../l10n"
import { bibleReference } from "../bibleReference"
import { ScrollView } from "react-native"

interface AddressPickerModel{
  visible: boolean
  address: AddressType
  onCancel: () => void
  onConfirm: (address: AddressType) => void
  t: (w: WORD) => string
}

const bookList = bibleReference.map(book => book.titleShort);

export const AddressPicker: FC<AddressPickerModel> = ({visible, address, onCancel, onConfirm, t}) => {
  useEffect(()=>{
    setAddressPart(Object.keys(address)[0]);
    setAddress(address);
  },[visible])
  const [tempAddres, setAddress] = useState(address);
  const [addresPart, setAddressPart] = useState(Object.keys(address)[0]);
  const chaptersNumber = bibleReference[tempAddres.bookIndex]?.chapters.length
  const versesNumber = bibleReference[tempAddres.bookIndex]?.chapters[tempAddres[addresPart === "startVerseNum" ? "startChapterNum" : "endChapterNum"]]
  const handleBack = () => {
    const curPartIndex = Object.keys(tempAddres).indexOf(addresPart);
    switch(curPartIndex){
      case -1: 
      case 0: 
        onCancel();
        setAddressPart(Object.keys(tempAddres)[0]);
      break;
      default: setAddressPart(Object.keys(tempAddres)[curPartIndex - 1]);
    }
  }
  const handleListButtonPress: (index: number) => void = (index) => {
    setAddress(prv => {
      return {...prv, [addresPart]: index}
    })
    const curPartIndex = Object.keys(tempAddres).indexOf(addresPart);
    switch(curPartIndex){
      case -1: 
        setAddressPart(Object.keys(tempAddres)[0]);
      break;
      case Object.keys(tempAddres).length - 1: 
        setAddressPart(Object.keys(tempAddres)[0]);
        onConfirm(tempAddres);
      break;
      default: setAddressPart(Object.keys(tempAddres)[curPartIndex + 1]);
    }
  }
  return <Modal visible={visible}>
    {/* HEADER */}
    <View style={APstyle.headerView}>
      <IconButton  style={APstyle.headerBotton} icon={IconName.back} onPress={handleBack} />
      <Text style={APstyle.headerTitle}>{ addresPart === "bookIndex" ? t("APSelectBook") : `${t(bibleReference[tempAddres.bookIndex]?.longTitle as WORD)} ${((tempAddres.startChapterNum) + 1) || " _ "}:${((tempAddres.startVerseNum) + 1) || " _ "}-${((tempAddres.endChapterNum) + 1) || " _ "}:${((tempAddres.endVerseNum) + 1) || " _ "}`}</Text>
      <IconButton  style={APstyle.headerBotton} icon={IconName.done} onPress={() => {onConfirm(tempAddres)}} disabled={isNaN(tempAddres.bookIndex) || isNaN(tempAddres.startChapterNum) || isNaN(tempAddres.startVerseNum)} />
    </View>
    {/* LIST */}
      <View style={APstyle.listView}>
      {addresPart === "bookIndex" && bookList.map((bookItem, i) => {
        const title = bookItem as WORD;
        return <ListButton key={title} title={t(title)} onPress={() => handleListButtonPress(i)}/>
      })}
      {["startChapterNum"].includes(addresPart) && Array.from({length: chaptersNumber}, (v, i) => i).map((chapter, i) => {
        const title = (chapter + 1).toString();
        return <ListButton key={title} title={title} onPress={() => handleListButtonPress(i)}/>
      })}
      {["endChapterNum"].includes(addresPart) && Array.from({length: chaptersNumber}, (v, i) => i).map((chapter, i) => {
        const title = (chapter + 1).toString();
        if(i < tempAddres.startChapterNum){
          return;
        }
        return <ListButton key={title} title={title} onPress={() => handleListButtonPress(i)}/>
      })}
      {["startVerseNum"].includes(addresPart) && Array.from({length: versesNumber}, (v, i) => i).map((verse, i) => {
        const title = (verse + 1).toString();
        return <ListButton key={title} title={title} onPress={() => handleListButtonPress(i)}/>
      })}
      {[ "endVerseNum"].includes(addresPart) && Array.from({length: versesNumber}, (v, i) => i).map((verse, i) => {
        const title = (verse + 1).toString();
        if(tempAddres.startChapterNum === tempAddres.endChapterNum && i < tempAddres.startVerseNum){
          return;
        }
        return <ListButton key={title} title={title} onPress={() => handleListButtonPress(i)}/>
      })}
      </View>
  </Modal>
}

const ListButton: FC<{title: string, onPress: () => void}> = ({title, onPress}) => {
  return <TouchableOpacity onPress={onPress}>
      <View style={APstyle.listButton}>
        <Text style={APstyle.listButtonLabel}>{title}</Text>
      </View>
  </TouchableOpacity> 
}

const APstyle = StyleSheet.create({
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
    backgroundColor: COLOR.bgSecond,
    height: "93%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "stretch"
  },
  listButton: {
    width: 66,
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1
  },
  listButtonLabel: {
    color: COLOR.text,
    textTransform: "capitalize",
    fontSize: 15
  }
});