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
  addressTextView: {
    alignContent: "flex-start",
    justifyContent: "center",
    marginVertical: 10,
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center",
    color: COLOR.text
  },
  passageTextView: {
    padding: 10,
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
  optionButtonsWrapper: {
    flex: 1,
    paddingHorizontal: 20, 
    width: "100%",
    gap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
    alignItems: "flex-start",
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
  const lastErrorIsWrongAddress = test.errorType === "wrongAddressToVerse"
  //showAddressOrFirstWords: true if address OR false if just first words
  const initialEnteredText = 
  lastErrorIsWrongAddress?
    targetPassage?.verseText || "":
    test.testData.showAddressOrFirstWords ? 
      "" :
      (targetPassage?.verseText || "").split(" ").slice(0,4).join(" ") + " "
  const [passageText, setPassageText] = useState(initialEnteredText)
  const [tries, setTries] = useState(MAX_L50_TRIES)
  const [isCorrect, setIsCorrect] = useState(lastErrorIsWrongAddress ? true : false)
  const [aucompleteWarn, setAucompleteWarn] = useState(false)
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null)

  useEffect(() => {
    resetForm()
  },[test.id])

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setPassageText(initialEnteredText)
    setAucompleteWarn(false)
    setIsCorrect(lastErrorIsWrongAddress ? true : false)
    setTries(MAX_L50_TRIES)
    setWrongAddress(null)
  }


  const handleErrorSubmit = (value: AddressType) => {
    submitTest({isRight: false, modifiedTest: {
      ...test,
      errorNumber: (test.errorNumber || 0) + 1,
      errorType: "wrongAddressToVerse",
      wrongAddress: [...test.wrongAddress, value]
    }})
    resetForm();
  } 

  const handleAddressSubmit = (value: AddressType) => {
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
      setWrongAddress(value)
    }
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
      const output = input.trim().toLowerCase().replace(/[,|.|-|:|;|!|?|'|"]/g, "")
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
        const enteredTextArray = passageText.split("");
        const rightPart = targetPassage.verseText.split("").filter((targetChar, i, wholeString) => {
          if(!i){
            return enteredTextArray[i] === targetChar
          }else{
            return enteredTextArray.slice(0,i).join("") === wholeString.slice(0,i).join("")
          }
        }).join("");
        setPassageText(rightPart);
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
    <View style={levelComponentStyle.passageTextView}>
      <Input
        multiline
        disabled={levelFinished || !!wrongAddress}
        value={passageText}
        placeholder={t("LevelWritePassageText")}
        onSubmit={() => {}}
        color={isCorrect ? "green": "gray"}
        onChange={handleTextChange}
        style={{width: "100%"}}
        autoCorrect={false}
        textStyle={{fontWeight: "normal"}}
      />
    </View>
    <View style={levelComponentStyle.optionButtonsWrapper}>
      {/* text is not entered */}
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
      {/* text entered and no address needed */}
      {
        isCorrect && isAddressProvided &&
        <Button
          type="main"
          color="green"
          title={t("Submit")}
          onPress={() => handleAddressSubmit(targetPassage.address)}
          disabled={levelFinished}
        />
      }
      {/* text entered but address needed and address not checked as wrong */}
      {
        isCorrect && !isAddressProvided && !wrongAddress &&
        [
          <Button
            key="addresPicker"
            type="outline"
            color="green"
            title={selectedAddress ? addressToString(selectedAddress, t) : t("LevelSelectAddress")}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />,
          <Button
            key="submitButton"
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() => selectedAddress ? handleAddressSubmit(selectedAddress) : {}}
            disabled={!selectedAddress || levelFinished}
          />
        ]
      }
      {
        isCorrect && !isAddressProvided && selectedAddress && wrongAddress && [
          <Button
            key="rightAnswer"
            type="outline"
            color="green"
            title={addressToString(targetPassage.address, t)}
            onPress={() => {}}
            disabled={levelFinished}
          />,
          <Button
            key="wrongAnswer"
            type="outline"
            color="red"
            title={addressToString(selectedAddress, t)}
            onPress={() => {}}
            disabled={levelFinished}
          />,
          <Button
            key="nextTest"
            type="main"
            color="green"
            title={t("ButtonContinue")}
            onPress={() => handleErrorSubmit(selectedAddress)}
            disabled={levelFinished}
          />
        ]
      }
    </View>
    <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
  </View>
}