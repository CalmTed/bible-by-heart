import React, { FC, useEffect, useState } from "react";
import { AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { VIBRATION_PATTERNS } from "../../constants";

// Level 1, first half: read the verse, pick its address out of four options.

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
    margin: 20,
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

export const L10: FC<LevelComponentModel> = ({ test, state, submitTest }) => {
  const { theme, t } = useAppContext();
  const [errorValue, setErrorValue] = useState(null as AddressType | null);
  useEffect(() => {
    setErrorValue(null);
  }, [test.i]); //reseting error flag if same level but different test
  const rightPassage = state.passages.filter((p) => p.id === test.pi)[0];
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
    setErrorValue(null);
  };
  const handleOptionSelect = (value: AddressType) => {
    if (!rightPassage) {
      return;
    }
    if (Address.equals(rightPassage.address, value)) {
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
  // A test pointing at a deleted passage renders nothing and says nothing about
  // the answer — TestsScreen's focus-gated effect is what leaves the session
  // (8.2.5). This level used to read `.verseText` off the missing passage and
  // crash into the ErrorBoundary instead (found in 8.2.6).
  if (!rightPassage) {
    return <View />;
  }
  const levelFinished = test.f;
  const verseText = Passage.getRangeDisplayText(
    rightPassage.verseText,
    test.d?.sentenceRange
  );
  return (
    <View style={{ ...levelComponentStyle.levelComponentView }}>
      <ScrollView style={{ ...levelComponentStyle.passageTextView }}>
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
      <View style={{ ...levelComponentStyle.optionButtonsWrapper }}>
        {test.d.addressOptions &&
          test.d.addressOptions.map((op) => {
            if (!errorValue) {
              return (
                <Button
                  key={JSON.stringify(op)}
                  title={Address.format(op, t)}
                  type="outline"
                  color="green"
                  onPress={() => handleOptionSelect(op)}
                  disabled={levelFinished}
                />
              );
            } else {
              //if there is an error
              const isRightAddress = Address.equals(op, rightPassage.address);
              const isErroredAddress = Address.equals(op, errorValue);
              return (
                <Button
                  key={JSON.stringify(op)}
                  title={Address.format(op, t)}
                  type="outline"
                  color={
                    isRightAddress ? "green" : isErroredAddress ? "red" : "gray"
                  }
                  onPress={() => {}}
                  disabled={levelFinished}
                />
              );
            }
          })}
        {!!errorValue && (
          <Button
            title={t("ButtonContinue")}
            type="main"
            color="green"
            onPress={() => handleErrorSubmit(errorValue)}
          />
        )}
      </View>
    </View>
  );
};
