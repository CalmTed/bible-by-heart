import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, PassageModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import addressToString from "../../tools/addressToString";
import { Button } from "../Button";
import { LevelComponentModel } from "./l1";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { getTheme } from "../../tools/getTheme";
import { ERRORS_TO_DOWNGRADE, VIBRATION_PATTERNS } from "../../constants";

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    alignContent: "center",
    flex: 1
  },
  passageText: {
    fontSize: 18,
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    padding: 10
  },
  addressTextView: {
    alignContent: "center",
    justifyContent: "center",
    maxHeight: 200
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
  },
  textTransformNone: {
    textTransform: "none"
  },
  optionsWrapper2: {
    gap: 10
  }
});

export const L20: FC<LevelComponentModel> = ({
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
  const [errorValue, setErrorValue] = useState(null as AddressType | null);

  useEffect(() => {
    resetForm();
  }, [test.id]);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setErrorValue(null);
  };

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
  const handleAddressSelect = (value: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(value);
  };
  const handleAddressCheck = (value: AddressType) => {
    const rightPassage = state.passages.find((p) => p.id === test.passageId);
    if (!rightPassage) {
      return;
    }
    if (JSON.stringify(rightPassage.address) === JSON.stringify(value)) {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testRight);
      }
      submitTest({
        isRight: true,
        modifiedTest: {
          ...test
        }
      }); //adding finish date and isFifish on reducer
    } else {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
      }
      setErrorValue(selectedAddress);
    }
  };
  const handleAddressCancel = () => {
    setAPVisible(false);
  };
  const handleDowngrade = () => {
    dispatch({
      name: ActionName.downgradePassage,
      payload: {
        test: test
      }
    });
  };
  const targetPassage = state.passages.find((p) => p.id === test.passageId);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.isFinished;
  const theme = getTheme(state.settings.theme);
  return (
    <View style={levelComponentStyle.levelComponentView}>
      <ScrollView style={levelComponentStyle.passageTextView}>
        <Text
          style={{
            ...theme.theme.text,
            ...levelComponentStyle.passageText,
            backgroundColor: theme.colors.bgSecond
          }}
        >
          {targetPassage?.verseText}
        </Text>
      </ScrollView>
      <View style={levelComponentStyle.optionButtonsWrapper}>
        {!!errorValue && [
          <Button
            theme={theme}
            key="right"
            title={addressToString(targetPassage.address, t)}
            type="outline"
            color="green"
            onPress={() => {}}
          />,
          <Button
            theme={theme}
            key="wrong"
            title={addressToString(errorValue, t)}
            type="outline"
            color="red"
            onPress={() => {}}
          />,
          <Button
            theme={theme}
            key="continue"
            title={t("ButtonContinue")}
            type="main"
            color={"green"}
            disabled={levelFinished}
            onPress={() => handleErrorSubmit(errorValue)}
          />
        ]}
        {!errorValue && [
          <Button
            theme={theme}
            key="address"
            title={
              selectedAddress
                ? addressToString(selectedAddress, t)
                : t("LevelSelectAddress")
            }
            type="outline"
            color={!errorValue ? "green" : "red"}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished || !!errorValue}
          />,
          <Button
            theme={theme}
            key="submit"
            title={t("Submit")}
            type="main"
            color={selectedAddress ? "green" : "gray"}
            disabled={!selectedAddress || levelFinished}
            onPress={() =>
              selectedAddress ? handleAddressCheck(selectedAddress) : null
            }
          />
        ]}
        {(test.errorNumber || 0) > ERRORS_TO_DOWNGRADE && (
          <Button
            theme={theme}
            key="nextButton"
            type="secondary"
            color="gray"
            title={t("DowngradeLevel")}
            onPress={() => handleDowngrade()}
          />
        )}
      </View>
      <AddressPicker
        theme={theme}
        visible={APVisible}
        onCancel={handleAddressCancel}
        onConfirm={handleAddressSelect}
        t={t}
        />
        
    </View>
  );
};

//start writing text with passage autocomplete
export const L21: FC<LevelComponentModel> = ({
  test,
  state,
  t,
  submitTest,
  dispatch
}) => {
  const [passagesOptions, setPassageOptions] = useState([] as PassageModel[]);
  const [errorValue, setErrorValue] = useState(null as number | null);

  useEffect(() => {
    resetForm();
  }, [test.id]);

  const resetForm = () => {
    setPassageOptions([]);
    setErrorValue(null);
  };

  const handleErrorSubmit = (value: number) => {
    submitTest({
      isRight: false,
      modifiedTest: {
        ...test,
        errorNumber: (test.errorNumber || 0) + 1,
        errorType: "wrongVerseToAddress",
        wrongPassagesId: [...test.wrongPassagesId, value]
      }
    });
    resetForm();
  };
  const handlePassageCheck = (value: number) => {
    const passage = state.passages.find((p) => p.id === test.passageId);
    if (!passage) {
      return;
    }
    if (passage.id === value) {
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
      setErrorValue(value);
    }
  };
  const handleSearchPassages = (value: string) => {
    const options =
      value.length < 2
        ? []
        : state.passages
            .filter((p) =>
              p.verseText.toLowerCase().startsWith(value.toLowerCase())
            )
            .slice(0, 3);
    setPassageOptions(options);
  };

  const handleDowngrade = () => {
    dispatch({
      name: ActionName.downgradePassage,
      payload: {
        test: test
      }
    });
  };
  const targetPassage = state.passages.find((p) => p.id === test.passageId);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.isFinished;
  const theme = getTheme(state.settings.theme);
  return (
    <View style={levelComponentStyle.levelComponentView}>
      <View style={levelComponentStyle.addressTextView}>
        <Text
          style={{
            ...theme.theme.text,
            ...levelComponentStyle.addressText
          }}
        >
          {addressToString(targetPassage.address, t)}
        </Text>
      </View>
      <View style={levelComponentStyle.optionButtonsWrapper}>
        <View style={levelComponentStyle.optionsWrapper2}>
          {/* passages text options */}
          {!errorValue &&
            passagesOptions.map((p) => {
              const passageText =
                p.verseText.length < 50
                  ? p.verseText
                  : p.verseText
                      .trim()
                      .replace(/(.|,)$/g, "")
                      .slice(0, 50) + "...";
              return (
                <Button
                  theme={theme}
                  key={p.id}
                  type="outline"
                  color="green"
                  textStyle={levelComponentStyle.textTransformNone}
                  title={passageText}
                  onPress={() => handlePassageCheck(p.id)}
                  disabled={levelFinished}
                />
              );
            })}
          {/* just right and wrond passages text options */}
          {!!errorValue && [
            state.passages
              .filter((p) => [targetPassage.id, errorValue].includes(p.id))
              .map((p) => {
                const passageText =
                  p.verseText.length < 50
                    ? p.verseText
                    : p.verseText
                        .trim()
                        .replace(/(.|,)$/g, "")
                        .slice(0, 50) + "...";
                return (
                  <Button
                    theme={theme}
                    key={p.id}
                    type="outline"
                    color={p.id === targetPassage.id ? "green" : "red"}
                    textStyle={levelComponentStyle.textTransformNone}
                    title={passageText}
                    onPress={() => {}}
                    disabled={levelFinished}
                  />
                );
              }),
            <Button
              theme={theme}
              key="continue"
              title={t("ButtonContinue")}
              type="main"
              color={"green"}
              disabled={levelFinished}
              onPress={() => handleErrorSubmit(errorValue)}
            />
          ]}
        </View>
        {!errorValue && (
          <Input
            theme={theme}
            placeholder={t("LevelStartWritingPassage")}
            onChange={(value) => handleSearchPassages(value)}
            onSubmit={() => {}}
          />
        )}
        {(test.errorNumber || 0) > ERRORS_TO_DOWNGRADE && (
          <Button
            theme={theme}
            key="nextButton"
            type="secondary"
            color="gray"
            title={t("DowngradeLevel")}
            onPress={() => handleDowngrade()}
          />
        )}
      </View>
    </View>
  );
};
