import { FC, useEffect, useState } from "react";
import { AddressType } from "../../models";
import { View, Text, StyleSheet, ScrollView, Pressable, Vibration } from "react-native"
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
    maxHeight: "30%",
    height: "auto",
    backgroundColor: COLOR.bgSecond,
    borderRadius: 10,
    margin: 10,
    paddingHorizontal: 10,
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

  const lastErrorIsWrongAddress = test.errorType === "wrongAddressToVerse"
  const alreadyEnteredUntill = 
    test.wrongWords.length > 0 ?
      test.wrongWords.sort((a,b) => b[0] - a[0])[0][0] :
      null;
  const targetPassage = state.passages.find(p => p.id === test.passageId)
  const missingWords = test.testData.missingWords || []
  if(!targetPassage || !missingWords){
    submitTest({isRight: true, modifiedTest: test});
    return <View></View>;
  }
  const words = targetPassage.verseText.split(" ");
  const defaultSelectedWords:number[] = 
    lastErrorIsWrongAddress?
    words.map((w,i) => i) :
    alreadyEnteredUntill ?
      words.map((w,i) => i).slice(0, alreadyEnteredUntill) :
      [];
  const [selectedWords, setSelectedWords] = useState(defaultSelectedWords)
  const [errorIndex, setErrorIndex] = useState(null as number | null);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  useEffect(() => {
    //reset list if same level but different test/passage
    resetForm()
    setSelectedWords(defaultSelectedWords)
  }, [test.id])

  const resetForm = () => {
    setAPVisible(false)
    setSelectedAddress(null)
    setErrorIndex(null)
    setWrongAddress(null)
  }


  const handleErrorSubmit = (value: AddressType) => {
    submitTest({isRight: false, modifiedTest: {
      ...test,
      errorNumber: (test.errorNumber || 0) + 1,
      errorType: "wrongAddressToVerse",
      wrongAddress: [...test.wrongAddress, value]
    }})    
    resetForm()
  }
  const handleAdressCheck = (value: AddressType) => {
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
      setWrongAddress(value);
    }
  }
  const handleWordSelect = (nextUnselectedIndex: number, selectedMissingWord: number) => {
    const neededWord = words[nextUnselectedIndex];
    const selectedWord = words[selectedMissingWord];
    Vibration.vibrate(15);
    if(neededWord && selectedWord === neededWord){
      setSelectedWords(prv => 
        [...prv, nextUnselectedIndex]
        )
    }else{
      //handle error
      setErrorIndex(selectedMissingWord)
    }
  }
  const conformWrongWordError: (rightIndex: number, wrongWord: string) => void = (rightIndex, wrongWord) => {
    resetForm()
    submitTest({isRight: false, modifiedTest: {
      ...test,
      errorNumber: (test.errorNumber || 0) + 1,
      errorType: "wrongWord",
      wrongWords: [...test.wrongWords, [rightIndex,wrongWord]]
    }})
  }
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false)
    setSelectedAddress(address)
  }


  const levelFinished = !!test.dateFinished;
  const nextUnselectedIndex = [...missingWords]
    .sort((a,b) => a - b)
    .filter(mw => !selectedWords.includes(mw))[0];
  const unselectedWords = missingWords.filter((mwi,i) => !selectedWords.includes(mwi));
  return <View style={levelComponentStyle.levelComponentView}>
    <ScrollView style={levelComponentStyle.passageTextView}>
      <View style={levelComponentStyle.passageText}>
        {words.map((w,i) => {
          return <View key={`${w}${i}`}
            style={{
              ...missingWords.includes(i) ? levelComponentStyle.variableWord : levelComponentStyle.fixedWord,
              ...!levelFinished && nextUnselectedIndex === i ? levelComponentStyle.nextUnselected : {}
            }}
          >
            <Text style={{
                ...levelComponentStyle.wordText,
                ...levelFinished || selectedWords.includes(i) || !missingWords.includes(i) ? {} : levelComponentStyle.hiddenWordText
              }}
              >{w}</Text>
          </View>
        }
        )}
      </View>
    </ScrollView>
    {/* fi there are some missig words or error with them*/}
    {
      (!!unselectedWords.length || !!errorIndex) &&
      <ScrollView style={{...levelComponentStyle.optionButtonsScrollWrapper}}>
        <View style={{...levelComponentStyle.optionButtonsWrapper}}>
          {
          // if no error and not finished yet
          !errorIndex && !levelFinished &&
          unselectedWords
          .map((mwi,i) => {
            return <Button
              type="outline"
              key={`${words[mwi]}-${mwi}`}
              title={words[mwi]}
              onPress={() => handleWordSelect(nextUnselectedIndex, mwi)}
              style={{padding: 0}}
              textStyle={{fontSize: 16, textTransform: "none"}}
              disabled={levelFinished}
            />
          })
          }
          {
          // if there is an error and not finished yet
          !!errorIndex &&
          [...missingWords
          .filter((mwi,i) => mwi === nextUnselectedIndex || mwi === errorIndex)
          .map((mwi,i) => {
            return <Button
              type="main"
              key={`${mwi}-${i}`}
              title={words[mwi]}
              onPress={() => {}}
              style={{padding: 0}}
              textStyle={{fontSize: 16, textTransform: "none"}}
              color={mwi === nextUnselectedIndex ? "green" : "red"}
            />
          }),
          <Button 
            key="nextButton"
            type="outline"
            color="green"
            title={t("ButtonContinue")}
            onPress={() => conformWrongWordError(nextUnselectedIndex, words[errorIndex])}
            />
          ]
          }
        </View>
      </ScrollView>
    }
    {/* if no missing words and no error with them and addres is not wrong */}
    {
      !unselectedWords.length && !errorIndex && !wrongAddress && 
      <View style={levelComponentStyle.optionButtonsWrapper}>
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
          onPress={() => selectedAddress ? handleAdressCheck(selectedAddress) : null}
          disabled={!selectedAddress || levelFinished}
        />
      <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
      </View>
    }
    {/* if no missing words but wrong address */}
    {
      !unselectedWords.length && !errorIndex && wrongAddress && 
      <View style={levelComponentStyle.optionButtonsWrapper}>
        <Button
          type="outline"
          color="green"
          title={addressToString(targetPassage.address, t)}
          onPress={() => {}}
          disabled={levelFinished}
        />
        <Button
          type="outline"
          color="red"
          title={selectedAddress ? addressToString(selectedAddress, t) : ""}
          onPress={() => {}}
          disabled={levelFinished}
        />
        <Button
          type="main"
          color="green"
          title={t("ButtonContinue")}
          onPress={() => handleErrorSubmit(wrongAddress)}
          disabled={levelFinished}
        />
      <AddressPicker visible={APVisible} onCancel={() => setAPVisible(false)} onConfirm={handleAddressSelect} t={t}/>
    </View>
    }

  </View>
}