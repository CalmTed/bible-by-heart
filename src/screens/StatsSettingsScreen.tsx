import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/setttingsMenuItem";
import { SETTINGS, STATSMETRICS } from "../constants";
import { ActionName } from "../models";
import { reduce } from "../utils/reduce";

// Stats settings — was a MiniModal rendered inline in the settings list. Now a
// stack screen reached from settingsScreen.
export const StatsSettingsScreen: FC<ScreenModel> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  return (
    <SettingsSubScreen
      theme={theme}
      themeType={state.settings.theme}
      title={t("settsLabelStats")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView style={statsSettingsStyle.scrollView}>
        <SettingsMenuItem
          theme={theme}
          header={t("settsWeeklyMetrics")}
          subtext={`${t(state.settings.homeScreenWeeklyMetric)}`}
          type="select"
          options={Object.values(STATSMETRICS).map((v) => {
            return {
              value: v,
              label: t(v)
            };
          })}
          selectedIndex={Object.values(STATSMETRICS).indexOf(
            state.settings.homeScreenWeeklyMetric
          )}
          onSelect={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setSettingsParam,
                  payload: {
                    param: SETTINGS.homeScreenWeeklyMetric,
                    value
                  }
                }) || st
            );
          }}
        />
      </ScrollView>
    </SettingsSubScreen>
  );
};

const statsSettingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  }
});
