import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { SCREEN, SETTINGS, STATSMETRICS } from "../constants";
import { ActionName, ScreenPropsModel } from "../models";
import { reduce } from "../utils/reduce";

// Stats settings — was a MiniModal rendered inline in the settings list. Now a
// stack screen reached from settingsScreen.
export const StatsSettingsScreen: FC<
  ScreenPropsModel<SCREEN.settingsStats>
> = ({ navigation }) => {
  const { state, setState, t } = useAppContext();

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("settsLabelStats")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView style={statsSettingsStyle.scrollView}>
        <SettingsMenuItem
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
