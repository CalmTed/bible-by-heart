import React, { FC, useEffect, useState } from "react";
import { AddressType } from "../../models";
import { View, Text, StyleSheet, Vibration, ScrollView } from "react-native";
import { MAX_L50_TRIES, VIBRATION_PATTERNS } from "../../constants";
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
  }
});

export const L50: FC<LevelComponentModel> = ({
  test,
  state,
  t,
  submitTest
}) => {
  const [APVisible, setAPVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    null as null | AddressType
  );
  const targetPassage = state.passages.find((p) => p.id === test.passageId);
  const lastErrorIsWrongAddress = test.errorType === "wrongAddressToVerse";
  //showAddressOrFirstWords: true if address OR false if just first words
  const initialEnteredText = lastErrorIsWrongAddress
    ? targetPassage?.verseText || ""
    : test.testData.showAddressOrFirstWords
    ? ""
    : (targetPassage?.verseText || "").split(" ").slice(0, 4).join(" ") + " ";
  const [passageText, setPassageText] = useState(initialEnteredText);
  const maxTriesBonus =
    targetPassage && targetPassage.versesNumber > 2
      ? targetPassage.versesNumber - 2
      : 0;
  const [tries, setTries] = useState(MAX_L50_TRIES + maxTriesBonus);
  const [isCorrect, setIsCorrect] = useState(
    lastErrorIsWrongAddress ? true : false
  );
  const [aucompleteWarn, setAucompleteWarn] = useState(false);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setPassageText(initialEnteredText);
    setAucompleteWarn(false);
    setIsCorrect(lastErrorIsWrongAddress ? true : false);
    setTries(MAX_L50_TRIES + maxTriesBonus);
    setWrongAddress(null);
  };

  useEffect(() => {
    resetForm();
  }, [test.id]);

  const handleErrorSubmit = (value: AddressType) => {
    submitTest({
      isRight: false,
      modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongAddressToVerse",
        wrongAddress: [...test.wrongAddress, value]
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
      simplifyString(passageText) === simplifyString(targetPassage.verseText)
    ) {
      setIsCorrect(true);
      if (passageText !== targetPassage.verseText) {
        setPassageText(targetPassage.verseText);
      }
    } else {
      if (tries > 0) {
        setTries((prv) => prv - 1);
        const enteredTextArray = passageText.split("");
        const rightPart = targetPassage.verseText
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
        submitTest({
          isRight: false,
          modifiedTest: {
            ...test,
            errorNumber: (test.errorNumber || 0) + 1,
            errorType: "other"
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
            errorNumber: (test.errorNumber || 0) + 1,
            errorType: "moreThenOneCharacter"
          }
        });
      }
    }
  };

  if (!targetPassage) {
    return <View />;
  }

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
          wrapperStyle={{ width: "100%", height: "100%" }}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "flex-start"
          }}
          autoCorrect={false}
          textStyle={{ fontWeight: "normal" }}
        />
      </View>
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
        {/* text entered but address needed and address not checked as wrong */}
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
