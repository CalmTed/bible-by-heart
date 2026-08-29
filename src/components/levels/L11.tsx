import React, { FC, useEffect, useState } from "react";
import { LevelComponentModel } from "../../models";
import { View, Text, StyleSheet } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { NoOptions } from "./NoOptions";
import { useAppContext } from "../../context/AppContext";
import {
  MINIMUM_SENTENCE_LENGTH,
  OPTION_TITLE_MAX_LENGTH
} from "../../constants";
import { feedback } from "../../utils/feedback";
import { levelLayout } from "./levelLayout";

// Level 1, second half: read the address, pick the verse out of the options.

const levelComponentStyle = StyleSheet.create({
  textTransformNone: {
    textTransform: "none"
  }
});

// Every option shows the SAME sentence range, but the options are different
// passages — so a range that runs past a shorter option is pulled back to what
// that option has, and a slice too short to be a fair question is dropped in
// favour of the whole verse.
const getOptionTitle: (verseText: string, range?: number[]) => string = (
  verseText,
  range
) => {
  const sentences = Passage.getSentences(verseText);
  const rangeStart = range
    ? sentences.length > range[0]
      ? range[0]
      : sentences.length > 1 && range[0] > 0
        ? 1
        : 0
    : 0;
  const rangeEnd = range
    ? sentences.length >= range[1]
      ? range[1]
      : sentences.length
    : sentences.length;
  const sliced = Passage.joinSentences(sentences.slice(rangeStart, rangeEnd));
  const slicedTitle =
    sliced.length > MINIMUM_SENTENCE_LENGTH
      ? `${rangeStart ? "..." : ""}${sliced}${rangeEnd !== sentences.length ? "..." : ""}`
      : verseText;
  return slicedTitle.length < OPTION_TITLE_MAX_LENGTH
    ? slicedTitle
    : slicedTitle
        .slice(0, OPTION_TITLE_MAX_LENGTH)
        .trim()
        .replace(/(.|,)$/, "") + "...";
};

export const L11: FC<LevelComponentModel> = ({ test, state, submitTest }) => {
  const { theme, t } = useAppContext();
  const [errorValue, setErrorValue] = useState(null as number | null);
  useEffect(() => {
    setErrorValue(null);
  }, [test.i]); //reseting error flag if same level but different test

  const handleErrorSubmit = (value: number) => {
    submitTest({
      isRight: false,
      modifiedTest: {
        ...test,
        en: (test.en || 0) + 1,
        et: [...test.et, "wrongVerseToAddress"],
        wp: [...test.wp, value]
      }
    });
    setErrorValue(null);
  };
  const handleOptionsSelect = (value: number) => {
    const targetPassage = state.passages.find((p) => p.id === test.pi);
    if (!targetPassage) {
      return;
    }
    if (targetPassage.id === value) {
      feedback(state.settings, "testRight");
      submitTest({
        isRight: true,
        modifiedTest: {
          ...test
        }
      });
    } else {
      feedback(state.settings, "testWrong");
      setErrorValue(value);
    }
  };
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.f;
  return (
    <View style={levelLayout.screen}>
      <View style={levelLayout.promptContent}>
        <Text
          style={{
            ...theme.theme.text,
            ...levelLayout.addressText
          }}
        >
          {Address.format(targetPassage.address, t)}
        </Text>
      </View>
      <View style={levelLayout.answer}>
        {!test.d.passagesOptions?.length && <NoOptions />}
        {test.d.passagesOptions &&
          test.d.passagesOptions.map((op) => {
            const limitedTitle = getOptionTitle(
              op.verseText,
              test.d?.sentenceRange
            );
            if (!errorValue) {
              return (
                <Button
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
      </View>
      <View style={levelLayout.action}>
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
