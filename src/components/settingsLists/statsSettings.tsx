import React, { FC, useState } from "react";
import { View, Text } from "react-native";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { SETTINGS, STATSMETRICS } from "../../constants";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";
import { MiniModal } from "../miniModal";
import { IconButton } from "../Button";
import { IconName } from "../Icon";

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
  const [isStatsSettingsShown, setStatsSettingsShown] = useState(false);

  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsLabelStats")}
        subtext=""
        actionCallBack={() => setStatsSettingsShown(true)}
      />
      <MiniModal
        theme={theme}
        shown={isStatsSettingsShown}
        handleClose={() => setStatsSettingsShown(false)}
        style={{
          width: "100%"
        }}
      >
        <View
          style={{
            height: 60,
            flexWrap: "nowrap",
            flexDirection: "row",
            width: "100%",
            alignItems: "center"
          }}
        >
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() => setStatsSettingsShown(false)}
          />
          <Text style={theme.theme.headerText}>{t("settsLabelStats")}</Text>
        </View>
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
      </MiniModal>
    </View>
  );
};
