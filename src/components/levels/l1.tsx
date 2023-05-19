import { FC } from "react";
import { WORD } from "../../l10n";
import { AddressType, AppStateModel, TestModel } from "../../models";
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { COLOR, globalStyle } from "../../constants";
import addressToString from "../../tools/addressToString"
import { Button } from "../Button";

export interface LevelComponentModel {
  test: TestModel
  state: AppStateModel
  t: (w: WORD) => string
  submitTest: (data:{isRight: boolean, modifiedTest: TestModel}) => void
}

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    alignContent: "center",
    flex: 1,
  },
  passageText: {
    fontSize: 18,
    letterSpacing: 0.5,
    margin: 20,
    backgroundColor: COLOR.bgSecond,
    borderRadius: 10,
    padding: 10
  },
  addressTextView: {
    alignContent: "center",
    justifyContent: "center",
    maxHeight: 200,
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
  }
})

export const L10: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
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
  }
  const levelFinished = !!test.dateFinished;
  return <View style={{...levelComponentStyle.levelComponentView}}>
    <ScrollView style={{...levelComponentStyle.passageTextView}}>
      <Text style={{...globalStyle.text, ...levelComponentStyle.passageText}}>{state.passages.find(p => p.id === test.passageId)?.verseText}</Text>
    </ScrollView>
    <View style={{...levelComponentStyle.optionButtonsWrapper}}>
      { 
      test.testData.addressOptions && test.testData.addressOptions.map(op => {
        return <Button
          key={JSON.stringify(op)}
          title={addressToString(op,t)}
          type="outline"
          color="green"
          onPress={() => handleTestSubmit(op)}
          disabled={levelFinished}
        />
      })}
    </View>
  </View>
}

export const L11: FC<LevelComponentModel> = ({test, state, t, submitTest}) => {
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
      { 
      test.testData.passagesOptions && test.testData.passagesOptions.map(op => {
        const title =  op.verseText.length < 50 ? op.verseText : op.verseText.slice(0,50).trim().replace(/(.|,)$/,"") + "..."
        return <Button
          key={op.id}
          title={title}
          type="outline"
          color="green"
          textStyle={{textTransform: "none"}}
          onPress={() => handleTestSubmit(op.id)}
          disabled={levelFinished}
          />
      }) 
    }
    </View>
  </View>
}