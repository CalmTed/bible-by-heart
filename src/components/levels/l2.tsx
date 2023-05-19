import { FC, useEffect, useState } from "react";
import { AddressType, AppStateModel, PassageModel, TestModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native"
import { COLOR, globalStyle } from "../../constants";
import addressToString from "../../tools/addressToString"
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    alignContent: "center",
    flex: 1
  },
  passageText: {
    fontSize: 18,
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: COLOR.bgSecond,
    borderRadius: 10,
    padding: 10
  },
  addressTextView: {
    alignContent: "center",
    justifyContent: "center",
    maxHeight: 100,
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center"
  },
  optionButtonsWrapper: {
    flex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20
  },
  hintText: {
    color: COLOR.text
  }
})

export const L20: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const [APVisible, setAPVisible] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null as null | AddressType);
  const [hintShown, setHistShown] = useState(false)

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setHistShown(false)
  }

  const handleTestSubmit = (value: AddressType) => {
    const rightPassage = state.passages.find(p => p.id === test.passageId)
    if(!rightPassage){
      return;
    }
    if(JSON.stringify(rightPassage.address) === JSON.stringify(value)){
      //set right: error: 0
      submitTest({isRight: true, modifiedTest: {
        ...test,
        dateFinished: new Date().getTime()
      }})
    }else{
      //add error
      submitTest({isRight: false, modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongAddressToVerse",
        wrongAddress: [...test.wrongAddress, value]
      }}) 
    }
    resetForm()
  }
  const handleAddressSelect = (value: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(value);
  }
  const handleAddressCancel = () => {
    setAPVisible(false);
  }
  const targetPassage = state.passages.find(p => p.id === test.passageId);
  const levelFinished = !!test.dateFinished;
  return <View style={{...levelComponentStyle.levelComponentView}}>
    <ScrollView style={{...levelComponentStyle.passageTextView}}>
      <Text style={{...globalStyle.text, ...levelComponentStyle.passageText}}>{targetPassage?.verseText}</Text>
    </ScrollView>
    <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      <Button
        title={!!selectedAddress ? addressToString(selectedAddress, t) : t("LevelSelectAddress")}
        type="outline"
        color="green"
        onPress={() => setAPVisible(true)}
        disabled={levelFinished}
      />
      <Button
        title={t("Submit")}
        type="main"
        color={!!selectedAddress ? "green" : "gray"}
        disabled={!selectedAddress || levelFinished}
        onPress={() => selectedAddress ? handleTestSubmit(selectedAddress) : null}
      />
      {(test.errorNumber || 0) > 3 && !hintShown &&
      <Button
        title={t("ShowAnswer")}
        type="secondary"
        color="gray"
        onPress={() => setHistShown(true)}
      />}
      {!!hintShown && !!targetPassage &&
      <Text style={{...levelComponentStyle.hintText}}>
        {addressToString(targetPassage.address, t)}
      </Text>}
    </View>
    <AddressPicker visible={APVisible} onCancel={handleAddressCancel} onConfirm={handleAddressSelect} t={t}/>
  </View>
}

//start writing text with passage autocomplete
export const L21: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const [passagesOptions, setPassageOptions] = useState([] as PassageModel[])
  const handleTestSubmit = (value: number) => {
    const passage = state.passages.find(p => p.id === test.passageId)
    if(!passage){
      return;
    }
    
    if(passage.id === value){
      //set right: error: 0
      submitTest({isRight: true, modifiedTest: {
        ...test,
        dateFinished: new Date().getTime()
      }})
    }else{
      //add error
      submitTest({isRight: false, modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongVerseToAddress",
        wrongPassagesId: [...test.wrongPassagesId, value]
      }})
    }
  }
  const handleSearchPassages = (value: string) => {
    const options = value.length < 2 ? [] : state.passages.filter(p => p.verseText.toLowerCase().startsWith(value.toLowerCase())).slice(0,3)
    setPassageOptions(options)
  }
  const targetPassage = state.passages.find(p => p.id === test.passageId)
  if(!targetPassage){
    return <View></View>;
  }
  const levelFinished = !!test.dateFinished;
  return <View style={{...levelComponentStyle.levelComponentView}}>
    <View style={{...levelComponentStyle.addressTextView}}>
      <Text
        style={{...globalStyle.text, ...levelComponentStyle.addressText}}
      >
        {addressToString(targetPassage.address,t)}
      </Text>
    </View>
    <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      <View style={{gap: 10}}>
        {
          passagesOptions.map(p => {
            const passageText = p.verseText.length < 50 ? p.verseText : p.verseText.trim().replace(/(.|,)$/g,"").slice(0,50) + "..."
            return <Button
              key={p.id}
              type="outline"
              color="green"
              textStyle={{textTransform: "none"}}
              title={passageText}
              onPress={() => handleTestSubmit(p.id)}
              disabled={levelFinished}
            />
          })
        }
      </View>
      <Input
        placeholder={t("LevelStartWritingPassage")}
        onChange={(value) => handleSearchPassages(value)}
        onSubmit={() => {}}
      />
    </View>
  </View>
}