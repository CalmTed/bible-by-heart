import { FC, useEffect, useState } from "react";
import { AddressType } from "../../models";
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { COLOR } from "../../constants";
import addressToString from "../../tools/addressToString"
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getSimularity } from "../../tools/getSimularity";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    maxHeight: "30%",
    height: "auto",
    borderRadius: 10,
    
    margin: 10,
  },
  passageText: {
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    color: COLOR.text,
    fontSize: 18,
    fontWeight: "500"
  },
  addressTextView: {
    alignContent: "flex-start",
    justifyContent: "center",
    marginVertical: 10
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center",
    color: COLOR.text
  },
  fixedWord: {
    paddingHorizontal: 2,
    padding: 4,
  },
  variableWord: {
    marginHorizontal: 2,
    margin: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.text,
  },
  nextUnselected:{
    borderBottomColor: COLOR.mainColor,
  },
  wordText:{
    color: COLOR.text,
    fontSize: 18
  },
  hiddenWordText: {
    color: "transparent"
  },
  optionButtonsScrollWrapper:{
    flex: 1,
    width: "100%",
  },
  optionButtonsWrapper: {
    flex: 1,
    paddingHorizontal: 20, 
    width: "100%",
    gap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10
  },
  inputSubtext: {
    color: COLOR.textSecond,
    textAlign: "center",
    fontSize: 12,
  }
})

export const L40: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const [APVisible, setAPVisible] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null as null | AddressType);
  const targetPassage = state.passages.find(p => p.id === test.passageId)
  //showAddressOrFirstWords: true is address false is first words
  const initialValue = test.testData.showAddressOrFirstWords ? "" : (targetPassage?.verseText || "").split(" ").slice(0,4).join(" ") + " ";
  const [passageText, setPassageText] = useState(initialValue)
  useEffect(() => {
    setPassageText(initialValue)
  },[test.id])

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setPassageText(initialValue)
  }


  const handleTestSubmit = (value: AddressType) => {
    const targetPassage = state.passages.find(p => p.id === test.passageId)
    if(!targetPassage){
      return;
    }
    if(JSON.stringify(targetPassage.address) === JSON.stringify(value)){
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
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false)
    setSelectedAddress(address)
  }
  const handleTextChange = (text: string) => {
    if(/\n/.test(text)){
      const noEnterText = text.replace(/\n/, "")
      const lastWords = noEnterText.split(" ")
      if(wordOptions[0]?.toLowerCase().startsWith(lastWords[lastWords.length-1].toLowerCase())){
        handleWordSelect(noEnterText, wordOptions[0])
      }else{
        setPassageText(noEnterText) 
      }
    }else{
      setPassageText(text)
    }
  }
  const handleWordSelect = (text:string, word: string) => {
    //replace last unfinished word with the word provided
    const passageWords = text.split(" ")
    const newPassageText = [...passageWords.slice(0,-1), word, ""].join(" ")
    setPassageText(newPassageText)
  }
  if(!targetPassage){
    return <View></View>
  }
  const targetWords = targetPassage.verseText.split(" ");
  const currentWords = passageText.split(" ");

  const curentLastIndex = currentWords.length - 1;
  const targetLastWord = targetWords[curentLastIndex];
  const currentLastWord = currentWords[curentLastIndex] !== targetLastWord ?
    currentWords[curentLastIndex]: "";

  const wordOptions = targetWords
    .filter((w,i) => 
      //searching for autocomplete
      currentLastWord.length > 0 ?
        w.toLowerCase().startsWith(currentLastWord.toLowerCase()) &&
        //filtering existing
        i >= curentLastIndex :
        false
    )
    //not randomly because of reactivness
    .sort((a,b) => getSimularity(currentLastWord, b) - getSimularity(currentLastWord, a))
  // console.log(`"${currentLastWord}"`, curentLastIndex, targetLastWord)

  const isCorrect = targetPassage.verseText.trim().startsWith(passageText.trim()) ||
   targetPassage.verseText === passageText

  const levelFinished = !!test.dateFinished;
  const isAddressProvided = test.testData.showAddressOrFirstWords
  return <View style={levelComponentStyle.levelComponentView}>
    <ScrollView style={{
      ...levelComponentStyle.passageTextView,
    }}>
      <View style={levelComponentStyle.addressTextView}>
        {isAddressProvided &&
          <Text style={levelComponentStyle.addressText}>{addressToString(targetPassage.address, t)}</Text>
        }
        {!isAddressProvided &&
          <Text style={levelComponentStyle.passageText}>{t("FinishPassage")}</Text>
        }
        </View>
      <Input
        multiline
        disabled={levelFinished}
        value={passageText}
        placeholder={t("LevelWritePassageText")}
        onSubmit={() => {}}
        color={isCorrect ? "green" : "red"}
        onChange={handleTextChange}
        style={{width: "100%"}}
      />
      {
        !!wordOptions.length &&
        <Text style={levelComponentStyle.inputSubtext}>{t("LevelL40Hint")}</Text>
      }
    </ScrollView>
      {passageText.length >= targetPassage.verseText.length && isCorrect && 
        <View style={levelComponentStyle.optionButtonsWrapper}>
          {
          !isAddressProvided && 
          <Button
            type="outline"
            color="green"
            title={selectedAddress ? addressToString(selectedAddress, t) : t("LevelSelectAddress")}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />
          }
          <Button
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() => handleTestSubmit(selectedAddress || targetPassage.address)}
            disabled={((!selectedAddress && !isAddressProvided) || (!isCorrect && isAddressProvided)) || levelFinished}
          />
        </View>
      }
      <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
    
    <ScrollView style={{...levelComponentStyle.optionButtonsScrollWrapper}}>
      <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      {
        wordOptions
        .map((w,i) => 
        <Button 
          type="outline"
          key={`${w}-${i}`}
          title={w}
          onPress={() => handleWordSelect(passageText,w)}
          style={{padding: 0}}
          textStyle={{fontSize: 16, textTransform: "none"}}
          disabled={levelFinished}
        />
        )
      }
      </View>
    </ScrollView>
  </View>
}