import React, { FC, useEffect, useState } from "react";
import { WORD } from "../../l10n";
import {
  ActionModel,
  AddressType,
  AppStateModel,
  TestModel
} from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import addressToString from "../../tools/addressToString";
import { Button } from "../Button";
import { getTheme } from "../../tools/getTheme";
import { MINIMUM_SENTENCE_LENGTH, SENTENCE_SEPARATOR, VIBRATION_PATTERNS } from "../../constants";

export interface LevelComponentModel {
  test: TestModel;
  state: AppStateModel;
  t: (w: WORD) => string;
  submitTest: (data: { isRight: boolean; modifiedTest: TestModel }) => void;
  dispatch: (action: ActionModel) => void;
}

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
  }
});

export const L10: FC<LevelComponentModel> = ({
  test,
  state,
  t,
  submitTest
}) => {
  const [errorValue, setErrorValue] = useState(null as AddressType | null);
  useEffect(() => {
    setErrorValue(null);
  }, [test.id]); //reseting error flag if same level but different test
  const rightPassage = state.passages.filter((p) => p.id === test.passageId)[0];
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
    setErrorValue(null);
  };
  const handleOptionSelect = (value: AddressType) => {
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
      });
    } else {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
      }
      setErrorValue(value);
    }
  };
  const levelFinished = test.isFinished;
  const theme = getTheme(state.settings.theme);
  const sentences = rightPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length);
  const slicingStart = test.testData?.sentenceRange?.[0] || 0;
  const slicingEnd = test.testData?.sentenceRange?.[1] || sentences.length;
  const slicedPassageText = `${slicingStart === 0 ? "" : "..."}${sentences.slice(slicingStart, slicingEnd).join().trim()}${slicingEnd === sentences.length ? "" : "..."}`
  const verseText = test.testData?.sentenceRange?.length ? slicedPassageText : rightPassage.verseText
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
        {test.testData.addressOptions &&
          test.testData.addressOptions.map((op) => {
            if (!errorValue) {
              return (
                <Button
                  theme={theme}
                  key={JSON.stringify(op)}
                  title={addressToString(op, t)}
                  type="outline"
                  color="green"
                  onPress={() => handleOptionSelect(op)}
                  disabled={levelFinished}
                />
              );
            } else {
              //if there is an error
              const rightPassage = state.passages.find(
                (p) => p.id === test.passageId
              );
              if (!rightPassage) {
                return <></>;
              }
              const isRightAddress =
                JSON.stringify(op) === JSON.stringify(rightPassage.address);
              const isErroredAddress =
                JSON.stringify(op) === JSON.stringify(errorValue);
              return (
                <Button
                  theme={theme}
                  key={JSON.stringify(op)}
                  title={addressToString(op, t)}
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
            theme={theme}
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

export const L11: FC<LevelComponentModel> = ({
  test,
  state,
  t,
  submitTest
}) => {
  const [errorValue, setErrorValue] = useState(null as number | null);
  useEffect(() => {
    setErrorValue(null);
  }, [test.id]); //reseting error flag if same level but different test

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
    setErrorValue(null);
  };
  const handleOptionsSelect = (value: number) => {
    const targetPassage = state.passages.find((p) => p.id === test.passageId);
    if (!targetPassage) {
      return;
    }
    if (targetPassage.id === value) {
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
  const targetPassage = state.passages.find((p) => p.id === test.passageId);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.isFinished;
  const theme = getTheme(state.settings.theme);
  return (
    <View style={{ ...levelComponentStyle.levelComponentView }}>
      <View style={{ ...levelComponentStyle.addressTextView }}>
        <Text
          style={{
            ...theme.theme.text,
            ...levelComponentStyle.addressText
          }}
        >
          {addressToString(targetPassage.address, t)}
        </Text>
      </View>
      <View style={{ ...levelComponentStyle.optionButtonsWrapper }}>
        {test.testData.passagesOptions &&
          test.testData.passagesOptions.map((op) => {
            const sentences = op.verseText.split(SENTENCE_SEPARATOR);
            //has max or last
            //has min or last-1
            //joined range is more then MIN_SENTENCE
            //else show full
            const rangeStart = test.testData?.sentenceRange
            ? sentences.length > test.testData.sentenceRange[0] 
              ? test.testData.sentenceRange[0]
              : sentences.length > 1 && test.testData.sentenceRange[0] > 0
                ? 1
                : 0
            : 0;
            const rangeEnd = test.testData?.sentenceRange 
            ? sentences.length >= test.testData.sentenceRange[1] 
            ? test.testData.sentenceRange[1]
            : sentences.length
            : sentences.length;
            const slicedTitle = sentences.slice(rangeStart, rangeEnd).join().length > MINIMUM_SENTENCE_LENGTH
              ? `${rangeStart ? "..." : ""}${sentences.slice(rangeStart, rangeEnd).join().trim()}${rangeEnd != sentences.length ? "..." : ""}`
              : op.verseText;
            const limitedTitle =
              slicedTitle.length < 50
                ? slicedTitle
                : slicedTitle
                    .slice(0, 50)
                    .trim()
                    .replace(/(.|,)$/, "") + "...";
            if (!errorValue) {
              return (
                <Button
                  theme={theme}
                  key={op.id}
                  title={limitedTitle}
                  type="outline"
                  color="green"
                  textStyle={levelComponentStyle.textTransformNone}
                  onPress={() => handleOptionsSelect(op.id)}
                  disabled={levelFinished}
                />
              );
            } else {
              const isRight = targetPassage.id === op.id;
              const isWrong = errorValue === op.id;
              return (
                <Button
                  theme={theme}
                  key={op.id}
                  title={limitedTitle}
                  type="outline"
                  color={isRight ? "green" : isWrong ? "red" : "gray"}
                  textStyle={levelComponentStyle.textTransformNone}
                  onPress={() => {}}
                  disabled={levelFinished}
                />
              );
            }
          })}
        {!!errorValue && (
          <Button
            theme={theme}
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
