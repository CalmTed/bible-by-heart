import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/setttingsMenuItem";
import { SCREEN, SETTINGS } from "../constants";
import { ActionName } from "../models";
import { reduce } from "../utils/reduce";

// Tests settings — was a MiniModal rendered inline in the settings list. Now a
// stack screen reached from settingsScreen.
export const TestsSettingsScreen: FC<ScreenModel> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  return (
    <SettingsSubScreen
      theme={theme}
      themeType={state.settings.theme}
      title={t("settsLabelTests")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView style={testsSettingsStyle.scrollView}>
        <SettingsMenuItem
          theme={theme}
          header={t("settsHaptics")}
          subtext={t(
            state.settings.hapticsEnabled ? "settsEnabled" : "settsDisabled"
          )}
          type="checkbox"
          checkBoxState={state.settings.hapticsEnabled}
          onClick={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setSettingsParam,
                  payload: {
                    param: SETTINGS.hapticsEnabled,
                    value: value
                  }
                }) || st
            );
          }}
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsAutoIncreseLevel")}
          subtext={t(
            state.settings.autoIncreaseLevel ? "settsEnabled" : "settsDisabled"
          )}
          type="checkbox"
          checkBoxState={state.settings.autoIncreaseLevel}
          onClick={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setSettingsParam,
                  payload: {
                    param: SETTINGS.autoIncreaseLevel,
                    value: value
                  }
                }) || st
            );
          }}
        />
        <SettingsMenuItem
          type="action"
          theme={theme}
          actionCallBack={() => navigation.navigate(SCREEN.settingsTrainModes)}
          header={t("settingsTrainModesListHeader")}
          subtext={t("settingsTrainModesListSubtext")}
        />
      </ScrollView>
    </SettingsSubScreen>
  );
};

const testsSettingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  }
});
