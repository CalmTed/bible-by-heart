import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, Vibration, ScrollView } from "react-native";
import {
  ERRORS_TO_DOWNGRADE,
  MAX_L50_TRIES,
  VIBRATION_PATTERNS
} from "../../constants";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { SentenceContext } from "./SentenceContext";

// Level 5: type the passage out with no autocomplete, one character at a time,
// then name the address.

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
  submitTest,
  dispatch
}) => {
  const { theme, t } = useAppContext();
  const [APVisible, setAPVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    null as null | AddressType
  );
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  const wholeText = targetPassage?.verseText || "";
  //showAddressOrFirstWords: true => address false => first words
  //the sentences this test asks for; the whole passage when it carries no range
  const targetText = Passage.getRangeText(wholeText, test.d?.sentenceRange);
  const firstFewWords = Passage.getFirstWords(targetText);
  const initialValue = test.d.showAddressOrFirstWords ? "" : firstFewWords;
  const [passageText, setPassageText] = useState(initialValue);
  //a longer stretch to type earns more tries
  const sentancesRangeLength = Passage.getSentences(targetText).length;
  const maxTriesBonus =
    targetPassage && sentancesRangeLength > 2 ? sentancesRangeLength - 2 : 0;
  const [tries, setTries] = useState(MAX_L50_TRIES + maxTriesBonus);
  const lastErrorIsWrongAddress = test.et.length
    ? test.et[test.et.length - 1] === "wrongAddressToVerse"
    : false;
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
        et: [...test.et, "wrongAddressToVerse"],
        wa: [...test.wa, value]
      }
    });
    resetForm();
  };

  const handleAddressSubmit = (value: AddressType) => {
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
    if (simplifyString(passageText) === simplifyString(targetText)) {
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
        const words = targetText.split(" ");
        const userWords = passageText.split(" ");
        const wrongWordIndex =
          words
            .map((w, i) => {
              const iterationtText = words.slice(0, i).join(" ");
              const passageSliced = userWords.slice(0, i).join(" ");
              return (
                simplifyString(iterationtText) === simplifyString(passageSliced)
              );
            })
            .filter((w) => !!w).length - 1; //length is corrisponging to the last word user got right
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
      <SentenceContext
        text={wholeText}
        range={test.d.sentenceRange}
        side="before"
      />
      <View style={levelComponentStyle.passageTextView}>
        <Input
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
      <SentenceContext
        text={wholeText}
        range={test.d.sentenceRange}
        side="after"
      />
      <View style={levelComponentStyle.optionButtonsWrapper}>
        {/* text is not entered */}
        {!isCorrect && (
          <Button
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
            type="main"
            color="green"
            title={`${t("Submit")} ${tries}/${MAX_L50_TRIES + maxTriesBonus}`}
            onPress={() => handleAddressSubmit(targetPassage.address)}
            disabled={levelFinished}
          />
        )}
        {((test.en || 0) > ERRORS_TO_DOWNGRADE ||
          new Date().getTime() - test?.td?.[0]?.[0] > 1000 * 60 * 10) && (
          <Button
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
              key="addresPicker"
              type="outline"
              color="green"
              title={
                selectedAddress
                  ? Address.format(selectedAddress, t)
                  : t("LevelSelectAddress")
              }
              onPress={() => setAPVisible(true)}
              disabled={levelFinished}
            />,
            <Button
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
              key="rightAnswer"
              type="outline"
              color="green"
              title={Address.format(targetPassage.address, t)}
              onPress={() => {}}
              disabled={levelFinished}
            />,
            <Button
              key="wrongAnswer"
              type="outline"
              color="red"
              title={Address.format(selectedAddress, t)}
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
          ]}
      </View>
      <AddressPicker
        visible={APVisible}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
      />
    </ScrollView>
  );
};
