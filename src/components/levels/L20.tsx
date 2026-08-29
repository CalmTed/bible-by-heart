import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { ERRORS_TO_DOWNGRADE, VIBRATION_PATTERNS } from "../../constants";

// Level 2, first half: read the verse, name its address in the picker.

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
  optionButtonsWrapper: {
    flex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20
  }
});

export const L20: FC<LevelComponentModel> = ({
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
  const [errorValue, setErrorValue] = useState(null as AddressType | null);

  useEffect(() => {
    resetForm();
  }, [test.i]);

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
        en: (test.en || 0) + 1,
        et: [...test.et, "wrongAddressToVerse"],
        wa: [...test.wa, value]
      }
    });
    resetForm();
  };
  const handleAddressSelect = (value: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(value);
  };
  const handleAddressCheck = (value: AddressType) => {
    const rightPassage = state.passages.find((p) => p.id === test.pi);
    if (!rightPassage) {
      return;
    }
    if (Address.equals(rightPassage.address, value)) {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testRight);
      }
      submitTest({
        isRight: true,
        modifiedTest: test
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
      payload: { test }
    });
  };
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.f;
  const verseText = Passage.getRangeDisplayText(
    targetPassage.verseText,
    test.d?.sentenceRange
  );
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
          {verseText}
        </Text>
      </ScrollView>
      <View style={levelComponentStyle.optionButtonsWrapper}>
        {!!errorValue && [
          <Button
            key="right"
            title={Address.format(targetPassage.address, t)}
            type="outline"
            color="green"
            onPress={() => {}}
          />,
          <Button
            key="wrong"
            title={Address.format(errorValue, t)}
            type="outline"
            color="red"
            onPress={() => {}}
          />,
          <Button
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
            key="address"
            title={
              selectedAddress
                ? Address.format(selectedAddress, t)
                : t("LevelSelectAddress")
            }
            type="outline"
            color={!errorValue ? "green" : "red"}
            onPress={() => setAPVisible(true)}
            disabled={levelFinished || !!errorValue}
          />,
          <Button
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
        {(test.en || 0) > ERRORS_TO_DOWNGRADE && (
          <Button
            key="nextButton"
            type="secondary"
            color="gray"
            title={t("DowngradeLevel")}
            onPress={() => handleDowngrade()}
          />
        )}
      </View>
      <AddressPicker
        visible={APVisible}
        onCancel={handleAddressCancel}
        onConfirm={handleAddressSelect}
      />
    </View>
  );
};
