import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { SCREEN, SETTINGS } from "../constants";
import { WORD } from "../l10n";
import { ActionName, ScreenPropsModel } from "../models";
import addZero from "../utils/addZero";
import { reduce } from "../utils/reduce";
import {
  getAutoTimeTrigger,
  schedulePushNotification
} from "../utils/notifications";
import { randomRange } from "../utils/randomizers";

// Reminders/notifications settings — was a MiniModal rendered inline in the
// settings list. Now a stack screen reached from settingsScreen.
export const NotificationsSettingsScreen: FC<
  ScreenPropsModel<SCREEN.settingsNotifications>
> = ({ navigation }) => {
  const { state, setState, t } = useAppContext();

  const autoTime = getAutoTimeTrigger(state.testsHistory);

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("settsLabelReminders")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView style={notificationsSettingsStyle.scrollView}>
        <SettingsMenuItem
          header={t("settsEnableReminders")}
          subtext={t(
            state.settings.remindersEnabled ? "settsEnabled" : "settsDisabled"
          )}
          type="checkbox"
          checkBoxState={state.settings.remindersEnabled}
          onClick={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setSettingsParam,
                  payload: {
                    param: SETTINGS.remindersEnabled,
                    value: value
                  }
                }) || st
            );
          }}
        />
        <SettingsMenuItem
          header={t("settsRemindersAutomaticTime")}
          subtext={`${t("settsRemindersAutomaticTimeSubtext")}: ${
            state.settings.remindersSmartTime
              ? `${t("settsEnabled")} ${addZero(
                  autoTime.hour as number
                )}:${addZero(autoTime.minute as number)}`
              : t("settsDisabled")
          }`}
          type="checkbox"
          disabled={!state.settings.remindersEnabled}
          checkBoxState={state.settings.remindersSmartTime}
          onClick={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setSettingsParam,
                  payload: {
                    param: SETTINGS.remindersSmartTime,
                    value: value
                  }
                }) || st
            );
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settsRemindersListHeader")}
          subtext={t("settsRemindersListSubtext")}
          disabled={
            !state.settings.remindersEnabled ||
            state.settings.remindersSmartTime
          }
          actionCallBack={() => navigation.navigate(SCREEN.settingsReminders)}
        />
        {state.settings.devModeEnabled && (
          <SettingsMenuItem
            type="action"
            header={t("settsTestNotification")}
            subtext=""
            actionCallBack={async () => {
              const randNum = randomRange(1, 13);
              schedulePushNotification(
                t(`notificationTitle${randNum}` as WORD),
                t(`notificationBody${randNum}` as WORD),
                state.settings.remindersList[0] || {}
              );
            }}
          />
        )}
      </ScrollView>
    </SettingsSubScreen>
  );
};

const notificationsSettingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  }
});
