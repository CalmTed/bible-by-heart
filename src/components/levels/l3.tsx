import { FC, useState } from "react";
import { AddressType } from "../../models";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native"
import { COLOR } from "../../constants";
import addressToString from "../../tools/addressToString"
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    maxHeight: "50%",
    height: "auto",
    backgroundColor: COLOR.bgSecond,
    borderRadius: 10,
    
    margin: 10,
  },
  passageText: {
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
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

})

export const L30: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
  const [APVisible, setAPVisible] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null as null | AddressType);
  const [selectedWords, setSelectedWords] = useState([] as number[])

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setSelectedWords([])
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
  const handleWordSelect = (value: string) => {
    const independentMisingWords = [...missingWords]
    const nextUnselectedIndexes = independentMisingWords
      .sort((a,b) => a - b)
      .filter(mw => !selectedWords.includes(mw))
    const neededWord = words[nextUnselectedIndexes[0]]
    if(neededWord && value === neededWord){
      setSelectedWords(prv => 
        [...prv, nextUnselectedIndexes[0]]
        )
    }else{
      //handle error
      resetForm()
      submitTest({isRight: false, modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongWord",
        wrongWords: [...test.wrongWords, [nextUnselectedIndexes[0],value]]
      }})
    }
  }
  const handleWordCancel = (index: number) => {
    setSelectedWords(prv => 
      [...prv.filter(w => w != index)]
    )
  }
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false)
    setSelectedAddress(address)
  }
  const targetPassage = state.passages.find(p => p.id === test.passageId)
  const missingWords = test.testData.missingWords || []
  if(!targetPassage || !missingWords){
    return <View></View>
  }
  const words = targetPassage.verseText.split(" ");
  const levelFinished = !!test.dateFinished;
  return <View style={levelComponentStyle.levelComponentView}>
    <ScrollView style={levelComponentStyle.passageTextView}>
      <View style={levelComponentStyle.passageText}>
        {words.map((w,i) => {
          const nextUnselectedIndex = [...missingWords]
            .sort((a,b) => a - b)
            .filter(mw => !selectedWords.includes(mw))[0] === i
          return <View key={`${w}${i}`}
            style={{
              ...missingWords.includes(i) ? levelComponentStyle.variableWord : levelComponentStyle.fixedWord,
              ...nextUnselectedIndex ? levelComponentStyle.nextUnselected : {}
            }}
          >
            <Pressable onPress={() => handleWordCancel(i)} disabled={levelFinished}>
              <Text style={{
                ...levelComponentStyle.wordText,
                ...selectedWords.includes(i) || !missingWords.includes(i) ? {} : levelComponentStyle.hiddenWordText
              }}
              >{w}</Text>
            </Pressable>
          </View>
        }
        )}
      </View>
    </ScrollView>
      {missingWords.length === selectedWords.length && <View style={levelComponentStyle.optionButtonsWrapper}>
          <Button
            type="outline"
            color="green"
            title={selectedAddress ? addressToString(selectedAddress, t) : t("LevelSelectAddress")}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />
          <Button
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() => selectedAddress ? handleTestSubmit(selectedAddress) : null}
            disabled={!selectedAddress || levelFinished}
          />
      </View>
      }
      <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
    
    <ScrollView style={{...levelComponentStyle.optionButtonsScrollWrapper}}>
      <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      {
        missingWords
        .filter((w,i) => !selectedWords.includes(w))
        .map((w,i) => 
        <Button 
          type="outline"
          key={`${words[w]}-${w}`}
          title={words[w]}
          onPress={() => handleWordSelect(words[w])}
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