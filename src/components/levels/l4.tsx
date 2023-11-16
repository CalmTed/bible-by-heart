import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import addressToString from "../../tools/addressToString";
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getSimularity } from "../../tools/getSimularity";
import { getTheme } from "../../tools/getTheme";
import { ERRORS_TO_DOWNGRADE, FIRST_FEW_WORDS, SENTENCE_SEPARATOR, VIBRATION_PATTERNS } from "../../constants";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 15
  },
  addressTextView: {
    alignContent: "flex-start",
    justifyContent: "center",
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center"
  },
  otherSentencesTextView: {
    marginHorizontal: 10,
    marginVertical: 5
  },
  passageTextView: {
    maxHeight: 100,
    height: "auto",
    minHeight: 22,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 0,
    paddingHorizontal: 0
  },
  passageText: {
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    fontSize: 18,
    fontWeight: "500"
  },
  optionButtonsScrollWrapper: {
    flex: 1,
    width: "100%"
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
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5
  },
  inputWrapperStyle: {
    width: "100%",
    height: "100%"
  },
  inputStyle: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start"
  },
  wordOptionStyle: {
    padding: 0
  },
  wordOptionTextStyle: {
    fontSize: 16,
    textTransform: "none"
  }
});

export const L40: FC<LevelComponentModel> = ({
  test,
  state,
  t,
  submitTest,
  dispatch
}) => {
  const [APVisible, setAPVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    null as null | AddressType
  );
  const targetPassage = state.passages.find((p) => p.id === test.passageId);
  //showAddressOrFirstWords: true => address false => first words
  const sentences = (targetPassage?.verseText || "").split(SENTENCE_SEPARATOR).filter(s => s.length > 0)
  const sentancesRange = test.testData?.sentenceRange && test.testData.sentenceRange.length === 2 
    ? sentences.slice(...test.testData.sentenceRange)
    : sentences;
  const targetText = sentancesRange.join("");
  const firstFewWords = targetText.split(" ").slice(0, FIRST_FEW_WORDS).join(" ") + " ";
  const initialValue = test.testData.showAddressOrFirstWords
    ? ""
    : firstFewWords;
  const [passageText, setPassageText] = useState(initialValue);
  useEffect(() => {
    setPassageText(initialValue);
  }, [test.id]);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setPassageText(initialValue);
  };

  const handleTestSubmit = (value: AddressType) => {
    if (!targetPassage) {
      return;
    }
    if (JSON.stringify(targetPassage.address) === JSON.stringify(value)) {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testRight);
      }
      submitTest({
        isRight: true,
        modifiedTest: {
          ...test
        }
      });
    } else {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
      }
      //add error
      submitTest({
        isRight: false,
        modifiedTest: {
          ...test,
          errorNumber: (test.errorNumber || 0) + 1,
          errorType: "wrongAddressToVerse",
          wrongAddress: [...test.wrongAddress, value]
        }
      });
    }
    resetForm();
  };
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(address);
  };
  const handleTextChange = (text: string) => {
    if (/\n/.test(text)) {
      const noEnterText = text.replace(/\n/, "");
      const lastWords = noEnterText.split(" ");
      if (
        wordOptions[0]
          ?.toLowerCase()
          .startsWith(lastWords[lastWords.length - 1].toLowerCase())
      ) {
        handleWordSelect(noEnterText, wordOptions[0]);
      } else {
        setPassageText(noEnterText);
      }
    } else {
      setPassageText(text);
    }
  };
  const handleWordSelect = (text: string, word: string) => {
    //replace last unfinished word with the word provided
    const passageWords = text.split(" ");
    const nextWord = targetWords[passageWords.length];
    const nextWordIfNeeded =
      word === targetWords[passageWords.length - 1] &&
      ["—", "–", "-", ":", ";", ".", ","].includes(nextWord)
        ? nextWord + " " // adding one more space here for a reason
        : "";
    if (state.settings.hapticsEnabled) {
      Vibration.vibrate(VIBRATION_PATTERNS.wordClick);
    }
    const newPassageText = [
      ...passageWords.slice(0, -1),
      word,
      nextWordIfNeeded
    ].join(" ");
    setPassageText(newPassageText);
  };
  const handleDowngrade = () => {
    dispatch({
      name: ActionName.downgradePassage,
      payload: {
        test: test
      }
    });
  };
  if (!targetPassage) {
    return <View />;
  }
  const targetWords = targetText.split(" ");
  const currentWords = passageText.split(" ");

  const curentLastIndex = currentWords.length - 1;
  const targetLastWord = targetWords[curentLastIndex];
  const currentLastWord =
    currentWords[curentLastIndex] !== targetLastWord
      ? currentWords[curentLastIndex]
      : "";

  const wordOptions = targetWords
    .filter((w, i) =>
      //searching for autocomplete
      currentLastWord.length > 0
        ? w.toLowerCase().startsWith(currentLastWord.toLowerCase()) &&
          //filtering existing
          i >= curentLastIndex
        : false
    )
    //not randomly because of reactivness
    .sort(
      (a, b) =>
        getSimularity(currentLastWord, b) - getSimularity(currentLastWord, a)
    );

  const isCorrect =
    targetText.trim().startsWith(passageText.trim()) ||
    targetText === passageText;

  const levelFinished = test.isFinished;
  const isAddressProvided = test.testData.showAddressOrFirstWords;
  const theme = getTheme(state.settings.theme);
  return (
    <ScrollView style={levelComponentStyle.levelComponentView}>
      <View style={levelComponentStyle.addressTextView}>
        {isAddressProvided && (
          <Text
            style={{
              ...levelComponentStyle.addressText,
              color: theme.colors.text
            }}
          >
            {addressToString(targetPassage.address, t)}
          </Text>
        )}
        {!isAddressProvided && (
          <Text
            style={{
              ...levelComponentStyle.passageText,
              color: theme.colors.text
            }}
          >
            {t("FinishPassage")}
          </Text>
        )}
      </View>
      {test.testData.sentenceRange && test.testData.sentenceRange[0] > 0 &&
        <View style={levelComponentStyle.otherSentencesTextView}>
          <Text style={theme.theme.text}>
            {test.testData.sentenceRange[0] > 3 ? "..." : ""}
            {sentences.slice(
              test.testData.sentenceRange[0] > 3 ? test.testData.sentenceRange[0] - 3 : 0,
              test.testData.sentenceRange[0]
            ).join("")}
            ...
            </Text>
        </View>
      }
      <View
        style={{
          ...levelComponentStyle.passageTextView
        }}
      >
        <Input
          theme={theme}
          multiline
          disabled={levelFinished}
          value={passageText}
          placeholder={t("LevelWritePassageText")}
          onSubmit={() => {}}
          color={isCorrect ? "green" : "red"}
          onChange={handleTextChange}
          wrapperStyle={levelComponentStyle.inputWrapperStyle}
          style={levelComponentStyle.inputStyle}
        />
      </View>
      {test.testData.sentenceRange && test.testData.sentenceRange[1] < sentences.length &&
        <View style={levelComponentStyle.otherSentencesTextView}>
          <Text style={theme.theme.text}>
            ...
            {sentences.slice(test.testData.sentenceRange[1], Math.min(test.testData.sentenceRange[1] + 3, sentences.length)).join("")}
            {sentences.length - test.testData.sentenceRange[1] >= 3 ? "..." : ""}
            </Text>
        </View>
      }
      {!!wordOptions.length && currentWords.length < 5 && (
      <Text
          style={{
            ...levelComponentStyle.inputSubtext,
            color: theme.colors.textSecond
          }}
        >
          {t("LevelL40Hint")}
      </Text>
      )}
      {passageText.length >= targetText.length && isCorrect && (
        <View style={levelComponentStyle.optionButtonsWrapper}>
          {!isAddressProvided && (
            <Button
              theme={theme}
              type="outline"
              color="green"
              title={
                selectedAddress
                  ? addressToString(selectedAddress, t)
                  : t("LevelSelectAddress")
              }
              onPress={() => setAPVisible(true)}
              disabled={levelFinished}
            />
          )}
          <Button
            theme={theme}
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() =>
              handleTestSubmit(selectedAddress || targetPassage.address)
            }
            disabled={
              (!selectedAddress && !isAddressProvided) ||
              (!isCorrect && isAddressProvided) ||
              levelFinished
            }
          />
        </View>
      )}
      <AddressPicker
        theme={theme}
        visible={APVisible}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
        t={t}
      />
      {((test.errorNumber || 0) > ERRORS_TO_DOWNGRADE ||
        (new Date().getTime() - test.triesDuration[0][0]) > (1000*60*5)) && (
        <Button
          theme={theme}
          type="secondary"
          color="gray"
          title={`${t("DowngradeLevel")}`}
          onPress={() => handleDowngrade()}
          disabled={levelFinished}
        />
      )}
      <ScrollView style={{ ...levelComponentStyle.optionButtonsScrollWrapper }}>
        <View style={{ ...levelComponentStyle.optionButtonsWrapper }}>
          {wordOptions.map((w, i) => (
            <Button
              theme={theme}
              type="outline"
              key={`${w}-${i}`}
              title={w}
              onPress={() => handleWordSelect(passageText, w)}
              style={levelComponentStyle.wordOptionStyle}
              textStyle={levelComponentStyle.wordOptionTextStyle}
              disabled={levelFinished}
            />
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
};
