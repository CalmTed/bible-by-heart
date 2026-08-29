import React, { FC, useMemo, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import {
  PERFECT_TESTS_TO_PROCEED,
  PASSAGELEVEL,
  TESTLEVEL
} from "../constants";
import { AppStateModel, PassageModel } from "../models";
import { MiniModal } from "./MiniModal";
import { Button } from "./Button";
import { getPerfectTestsNumber } from "../utils/getPerfectTests";
import { DotIndicator } from "./DotIndicator";
import { useAppContext } from "../context/AppContext";

interface LevelPickerModel {
  targetPassage: PassageModel;
  handleChange: (level: PASSAGELEVEL, passageId: number) => void;
  handleOpen: (passageId: number) => void;
  state: AppStateModel;
  testLevel?: TESTLEVEL;
  handleRestart?: () => void;
}

export const LevelPicker: FC<LevelPickerModel> = ({
  targetPassage,
  handleChange,
  handleOpen,
  state,
  testLevel,
  handleRestart
}) => {
  const { theme, t } = useAppContext();
  const [levelPickerShown, setLevelPickerShown] = useState(false);
  // One call per render, not one per branch that might render (8.2.21): it
  // walks the whole history for this passage.
  const perfectTestsNumber = useMemo(
    () => getPerfectTestsNumber(state.testsHistory, targetPassage),
    [state.testsHistory, targetPassage]
  );
  const closeLevelPicker = () => {
    setLevelPickerShown(false);
  };
  const passageLevelFromTestLevel =
    (parseInt(
      testLevel?.toString().substring(0, 1) as string,
      10
    ) as PASSAGELEVEL) || NaN;
  const handleLabelPress = () => {
    if (!isNaN(passageLevelFromTestLevel)) {
      // return;
    }
    setLevelPickerShown(true);
    handleOpen(targetPassage.id);
  };
  const levelPickerStyles = StyleSheet.create({
    levelPickerView: {
      justifyContent: "flex-start"
    },
    headerText: {
      color: theme.colors.text,
      textTransform: "uppercase",
      fontWeight: "500",
      fontSize: 22
    },
    subText: {
      textAlign: "center",
      color: theme.colors.textSecond,
      fontSize: 16
    },
    buttonsView: {
      marginTop: 50,
      marginBottom: 20,
      flexDirection: "row",
      gap: 5
    },
    buttonStyle: {
      margin: 0
    },
    levelPickerWrapper: {
      flexDirection: "row",
      justifyContent: "center"
    }
  });
  return (
    <View style={{ ...levelPickerStyles.levelPickerView }}>
      <View style={{ ...levelPickerStyles.levelPickerWrapper }}>
        <Button
          title={`${t("Level")} ${
            isNaN(passageLevelFromTestLevel)
              ? targetPassage.selectedLevel
              : passageLevelFromTestLevel === targetPassage.selectedLevel
                ? passageLevelFromTestLevel
                : passageLevelFromTestLevel //+ " ("+targetPassage.selectedLevel+")"
          }`}
          // icon={IconName.selectArrow}
          onPress={handleLabelPress}
        />
        {targetPassage.isNewLevelAwalible && <DotIndicator />}
      </View>
      <MiniModal
        shown={levelPickerShown}
        handleClose={() => setLevelPickerShown(false)}
      >
        <Text style={levelPickerStyles.headerText}>
          {t("LevelPickerHeading")}
        </Text>
        <View style={levelPickerStyles.buttonsView}>
          {[
            PASSAGELEVEL.l1,
            PASSAGELEVEL.l2,
            PASSAGELEVEL.l3,
            PASSAGELEVEL.l4,
            PASSAGELEVEL.l5
          ].map((n) => {
            const color = targetPassage.selectedLevel === n ? "green" : "gray";
            const disabled = n > targetPassage.maxLevel; //&& !state.settings.devMode;
            return (
              <Button
                type={disabled ? "secondary" : "outline"}
                color={color}
                style={levelPickerStyles.buttonStyle}
                textStyle={{ ...(disabled ? { opacity: 0.5 } : {}) }}
                key={n}
                title={n.toString()}
                onPress={() => handleChange(n, targetPassage.id)}
                disabled={disabled}
              />
            );
          })}
        </View>
        {!testLevel && targetPassage.maxLevel !== PASSAGELEVEL.l5 && (
          <Text style={levelPickerStyles.subText}>
            {t("LevelPickerSubtext")} ({perfectTestsNumber}/
            {PERFECT_TESTS_TO_PROCEED})
          </Text>
        )}
        {!testLevel && targetPassage.maxLevel === PASSAGELEVEL.l5 && (
          <Text style={levelPickerStyles.subText}>
            {t("LevelPickerSubtextL5")} ({perfectTestsNumber})
          </Text>
        )}
        {testLevel &&
          targetPassage.selectedLevel.toString() ===
            testLevel.toString().slice(0, 1) &&
          targetPassage.selectedLevel === targetPassage.maxLevel &&
          targetPassage.selectedLevel !== PASSAGELEVEL.l5 && (
            <Text style={levelPickerStyles.subText}>
              {t("LevelPickerSubtext")} ({perfectTestsNumber}/
              {PERFECT_TESTS_TO_PROCEED})
            </Text>
          )}
        {testLevel &&
          isNaN(passageLevelFromTestLevel) &&
          targetPassage.selectedLevel.toString() !==
            testLevel.toString().slice(0, 1) && (
            <Text style={levelPickerStyles.subText}>
              {t("LevelPickerSubtextSecond")}
            </Text>
          )}
        {testLevel &&
          isNaN(passageLevelFromTestLevel) &&
          handleRestart &&
          targetPassage.selectedLevel.toString() !==
            testLevel.toString().slice(0, 1) && (
            <Button
              title={t("RestartTests")}
              onPress={() => {
                closeLevelPicker();
                handleRestart();
              }}
            />
          )}

        <Button
          color="green"
          type="outline"
          title={t("Close")}
          onPress={() => closeLevelPicker()}
        />
      </MiniModal>
    </View>
  );
};
