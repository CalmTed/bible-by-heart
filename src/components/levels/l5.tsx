import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType } from "../../models";
import { View, Text, StyleSheet, Vibration, ScrollView } from "react-native";
import { ERRORS_TO_DOWNGRADE, FIRST_FEW_WORDS, MAX_L50_TRIES, SENTENCE_SEPARATOR, VIBRATION_PATTERNS } from "../../constants";
import addressToString from "../../tools/addressToString";
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getTheme } from "../../tools/getTheme";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
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
    textAlign: "center"
  },
  passageTextView: {
    padding: 10,
    maxHeight: 200,
    minHeight: 50
  },
  otherSentencesTextView: {
    marginHorizontal: 10,
    marginVertical: 5
  },
  passageText: {
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
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
    alignItems: "flex-start"
  },
  inputSubtext: {
    textAlign: "center",
    fontSize: 12
  },
  inputStyle: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start"
  },
  inputTextStyle: {
    fontWeight: "normal"
  },
  inputWrapperStyle: {
    width: "100%",
    height: "100%"
  }
});

export const L50: FC<LevelComponentModel> = ({
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
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  //showAddressOrFirstWords: true => address false => first words
  const sentences = (targetPassage?.verseText || "").split(SENTENCE_SEPARATOR).filter(s => s.length > 0)
  const sentancesRange = test.d?.sentenceRange && test.d.sentenceRange.length === 2 
    ? sentences.slice(...test.d.sentenceRange)
    : sentences;
  const targetText = sentancesRange.join("");
  const firstFewWords = targetText.split(" ").slice(0, FIRST_FEW_WORDS).join(" ") + " ";
  const initialValue = test.d.showAddressOrFirstWords
    ? ""
    : firstFewWords;
  const [passageText, setPassageText] = useState(initialValue);
  const sentancesRangeLength =  test.d?.sentenceRange && test.d.sentenceRange.length === 2 
    ? test.d.sentenceRange[1] - test.d.sentenceRange[0]
    : sentences.length;
  const maxTriesBonus =
    targetPassage && sentancesRangeLength > 2
      ? sentancesRangeLength - 2
      : 0;
  const [tries, setTries] = useState(MAX_L50_TRIES + maxTriesBonus);
  const lastErrorIsWrongAddress = test.et.length ? test.et[test.et.length - 1] === "wrongAddressToVerse" : false;
  const [isCorrect, setIsCorrect] = useState(
    lastErrorIsWrongAddress ? true : false
  );
  const [aucompleteWarn, setAucompleteWarn] = useState(false);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setPassageText(initialValue);
    setAucompleteWarn(false);
    setIsCorrect(lastErrorIsWrongAddress ? true : false);
    setTries(MAX_L50_TRIES + maxTriesBonus);
    setWrongAddress(null);
  };

  useEffect(() => {
    resetForm();
  }, [test.i]);

  const handleErrorSubmit = (value: AddressType) => {
    submitTest({
      isRight: false,
      modifiedTest: {
        ...test,
        en: (test.en || 0) + 1,
        et: [...test.et,"wrongAddressToVerse"],
        wa: [...test.wa, value]
      }
    });
    resetForm();
  };

  const handleAddressSubmit = (value: AddressType) => {
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
      setWrongAddress(value);
    }
  };
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(address);
  };
  const handleTextSubmit = () => {
    if (!targetPassage) {
      return;
    }
    const simplifyString: (arg: string) => string = (input) => {
      const output = input
        .trim()
        .toLowerCase()
        .replace(/[,|.|-|:|;|!|?|'|"]/g, "");
      return output;
    };
    if (
      simplifyString(passageText) === simplifyString(targetText)
    ) {
      setIsCorrect(true);
      if (passageText !== targetText) {
        setPassageText(targetText);
      }
    } else {
      if (tries > 0) {
        setTries((prv) => prv - 1);
        const enteredTextArray = passageText.split("");
        const rightPart = targetText
          .split("")
          .filter((targetChar, i, wholeString) => {
            if (!i) {
              return enteredTextArray[i] === targetChar;
            } else {
              return (
                enteredTextArray.slice(0, i).join("") ===
                wholeString.slice(0, i).join("")
              );
            }
          })
          .join("");
        setPassageText(rightPart);
      } else {
        if (state.settings.hapticsEnabled) {
          Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
        }
        const words = targetText.split(" ")
        const userWords = passageText.split(" ")
        const wrongWordIndex = words.map((w,i) => {
          const iterationtText = words.slice(0,i).join(" ")
          const passageSliced = userWords.slice(0,i).join(" ")
          return simplifyString(iterationtText) === simplifyString(passageSliced)
        }).filter(w => !!w).length - 1//length is corrisponging to the last word user got right
        submitTest({
          isRight: false,
          modifiedTest: {
            ...test,
            en: (test.en || 0) + 1,
            et: [...test.et, "wrongWord"],
            ww: [...test.ww, [wrongWordIndex, userWords[wrongWordIndex]]]
          }
        });
        resetForm();
      }
    }
  };

  const handleTextChange = (text: string) => {
    if (Math.abs(text.length - passageText.length) === 1) {
      setPassageText(text);
    } else {
      //set warning for autocompliting
      //then set an error
      if (!aucompleteWarn) {
        setAucompleteWarn(true);
      } else {
        if (state.settings.hapticsEnabled) {
          Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
        }
        submitTest({
          isRight: false,
          modifiedTest: {
            ...test,
            en: (test.en || 0) + 1,
            et: [...test.et, "moreThenOneCharacter"]
          }
        });
      }
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

  const levelFinished = test.f;
  const isAddressProvided = test.d.showAddressOrFirstWords;
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
            {t("FinishPassageL5")}
          </Text>
        )}
        {!!aucompleteWarn && (
          <Text
            style={{
              ...levelComponentStyle.inputSubtext,
              color: theme.colors.textDanger
            }}
          >
            {t("LevelL50Warning")}
          </Text>
        )}
      </View>
      {test.d.sentenceRange && test.d.sentenceRange[0] > 0 &&
        <View style={levelComponentStyle.otherSentencesTextView}>
          <Text style={theme.theme.text}>
            {test.d.sentenceRange[0] > 3 ? "..." : ""}
            {sentences.slice(
              test.d.sentenceRange[0] > 3 ? test.d.sentenceRange[0] - 3 : 0,
              test.d.sentenceRange[0]
            ).join("")}
            ...
            </Text>
        </View>
      }
      <View style={levelComponentStyle.passageTextView}>
        <Input
          theme={theme}
          multiline
          disabled={levelFinished || !!wrongAddress}
          value={passageText}
          placeholder={t("LevelWritePassageText")}
          onSubmit={() => {}}
          color={isCorrect ? "green" : "gray"}
          onChange={handleTextChange}
          wrapperStyle={levelComponentStyle.inputWrapperStyle}
          style={levelComponentStyle.inputStyle}
          autoCorrect={false}
          textStyle={levelComponentStyle.inputTextStyle}
        />
      </View>
      {test.d.sentenceRange && test.d.sentenceRange[1] < sentences.length &&
        <View style={levelComponentStyle.otherSentencesTextView}>
          <Text style={theme.theme.text}>
            ...
            {sentences.slice(test.d.sentenceRange[1], Math.min(test.d.sentenceRange[1] + 3, sentences.length)).join("")}
            {sentences.length - test.d.sentenceRange[1] >= 3 ? "..." : ""}
            </Text>
        </View>
      }
      <View style={levelComponentStyle.optionButtonsWrapper}>
        {/* text is not entered */}
        {!isCorrect && (
          <Button
            theme={theme}
            type="main"
            color="green"
            title={`${t("CheckText")} (${tries}/${
              MAX_L50_TRIES + maxTriesBonus
            })`}
            onPress={() => handleTextSubmit()}
            disabled={levelFinished}
          />
        )}
        {/* text entered and no address needed */}
        {isCorrect && isAddressProvided && (
          <Button
            theme={theme}
            type="main"
            color="green"
            title={`${t("Submit")} ${tries}/${MAX_L50_TRIES + maxTriesBonus}`}
            onPress={() => handleAddressSubmit(targetPassage.address)}
            disabled={levelFinished}
          />
        )}
        {((test.en || 0) > ERRORS_TO_DOWNGRADE ||
          (new Date().getTime() - test.td[0][0]) > (1000*60*10)) && (
          <Button
            theme={theme}
            type="secondary"
            color="gray"
            title={`${t("DowngradeLevel")}`}
            onPress={() => handleDowngrade()}
            disabled={levelFinished}
          />
        )}
        {/* text entered but address needed and address has not been checked */}
        {isCorrect &&
          !isAddressProvided &&
          !wrongAddress && [
            <Button
              theme={theme}
              key="addresPicker"
              type="outline"
              color="green"
              title={
                selectedAddress
                  ? addressToString(selectedAddress, t)
                  : t("LevelSelectAddress")
              }
              onPress={() => setAPVisible(true)}
              disabled={levelFinished}
            />,
            <Button
              theme={theme}
              key="submitButton"
              type="main"
              color="green"
              title={t("Submit")}
              onPress={() =>
                selectedAddress ? handleAddressSubmit(selectedAddress) : {}
              }
              disabled={!selectedAddress || levelFinished}
            />
          ]}
        {/* text entered but address checked and wrong */}
        {isCorrect &&
          !isAddressProvided &&
          selectedAddress &&
          wrongAddress && [
            <Button
              theme={theme}
              key="rightAnswer"
              type="outline"
              color="green"
              title={addressToString(targetPassage.address, t)}
              onPress={() => {}}
              disabled={levelFinished}
            />,
            <Button
              theme={theme}
              key="wrongAnswer"
              type="outline"
              color="red"
              title={addressToString(selectedAddress, t)}
              onPress={() => {}}
              disabled={levelFinished}
            />,
            <Button
              theme={theme}
              key="nextTest"
              type="main"
              color="green"
              title={t("ButtonContinue")}
              onPress={() => handleErrorSubmit(selectedAddress)}
              disabled={levelFinished}
            />
          ]}
      </View>
      <AddressPicker
        theme={theme}
        visible={APVisible}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
        t={t}
      />
    </ScrollView>
  );
};
