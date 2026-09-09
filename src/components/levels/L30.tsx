import React, { FC, useEffect, useMemo, useState } from "react";
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

// Level 3: the verse with words missing — put them back in order, then name
// the address.

// A word that has been taken out of the verse is not RENDERED and then hidden,
// it is never rendered at all: its slot holds this many non-breaking spaces
// instead. Drawing the real word in a transparent colour kept the answer one
// style override away from being readable — and the override kept happening,
// because "is this word still missing" is answered from component state that
// the next test can arrive before. Text that is not in the tree cannot be read
// however the styles resolve, and it is not copyable or announced either.
const BLANK = "\u00A0";
const blankFor = (word: string) => BLANK.repeat(word.length);

// The verse card, so a test can ask what the passage block actually shows
// rather than searching the whole screen — the word bank below it renders the
// missing words too, on purpose.
export const L30_VERSE_TEST_ID = "l30Verse";

const levelComponentStyle = StyleSheet.create({
  // the verse card is the prompt block's card, laid out as wrapping words
  verseCard: {
    ...levelLayout.promptCard,
    alignContent: "center",
    letterSpacing: 0.3,
    flexDirection: "row",
    flexWrap: "wrap"
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
  // One style object for every word in the verse rather than a fresh literal
  // per word per render: a long passage is a couple of hundred of them, on the
  // screen the app spends its time on.
  const verseWordStyle = useMemo(
    () => ({ color: theme.colors.text, fontSize: 18 }),
    [theme.colors.text]
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
  // Which words are already back in the verse. `TestsScreen` mounts a level
  // component under the test's own id, so this starts from THIS test every time
  // — a session moving from one level-3 test to the next remounts rather than
  // handing new props to the instance that still holds the last answer sheet.
  const [selectedWords, setSelectedWords] = useState(defaultSelectedWords);
  // The index of the word the user tapped by mistake. `null` is "no error" -
  // NEVER a falsy check, because word 0 is a word the user can get wrong and
  // `!errorIndex` silently swallowed that whole case.
  const [errorIndex, setErrorIndex] = useState(null as number | null);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  // A generated l30 test with no missing words has nothing to fill in, so the
  // user would sit on a screen with no way forward; passing it is the safety
  // valve. It used to run DURING RENDER — a render that submits
  // is a render that can navigate, which is exactly the class of bug that made
  // the finish screen get skipped once. Note the guard also had to be
  // fixed to mean what it said: `missingWords` is `test.d.missingWords || []`,
  // so `!missingWords` was never true and the valve had never once opened.
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
      feedback(state.settings, "testRight");
      submitTest({
        isRight: true,
        modifiedTest: {
          ...test
        }
      });
    } else {
      feedback(state.settings, "testWrong");
      setWrongAddress(value);
    }
  };
  const handleWordSelect = (
    nextUnselectedIndex: number,
    selectedMissingWord: number
  ) => {
    const neededWord = words[nextUnselectedIndex];
    const selectedWord = words[selectedMissingWord];
    feedback(state.settings, "wordClick");
    if (neededWord && Passage.sameWord(selectedWord, neededWord)) {
      setSelectedWords((prv) => [...prv, nextUnselectedIndex]);
    } else {
      feedback(state.settings, "testWrong");
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
    <View style={levelLayout.screen}>
      <ScrollView
        style={levelLayout.prompt}
        contentContainerStyle={levelLayout.promptContent}
      >
        <View
          testID={L30_VERSE_TEST_ID}
          style={{
            ...levelComponentStyle.verseCard,
            backgroundColor: theme.colors.bgSecond
          }}
        >
          {words.map((w, i) => {
            const isTakenOut = missingWords.includes(i);
            // Shown when it was never taken out, when the user has put it back,
            // and when the test is being looked at after the fact.
            const isReadable =
              levelFinished || !isTakenOut || selectedWords.includes(i);
            return (
              <View
                key={`${w}${i}`}
                style={{
                  ...(isTakenOut
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
                <Text style={verseWordStyle}>
                  {isReadable ? w : blankFor(w)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {/* fi there are some missig words or error with them*/}
      {(!!unselectedWords.length || errorIndex !== null) && (
        <ScrollView style={levelLayout.answerScroll}>
          <View style={levelLayout.answerScrollContent}>
            {
              // if no error and not finished yet
              errorIndex === null &&
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
              errorIndex !== null && [
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
      {!unselectedWords.length && errorIndex === null && !wrongAddress && (
        <View style={levelLayout.action}>
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
            confirmTitle="Submit"
            visible={APVisible}
            translationId={targetPassage.verseTranslation}
            onCancel={() => setAPVisible(false)}
            onConfirm={handleAddressSelect}
          />
        </View>
      )}
      {/* if no missing words but wrong address */}
      {!unselectedWords.length && errorIndex === null && wrongAddress && (
        <View style={levelLayout.action}>
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
            confirmTitle="Submit"
            visible={APVisible}
            translationId={targetPassage.verseTranslation}
            onCancel={() => setAPVisible(false)}
            onConfirm={handleAddressSelect}
          />
        </View>
      )}
    </View>
  );
};
