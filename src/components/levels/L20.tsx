import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { ERRORS_TO_DOWNGRADE } from "../../constants";
import { feedback } from "../../utils/feedback";
import { levelLayout } from "./levelLayout";

// Level 2, first half: read the verse, name its address in the picker.

const levelComponentStyle = StyleSheet.create({
  verseCard: {
    ...levelLayout.promptCard,
    ...levelLayout.verseText
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
      feedback(state.settings, "testRight");
      submitTest({
        isRight: true,
        modifiedTest: test
      }); //adding finish date and isFifish on reducer
    } else {
      feedback(state.settings, "testWrong");
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
    <View style={levelLayout.screen}>
      <ScrollView
        style={levelLayout.prompt}
        contentContainerStyle={levelLayout.promptContent}
      >
        <Text
          style={{
            ...theme.theme.text,
            ...levelComponentStyle.verseCard,
            backgroundColor: theme.colors.bgSecond
          }}
        >
          {verseText}
        </Text>
      </ScrollView>
      {/* The answer is the address the user picks; the two coloured addresses
          after a wrong one are the same answer, marked. */}
      <View style={levelLayout.answer}>
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
          />
        ]}
        {!errorValue && (
          <Button
            key="address"
            title={
              selectedAddress
                ? Address.format(selectedAddress, t)
                : t("LevelSelectAddress")
            }
            type="outline"
            color="green"
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />
        )}
      </View>
      <View style={levelLayout.action}>
        {!!errorValue && (
          <Button
            key="continue"
            title={t("ButtonContinue")}
            type="main"
            color={"green"}
            disabled={levelFinished}
            onPress={() => handleErrorSubmit(errorValue)}
          />
        )}
        {!errorValue && (
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
        )}
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
        confirmTitle="Submit"
        visible={APVisible}
        onCancel={handleAddressCancel}
        onConfirm={handleAddressSelect}
      />
    </View>
  );
};
