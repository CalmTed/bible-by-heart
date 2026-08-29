import React, { FC, useEffect, useState } from "react";
import { ActionName, LevelComponentModel, PassageModel } from "../../models";
import { View, Text, StyleSheet } from "react-native";
import { Address } from "../../utils/address";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { Input } from "../Input";
import { ERRORS_TO_DOWNGRADE, OPTION_TITLE_MAX_LENGTH } from "../../constants";
import { feedback } from "../../utils/feedback";
import { levelLayout } from "./levelLayout";

// Level 2, second half: read the address, start writing the verse and pick it
// out of what the search turns up.

const levelComponentStyle = StyleSheet.create({
  textTransformNone: {
    textTransform: "none"
  }
});

const getOptionTitle: (verseText: string) => string = (verseText) =>
  verseText.length < OPTION_TITLE_MAX_LENGTH
    ? verseText
    : verseText
        .trim()
        .replace(/(.|,)$/g, "")
        .slice(0, OPTION_TITLE_MAX_LENGTH) + "...";

//start writing text with passage autocomplete
export const L21: FC<LevelComponentModel> = ({
  test,
  state,
  submitTest,
  dispatch
}) => {
  const { theme, t } = useAppContext();
  const [passagesOptions, setPassageOptions] = useState([] as PassageModel[]);
  const [errorValue, setErrorValue] = useState(null as number | null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    resetForm();
  }, [test.i]);

  const resetForm = () => {
    setPassageOptions([]);
    setErrorValue(null);
  };

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
    resetForm();
  };
  const handlePassageCheck = (value: number) => {
    const passage = state.passages.find((p) => p.id === test.pi);
    if (!passage) {
      return;
    }
    if (passage.id === value) {
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
      {/* The options are what the typing turns up, so they sit in the answer
          block and the field that produces them is the action at the bottom -
          under the thumb, right above the keyboard. */}
      <View style={levelLayout.answer}>
        {/* passages text options */}
        {!errorValue &&
          passagesOptions.map((p) => {
            return (
              <Button
                key={p.id}
                type="outline"
                color="green"
                textStyle={levelComponentStyle.textTransformNone}
                title={getOptionTitle(p.verseText)}
                onPress={() => {
                  setSearchText("");
                  handlePassageCheck(p.id);
                }}
                disabled={levelFinished}
              />
            );
          })}
        {/* just right and wrong passages text options */}
        {!!errorValue &&
          state.passages
            .filter((p) => [targetPassage.id, errorValue].includes(p.id))
            .map((p) => {
              return (
                <Button
                  key={p.id}
                  type="outline"
                  color={p.id === targetPassage.id ? "green" : "red"}
                  textStyle={levelComponentStyle.textTransformNone}
                  title={getOptionTitle(p.verseText)}
                  onPress={() => {}}
                  disabled={levelFinished}
                />
              );
            })}
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
          <Input
            placeholder={t("LevelStartWritingPassage")}
            value={searchText}
            onChange={(value) => {
              setSearchText(value);
              handleSearchPassages(value);
            }}
            onSubmit={() => {
              setSearchText("");
            }}
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
    </View>
  );
};
