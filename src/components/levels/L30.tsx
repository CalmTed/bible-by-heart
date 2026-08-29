import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet, ScrollView, Vibration } from "react-native";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { ERRORS_TO_DOWNGRADE, VIBRATION_PATTERNS } from "../../constants";

// Level 3: the verse with words missing — put them back in order, then name
// the address.

const levelComponentStyle = StyleSheet.create({
  levelComponentView: {
    width: "100%",
    flex: 1
  },
  passageTextView: {
    maxHeight: "30%",
    height: "auto",
    borderRadius: 10,
    margin: 10,
    paddingHorizontal: 10
  },
  passageText: {
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10
  },
  fixedWord: {
    paddingHorizontal: 2,
    padding: 2
  },
  variableWord: {
    marginHorizontal: 2,
    margin: 2,
    borderBottomWidth: 2
  },
  hiddenWordText: {
    color: "transparent"
  },
  optionButtonsScrollWrapper: {
    flex: 1,
    width: "100%"
  },
  optionButtonsWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
    gap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10
  },
  optionButtonStyle: {
    padding: 0
  },
  optionButtonTextStyle: {
    fontSize: 16,
    textTransform: "none"
  }
});

export const L30: FC<LevelComponentModel> = ({
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

  const lastErrorIsWrongAddress = test.et.length
    ? test.et[test.et.length - 1] === "wrongAddressToVerse"
    : false;
  const alreadyEnteredUntill =
    test.ww.length > 0 ? [...test.ww].sort((a, b) => b[0] - a[0])[0][0] : null;
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  const missingWords = test.d.missingWords || [];

  const words = targetPassage ? Passage.getWords(targetPassage.verseText) : [];
  const defaultSelectedWords: number[] = lastErrorIsWrongAddress
    ? words.map((w, i) => i)
    : alreadyEnteredUntill
      ? words.map((w, i) => i).slice(0, alreadyEnteredUntill)
      : [];
  const [selectedWords, setSelectedWords] = useState(defaultSelectedWords);
  const [errorIndex, setErrorIndex] = useState(null as number | null);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  useEffect(() => {
    //reset list if same level but different test/passage
    resetForm();
    setSelectedWords(defaultSelectedWords);
  }, [test.i]);

  // A generated l30 test with no missing words has nothing to fill in, so the
  // user would sit on a screen with no way forward; passing it is the safety
  // valve. It used to run DURING RENDER (8.2.5 moved it here) — a render that
  // submits is a render that can navigate, which is exactly the class of bug
  // that made the finish screen get skipped in 2026-07. Note the guard also had
  // to be fixed to mean what it said: `missingWords` is `test.d.missingWords ||
  // []`, so `!missingWords` was never true and the valve had never once opened.
  useEffect(() => {
    if (targetPassage && !missingWords.length) {
      submitTest({ isRight: true, modifiedTest: test });
    }
    // Keyed by the passage's ID, never the object: `state.passages.find(...)`
    // hands back a new object identity every time the app state is replaced, and
    // an identity dep would submit the same unplayable test again on every
    // unrelated state change.
  }, [test.i, targetPassage?.id, missingWords.length]);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setErrorIndex(null);
    setWrongAddress(null);
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
  const handleAdressCheck = (value: AddressType) => {
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
  const handleWordSelect = (
    nextUnselectedIndex: number,
    selectedMissingWord: number
  ) => {
    const neededWord = words[nextUnselectedIndex];
    const selectedWord = words[selectedMissingWord];
    if (state.settings.hapticsEnabled) {
      Vibration.vibrate(VIBRATION_PATTERNS.wordClick);
    }
    if (neededWord && selectedWord === neededWord) {
      setSelectedWords((prv) => [...prv, nextUnselectedIndex]);
    } else {
      if (state.settings.hapticsEnabled) {
        Vibration.vibrate(VIBRATION_PATTERNS.testWrong);
      }
      //handle error
      setErrorIndex(selectedMissingWord);
    }
  };
  const conformWrongWordError: (
    rightIndex: number,
    wrongWord: string
  ) => void = (rightIndex, wrongWord) => {
    resetForm();
    submitTest({
      isRight: false,
      modifiedTest: {
        ...test,
        en: (test.en || 0) + 1,
        et: [...test.et, "wrongWord"],
        ww: [...test.ww, [rightIndex, wrongWord]]
      }
    });
  };
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(address);
  };

  const handleDowngrade = () => {
    dispatch({
      name: ActionName.downgradePassage,
      payload: {
        test: test
      }
    });
  };

  const levelFinished = test.f;
  const nextUnselectedIndex = [...missingWords]
    .sort((a, b) => a - b)
    .filter((mw) => !selectedWords.includes(mw))[0];
  const unselectedWords = missingWords.filter(
    (mwi) => !selectedWords.includes(mwi)
  );

  // A test pointing at a deleted passage renders nothing and says nothing about
  // the answer — TestsScreen's focus-gated effect is what leaves the session.
  // Every other level does exactly this; this one used to submit it as CORRECT.
  if (!targetPassage) {
    return <View />;
  }

  return (
    <View style={levelComponentStyle.levelComponentView}>
      <ScrollView
        style={{
          ...levelComponentStyle.passageTextView,
          backgroundColor: theme.colors.bgSecond
        }}
      >
        <View style={levelComponentStyle.passageText}>
          {words.map((w, i) => {
            return (
              <View
                key={`${w}${i}`}
                style={{
                  ...(missingWords.includes(i)
                    ? {
                        ...levelComponentStyle.variableWord,
                        borderBottomColor: theme.colors.text
                      }
                    : levelComponentStyle.fixedWord),
                  ...(!levelFinished && nextUnselectedIndex === i
                    ? {
                        borderBottomColor: theme.colors.mainColor
                      }
                    : {})
                }}
              >
                <Text
                  style={{
                    ...{
                      color: theme.colors.text,
                      fontSize: 18
                    },
                    ...(levelFinished ||
                    selectedWords.includes(i) ||
                    !missingWords.includes(i)
                      ? {}
                      : levelComponentStyle.hiddenWordText)
                  }}
                >
                  {w}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {/* fi there are some missig words or error with them*/}
      {(!!unselectedWords.length || !!errorIndex) && (
        <ScrollView
          style={{
            ...levelComponentStyle.optionButtonsScrollWrapper
          }}
        >
          <View style={{ ...levelComponentStyle.optionButtonsWrapper }}>
            {
              // if no error and not finished yet
              !errorIndex &&
                !levelFinished &&
                unselectedWords.map((mwi) => {
                  return (
                    <Button
                      type="outline"
                      key={`${words[mwi]}-${mwi}`}
                      title={words[mwi]}
                      onPress={() => handleWordSelect(nextUnselectedIndex, mwi)}
                      style={levelComponentStyle.optionButtonStyle}
                      textStyle={levelComponentStyle.optionButtonTextStyle}
                      disabled={levelFinished}
                    />
                  );
                })
            }
            {
              // if there is an error and not finished yet
              !!errorIndex && [
                ...missingWords
                  //filter for only wrong index and right one
                  .filter(
                    (mwi) => mwi === nextUnselectedIndex || mwi === errorIndex
                  )
                  .map((mwi, i) => {
                    return (
                      <Button
                        type="main"
                        key={`${mwi}-${i}`}
                        title={words[mwi]}
                        onPress={() => {}}
                        style={levelComponentStyle.optionButtonStyle}
                        textStyle={levelComponentStyle.optionButtonTextStyle}
                        color={mwi === nextUnselectedIndex ? "green" : "red"}
                      />
                    );
                  }),
                <Button
                  key="nextButton"
                  type="outline"
                  color="green"
                  title={t("ButtonContinue")}
                  onPress={() =>
                    conformWrongWordError(
                      nextUnselectedIndex,
                      words[errorIndex]
                    )
                  }
                />
              ]
            }
            {(test.en || 0) > ERRORS_TO_DOWNGRADE && (
              <Button
                key="nextButton"
                type="transparent"
                color="gray"
                title={t("DowngradeLevel")}
                onPress={() => handleDowngrade()}
              />
            )}
          </View>
        </ScrollView>
      )}
      {/* if no missing words and no error with them and addres is not wrong */}
      {!unselectedWords.length && !errorIndex && !wrongAddress && (
        <View style={levelComponentStyle.optionButtonsWrapper}>
          <Button
            type="outline"
            color="green"
            title={
              selectedAddress
                ? Address.format(selectedAddress, t)
                : t("LevelSelectAddress")
            }
            onPress={() => setAPVisible(true)}
            disabled={levelFinished}
          />
          <Button
            type="main"
            color="green"
            title={t("Submit")}
            onPress={() =>
              selectedAddress ? handleAdressCheck(selectedAddress) : null
            }
            disabled={!selectedAddress || levelFinished}
          />
          <AddressPicker
            visible={APVisible}
            onCancel={() => setAPVisible(false)}
            onConfirm={handleAddressSelect}
          />
        </View>
      )}
      {/* if no missing words but wrong address */}
      {!unselectedWords.length && !errorIndex && wrongAddress && (
        <View style={levelComponentStyle.optionButtonsWrapper}>
          <Button
            type="outline"
            color="green"
            title={Address.format(targetPassage.address, t)}
            onPress={() => {}}
            disabled={levelFinished}
          />
          <Button
            type="outline"
            color="red"
            title={selectedAddress ? Address.format(selectedAddress, t) : ""}
            onPress={() => {}}
            disabled={levelFinished}
          />
          <Button
            type="main"
            color="green"
            title={t("ButtonContinue")}
            onPress={() => handleErrorSubmit(wrongAddress)}
            disabled={levelFinished}
          />
          <AddressPicker
            visible={APVisible}
            onCancel={() => setAPVisible(false)}
            onConfirm={handleAddressSelect}
          />
        </View>
      )}
    </View>
  );
};
