import React, { FC, useEffect, useState } from "react";
import { ActionName, LevelComponentModel, PassageModel } from "../../models";
import { View, Text, StyleSheet, Vibration } from "react-native";
import { Address } from "../../utils/address";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { Input } from "../Input";
import {
  ERRORS_TO_DOWNGRADE,
  OPTION_TITLE_MAX_LENGTH,
  VIBRATION_PATTERNS
} from "../../constants";

// Level 2, second half: read the address, start writing the verse and pick it
// out of what the search turns up.

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
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
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  if (!targetPassage) {
    return <View />;
  }
  const levelFinished = test.f;
  return (
    <View style={levelComponentStyle.levelComponentView}>
      <View style={levelComponentStyle.addressTextView}>
        <Text
          style={{
            ...theme.theme.text,
            ...levelComponentStyle.addressText
          }}
        >
          {Address.format(targetPassage.address, t)}
        </Text>
      </View>
      <View style={levelComponentStyle.optionButtonsWrapper}>
        <View style={levelComponentStyle.optionsWrapper2}>
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
          {!!errorValue && [
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
              }),
            <Button
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
