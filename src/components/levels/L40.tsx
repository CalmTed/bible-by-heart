import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getSimularity } from "../../utils/getSimularity";
import { ERRORS_TO_DOWNGRADE, VIBRATION_PATTERNS } from "../../constants";
import { SentenceContext } from "./SentenceContext";

// Level 4: type the passage out with the word autocomplete, then name the
// address (or read it, when the test gives the address and asks for the words).

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 15
  },
  addressTextView: {
    alignContent: "flex-start",
    justifyContent: "center"
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center"
  },
  passageTextView: {
    maxHeight: 100,
    height: "auto",
    minHeight: 100,
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
    height: "100%",
    display: "flex",
    alignContent: "flex-start",
    justifyContent: "flex-start"
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
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
      }
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
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.wordClick);
      }
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
    <ScrollView style={levelComponentStyle.levelComponentView}>
      <View style={levelComponentStyle.addressTextView}>
        {isAddressProvided && (
          <Text
            style={{
              ...levelComponentStyle.addressText,
              color: theme.colors.text
            }}
          >
            {Address.format(targetPassage.address, t)}
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
      <SentenceContext
        text={targetPassageWholeText}
        range={test.d.sentenceRange}
        side="before"
      />
      <View
        style={{
          ...levelComponentStyle.passageTextView
        }}
      >
        <Input
          multiline
          disabled={levelFinished}
          value={passageText}
          placeholder={t("LevelWritePassageText")}
          onSubmit={() => {}}
          color={isCorrect ? "green" : "red"}
          onChange={handleTextChange}
          wrapperStyle={levelComponentStyle.inputWrapperStyle}
          style={levelComponentStyle.inputStyle}
          numberOfLines={4}
        />
      </View>
      <SentenceContext
        text={targetPassageWholeText}
        range={test.d.sentenceRange}
        side="after"
      />
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
        </View>
      )}
      <AddressPicker
        visible={APVisible}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
      />
      <ScrollView style={{ ...levelComponentStyle.optionButtonsScrollWrapper }}>
        <View style={{ ...levelComponentStyle.optionButtonsWrapper }}>
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
        </View>
      </ScrollView>
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
    </ScrollView>
  );
};
