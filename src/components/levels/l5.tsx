import { FC, useEffect, useState } from "react";
import { AddressType } from "../../models";
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { COLOR, MAX_L50_TRIES } from "../../constants";
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
    maxHeight: "50%",
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
    fontWeight: "500",
    textAlign: "center"
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
    color: COLOR.textDanger,
    textAlign: "center",
    fontSize: 12,
  }
})

export const L50: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const [APVisible, setAPVisible] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null as null | AddressType);
  const targetPassage = state.passages.find(p => p.id === test.passageId)
  //showAddressOrFirstWords: true is address false is first words
  const initialValue = test.testData.showAddressOrFirstWords ? "" : (targetPassage?.verseText || "").split(" ").slice(0,4).join(" ") + " ";
  const [passageText, setPassageText] = useState(initialValue)
  const [tries, setTries] = useState(MAX_L50_TRIES)
  const [isCorrect, setIsCorrect] = useState(false)
  const [aucompleteWarn, setAucompleteWarn] = useState(false)
  useEffect(() => {
    resetForm()
  },[test.id])

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setPassageText(initialValue)
    setAucompleteWarn(false)
    setIsCorrect(false)
    setTries(MAX_L50_TRIES)
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
  const handleTextSubmit = () => {
    if(!targetPassage){
      return;
    }
    const simplifyString: (arg: string) => string = (input) => {
      const output = input.trim().toLocaleLowerCase().replace(/[,|.|-|:|;|!|?|'|"]/g, "")
      return output;
    }
    if(simplifyString(passageText) === simplifyString(targetPassage.verseText)){
      setIsCorrect(true)
      if(passageText !== targetPassage.verseText){
        setPassageText(targetPassage.verseText)
      }
    }else{
      if(tries > 1){
        setTries(prv => prv-1)
      }else{
        submitTest({isRight: false, modifiedTest: {
          ...test,
          errorNumber: (test.errorNumber || 0) + 1,
          errorType: "other"
        }})
      }
    }
  }

  const handleTextChange = (text: string) => {
    if(Math.abs(text.length - passageText.length) === 1){
      setPassageText(text)
    }else{
      //set warning for autocompliting
      //then set an error
      if(!aucompleteWarn){
        setAucompleteWarn(true)
      }else{
        submitTest({isRight: false, modifiedTest: {
          ...test,
          errorNumber: (test.errorNumber || 0) + 1,
          errorType: "moreThenOneCharacter",
        }})
      }
    }
  }
  
  if(!targetPassage){
    return <View></View>
  }

  const levelFinished = !!test.dateFinished;
  const isAddressProvided = test.testData.showAddressOrFirstWords
  return <View style={levelComponentStyle.levelComponentView}>
    <View style={levelComponentStyle.addressTextView}>
      {isAddressProvided &&
        <Text style={levelComponentStyle.addressText}>{addressToString(targetPassage.address, t)}</Text>
      }
      {!isAddressProvided &&
        <Text style={levelComponentStyle.passageText}>{t("FinishPassageL5")}</Text>
      }
      {
        !!aucompleteWarn &&
        <Text style={levelComponentStyle.inputSubtext}>{t("LevelL50Warning")}</Text>
      }
    </View>
    <ScrollView style={{
      ...levelComponentStyle.passageTextView,
    }}>
      <Input
        multiline
        disabled={levelFinished}
        value={passageText}
        placeholder={t("LevelWritePassageText")}
        onSubmit={() => {}}
        color={"green"}
        onChange={handleTextChange}
        style={{width: "100%"}}
        autoCorrect={false}
        textStyle={{fontWeight: "normal"}}
      />
    </ScrollView>
      <View style={levelComponentStyle.optionButtonsWrapper}>
        {isCorrect &&!isAddressProvided && 
          <Button
            type="outline"
            color="green"
            title={selectedAddress ? addressToString(selectedAddress, t) : t("LevelSelectAddress")}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />
        }
        {isCorrect && 
          <Button
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() => handleTestSubmit(selectedAddress || targetPassage.address)}
            disabled={((!selectedAddress && !isAddressProvided) || (!isCorrect && isAddressProvided)) || levelFinished}
          />
        }
        {
          !isCorrect &&
          <Button
            type="main"
            color="green"
            title={`${t("CheckText")} (${tries}/${MAX_L50_TRIES})`}
            onPress={() => handleTextSubmit()}
            disabled={levelFinished}
          />
        }
      </View>
      <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
  </View>
}