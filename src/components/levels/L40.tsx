import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getSimularity } from "../../utils/getSimularity";
import { ERRORS_TO_DOWNGRADE } from "../../constants";
import { SentenceContext } from "./SentenceContext";
import { feedback } from "../../utils/feedback";
import { levelLayout } from "./levelLayout";

// Level 4: type the passage out with the word autocomplete, then name the
// address (or read it, when the test gives the address and asks for the words).

const levelComponentStyle = StyleSheet.create({
  inputSubtext: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5
  },
  inputWrapperStyle: {
    width: "100%",
    flex: 1
  },
  inputTextGrow: {
    flex: 1,
    textAlignVertical: "top"
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
  },
  // The words to pick from are a hint under the input, not the answer itself,
  // so they stay in the action block and never grow past a couple of rows.
  wordOptions: {
    ...levelLayout.answerScrollContent,
    paddingHorizontal: 0,
    maxHeight: 120
  }
});

export const L40: FC<LevelComponentModel> = ({
  test,
  state,
  submitTest,
  dispatch
}) => {
  const { theme, t } = useAppContext();
  const [APVisible, setAPVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    null as null | AddressType
  );
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  //showAddressOrFirstWords:
  //  true => address
  //  false => first words
  const targetPassageWholeText = targetPassage?.verseText || "";
  //the sentences this test asks for; the whole passage when it carries no range
  const targetText = Passage.getRangeText(
    targetPassageWholeText,
    test.d?.sentenceRange
  );
  const firstFewWords = Passage.getFirstWords(targetText);
  const initialValue = test.d.showAddressOrFirstWords ? "" : firstFewWords;
  const [passageText, setPassageText] = useState(initialValue);
  useEffect(() => {
    setPassageText(initialValue);
  }, [test.i]);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setPassageText(initialValue);
  };

  const handleTestSubmit = (value: AddressType) => {
    if (!targetPassage) {
      return;
    }
    if (Address.equals(targetPassage.address, value)) {
      feedback(state.settings, "testRight");
      submitTest({
        isRight: true,
        modifiedTest: {
          ...test
        }
      });
    } else {
      feedback(state.settings, "testWrong");
      //add error
      submitTest({
        isRight: false,
        modifiedTest: {
          ...test,
          en: (test.en || 0) + 1,
          et: [...test.et, "wrongAddressToVerse"],
          wa: [...test.wa, value]
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
    //if entering "enter"
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
  const handleWordSelect = (userProvidedText: string, selectedWord: string) => {
    //replace last unfinished word with the word provided
    const userProvidedWords = userProvidedText.split(" ");
    const anticipatedCorrectWord = targetWords[userProvidedWords.length];
    const charIfNeeded =
      selectedWord === targetWords[userProvidedWords.length - 1] &&
      ["—", "–", "-", ":", ";", ".", ","].includes(anticipatedCorrectWord)
        ? anticipatedCorrectWord + " " // adding one more space here for A REASON
        : "";
    const newUserProvidedText = [
      ...userProvidedWords.slice(0, -1),
      selectedWord,
      charIfNeeded
    ].join(" ");
    const isWordWasWrong =
      newUserProvidedText.trim().split(" ")[userProvidedWords.length - 1] !==
      targetWords[userProvidedWords.length - 1];
    if (isWordWasWrong) {
      feedback(state.settings, "testWrong");
      submitTest({
        isRight: false,
        modifiedTest: {
          ...test,
          en: (test.en || 0) + 1,
          et: [...test.et, "wrongWord"],
          ww: [
            ...test.ww,
            [
              userProvidedWords.length - 1,
              newUserProvidedText.trim().split(" ")[
                userProvidedWords.length - 1
              ]
            ]
          ]
        }
      });
    } else {
      feedback(state.settings, "wordClick");
      setPassageText(newUserProvidedText);
    }
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

  const wordOptions = [
    ...targetWords.filter((w, i) =>
      //searching for autocomplete
      currentLastWord.length > 0
        ? w.toLowerCase().startsWith(currentLastWord.toLowerCase()) &&
          //filtering existing
          i >= curentLastIndex
        : false
    )
  ]
    //not randomly because of reactivness
    .sort(
      (a, b) =>
        getSimularity(currentLastWord, b) - getSimularity(currentLastWord, a)
    );

  const isCorrect =
    targetText.trim().startsWith(passageText.trim()) ||
    targetText === passageText;

  const levelFinished = test.f;
  const isAddressProvided = test.d.showAddressOrFirstWords;
  return (
    <View style={levelLayout.screen}>
      <View style={levelLayout.promptContent}>
        <Text
          style={{
            ...levelLayout.addressText,
            color: theme.colors.text
          }}
        >
          {isAddressProvided
            ? Address.format(targetPassage.address, t)
            : t("FinishPassage")}
        </Text>
      </View>
      {/* The answer is the typing, so the input takes the room the prompt left
          instead of a fixed 100px band with a screenful of nothing under it. */}
      <View style={levelLayout.answer}>
        <SentenceContext
          text={targetPassageWholeText}
          range={test.d.sentenceRange}
          side="before"
        />
        <Input
          multiline
          grow
          disabled={levelFinished}
          value={passageText}
          placeholder={t("LevelWritePassageText")}
          onSubmit={() => {}}
          color={isCorrect ? "green" : "red"}
          onChange={handleTextChange}
          wrapperStyle={levelComponentStyle.inputWrapperStyle}
          style={levelComponentStyle.inputStyle}
          textStyle={levelComponentStyle.inputTextGrow}
          numberOfLines={4}
        />
        <SentenceContext
          text={targetPassageWholeText}
          range={test.d.sentenceRange}
          side="after"
        />
      </View>
      <View style={levelLayout.action}>
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
        <ScrollView style={levelComponentStyle.wordOptions}>
          {wordOptions.map((w, i) => (
            <Button
              type="outline"
              key={`${w}-${i}`}
              title={w}
              onPress={() => handleWordSelect(passageText, w)}
              style={levelComponentStyle.wordOptionStyle}
              textStyle={levelComponentStyle.wordOptionTextStyle}
              disabled={levelFinished}
            />
          ))}
        </ScrollView>
        {passageText.length >= targetText.length &&
          isCorrect &&
          !isAddressProvided && (
            <Button
              type="outline"
              color="green"
              title={
                selectedAddress
                  ? Address.format(selectedAddress, t)
                  : t("LevelSelectAddress")
              }
              onPress={() => setAPVisible(true)}
              disabled={levelFinished}
            />
          )}
        {passageText.length >= targetText.length && isCorrect && (
          <Button
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
        )}
        {((test.en || 0) > ERRORS_TO_DOWNGRADE ||
          new Date().getTime() - test?.td?.[0]?.[0] > 1000 * 60 * 5) && (
          <Button
            type="secondary"
            color="gray"
            title={`${t("DowngradeLevel")}`}
            onPress={() => handleDowngrade()}
            disabled={levelFinished}
          />
        )}
      </View>
      <AddressPicker
        confirmTitle="Submit"
        visible={APVisible}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
      />
    </View>
  );
};
