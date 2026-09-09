import React, { FC, useEffect, useState } from "react";
import { ActionName, AddressType, LevelComponentModel } from "../../models";
import { View, Text, StyleSheet } from "react-native";
import { ERRORS_TO_DOWNGRADE, MAX_L50_TRIES } from "../../constants";
import { Address } from "../../utils/address";
import { Passage } from "../../utils/passage";
import { Button } from "../Button";
import { useAppContext } from "../../context/AppContext";
import { AddressPicker } from "../AddressPicker";
import { Input } from "../Input";
import { SentenceContext } from "./SentenceContext";
import { feedback } from "../../utils/feedback";
import { levelLayout } from "./levelLayout";

// Level 5: type the passage out with no autocomplete, one character at a time,
// then name the address.

const levelComponentStyle = StyleSheet.create({
  inputSubtext: {
    textAlign: "center",
    fontSize: 12
  },
  inputStyle: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start"
  },
  inputTextStyle: {
    fontWeight: "normal",
    flex: 1,
    textAlignVertical: "top"
  },
  inputWrapperStyle: {
    width: "100%",
    flex: 1
  }
});

export const L50: FC<LevelComponentModel> = ({
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
  const targetPassage = state.passages.find((p) => p.id === test.pi);
  const wholeText = targetPassage?.verseText || "";
  //showAddressOrFirstWords: true => address false => first words
  //the sentences this test asks for; the whole passage when it carries no range
  const targetText = Passage.getRangeText(wholeText, test.d?.sentenceRange);
  const firstFewWords = Passage.getFirstWords(targetText);
  const initialValue = test.d.showAddressOrFirstWords ? "" : firstFewWords;
  const [passageText, setPassageText] = useState(initialValue);
  //a longer stretch to type earns more tries
  const sentancesRangeLength = Passage.getSentences(targetText).length;
  const maxTriesBonus =
    targetPassage && sentancesRangeLength > 2 ? sentancesRangeLength - 2 : 0;
  const [tries, setTries] = useState(MAX_L50_TRIES + maxTriesBonus);
  const lastErrorIsWrongAddress = test.et.length
    ? test.et[test.et.length - 1] === "wrongAddressToVerse"
    : false;
  const [isCorrect, setIsCorrect] = useState(
    lastErrorIsWrongAddress ? true : false
  );
  const [aucompleteWarn, setAucompleteWarn] = useState(false);
  const [wrongAddress, setWrongAddress] = useState(null as AddressType | null);

  const resetForm = () => {
    setAPVisible(false);
    setSelectedAddress(null);
    setPassageText(initialValue);
    setAucompleteWarn(false);
    setIsCorrect(lastErrorIsWrongAddress ? true : false);
    setTries(MAX_L50_TRIES + maxTriesBonus);
    setWrongAddress(null);
  };

  useEffect(() => {
    resetForm();
  }, [test.i]);

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

  const handleAddressSubmit = (value: AddressType) => {
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
  const handleAddressSelect = (address: AddressType) => {
    setAPVisible(false);
    setSelectedAddress(address);
  };
  const handleTextSubmit = () => {
    if (!targetPassage) {
      return;
    }
    // The comparison forgives characters the keyboard cannot make - the curly
    // apostrophe, the em dash, the Cyrillic "i" - because a passage stored with
    // one of those is otherwise unlearnable at this level, and rewriting the
    // user's own text to fix that is not ours to do. The tolerance is
    // `Passage`'s, not this file's: the old private `simplifyString` here knew
    // about eight ASCII marks and nothing else.
    if (Passage.typedEquals(passageText, targetText)) {
      setIsCorrect(true);
      if (passageText !== targetText) {
        setPassageText(targetText);
      }
    } else {
      if (tries > 0) {
        setTries((prv) => prv - 1);
        // What the user got right, plus the one character they got wrong - the
        // shape the filter this replaced produced, kept deliberately: the next
        // character IS the hint. Rebuilt from `targetText`, so the text handed
        // back always carries the passage's own characters.
        const rightLength = Passage.typedPrefixLength(passageText, targetText);
        setPassageText(rightLength ? targetText.slice(0, rightLength + 1) : "");
      } else {
        feedback(state.settings, "testWrong");
        const words = targetText.split(" ");
        const userWords = passageText.split(" ");
        const wrongWordIndex =
          words
            .map((w, i) => {
              const iterationtText = words.slice(0, i).join(" ");
              const passageSliced = userWords.slice(0, i).join(" ");
              return Passage.typedEquals(passageSliced, iterationtText);
            })
            .filter((w) => !!w).length - 1; //length is corrisponging to the last word user got right
        submitTest({
          isRight: false,
          modifiedTest: {
            ...test,
            en: (test.en || 0) + 1,
            et: [...test.et, "wrongWord"],
            ww: [...test.ww, [wrongWordIndex, userWords[wrongWordIndex]]]
          }
        });
        resetForm();
      }
    }
  };

  const handleTextChange = (text: string) => {
    if (Math.abs(text.length - passageText.length) === 1) {
      setPassageText(text);
    } else {
      //set warning for autocompliting
      //then set an error
      if (!aucompleteWarn) {
        setAucompleteWarn(true);
      } else {
        feedback(state.settings, "testWrong");
        submitTest({
          isRight: false,
          modifiedTest: {
            ...test,
            en: (test.en || 0) + 1,
            et: [...test.et, "moreThenOneCharacter"]
          }
        });
      }
    }
  };

  const handleDowngrade = () => {
    dispatch({
      name: ActionName.downgradePassage,
      payload: {
        test: test
      }
    });
  };
  if (!targetPassage) {
    return <View />;
  }

  const levelFinished = test.f;
  const isAddressProvided = test.d.showAddressOrFirstWords;
  return (
    <View style={levelLayout.screen}>
      <View style={levelLayout.promptContent}>
        <Text
          style={{
            ...levelLayout.addressText,
            color: theme.colors.text
          }}
        >
          {isAddressProvided
            ? Address.format(targetPassage.address, t)
            : t("FinishPassageL5")}
        </Text>
        {!!aucompleteWarn && (
          <Text
            style={{
              ...levelComponentStyle.inputSubtext,
              color: theme.colors.textDanger
            }}
          >
            {t("LevelL50Warning")}
          </Text>
        )}
      </View>
      {/* The typing IS the answer, so the input takes everything the address
          left - it used to sit in a 200px band with the bottom half empty. */}
      <View style={levelLayout.answer}>
        <SentenceContext
          text={wholeText}
          range={test.d.sentenceRange}
          side="before"
        />
        <Input
          multiline
          grow
          disabled={levelFinished || !!wrongAddress}
          value={passageText}
          placeholder={t("LevelWritePassageText")}
          onSubmit={() => {}}
          color={isCorrect ? "green" : "gray"}
          onChange={handleTextChange}
          wrapperStyle={levelComponentStyle.inputWrapperStyle}
          style={levelComponentStyle.inputStyle}
          autoCorrect={false}
          textStyle={levelComponentStyle.inputTextStyle}
        />
        <SentenceContext
          text={wholeText}
          range={test.d.sentenceRange}
          side="after"
        />
      </View>
      <View style={levelLayout.action}>
        {/* text is not entered */}
        {!isCorrect && (
          <Button
            type="main"
            color="green"
            title={`${t("CheckText")} (${tries}/${
              MAX_L50_TRIES + maxTriesBonus
            })`}
            onPress={() => handleTextSubmit()}
            disabled={levelFinished}
          />
        )}
        {/* text entered and no address needed */}
        {isCorrect && isAddressProvided && (
          <Button
            type="main"
            color="green"
            title={`${t("Submit")} ${tries}/${MAX_L50_TRIES + maxTriesBonus}`}
            onPress={() => handleAddressSubmit(targetPassage.address)}
            disabled={levelFinished}
          />
        )}
        {((test.en || 0) > ERRORS_TO_DOWNGRADE ||
          new Date().getTime() - test?.td?.[0]?.[0] > 1000 * 60 * 10) && (
          <Button
            type="secondary"
            color="gray"
            title={`${t("DowngradeLevel")}`}
            onPress={() => handleDowngrade()}
            disabled={levelFinished}
          />
        )}
        {/* text entered but address needed and address has not been checked */}
        {isCorrect &&
          !isAddressProvided &&
          !wrongAddress && [
            <Button
              key="addresPicker"
              type="outline"
              color="green"
              title={
                selectedAddress
                  ? Address.format(selectedAddress, t)
                  : t("LevelSelectAddress")
              }
              onPress={() => setAPVisible(true)}
              disabled={levelFinished}
            />,
            <Button
              key="submitButton"
              type="main"
              color="green"
              title={t("Submit")}
              onPress={() =>
                selectedAddress ? handleAddressSubmit(selectedAddress) : {}
              }
              disabled={!selectedAddress || levelFinished}
            />
          ]}
        {/* text entered but address checked and wrong */}
        {isCorrect &&
          !isAddressProvided &&
          selectedAddress &&
          wrongAddress && [
            <Button
              key="rightAnswer"
              type="outline"
              color="green"
              title={Address.format(targetPassage.address, t)}
              onPress={() => {}}
              disabled={levelFinished}
            />,
            <Button
              key="wrongAnswer"
              type="outline"
              color="red"
              title={Address.format(selectedAddress, t)}
              onPress={() => {}}
              disabled={levelFinished}
            />,
            <Button
              key="nextTest"
              type="main"
              color="green"
              title={t("ButtonContinue")}
              onPress={() => handleErrorSubmit(selectedAddress)}
              disabled={levelFinished}
            />
          ]}
      </View>
      <AddressPicker
        confirmTitle="Submit"
        visible={APVisible}
        translationId={targetPassage.verseTranslation}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddressSelect}
      />
    </View>
  );
};
