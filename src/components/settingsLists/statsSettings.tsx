import React, { FC } from "react";
import { View } from "react-native";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { SETTINGS, STATSMETRICS } from "../../constants";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";

interface StatsSettingsListModel {
  theme: ThemeAndColorsModel;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  t: (w: WORD) => string;
}

export const StatsSettingsList: FC<StatsSettingsListModel> = ({
  theme,
  state,
  t,
  setState
}) => {
  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        header={t("settsLabelStats")}
        type="label"
      />
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
    </View>
  );
};
