import React, { FC, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useAppContext } from "../context/AppContext";
import { SettingsListWrapper } from "../components/settingsListWrapper";
import { SettingsMenuItem } from "../components/setttingsMenuItem";
import { Button } from "../components/Button";
import { Icon, IconName } from "../components/Icon";
import { Select } from "../components/Select";
import { HOUR, MINUTE } from "../constants";
import { WORD } from "../l10n";
import { ActionName, OptionModel, ReminderModel } from "../models";
import { createReminder } from "../initials";
import addZero from "../utils/addZero";
import { reduce } from "../utils/reduce";
import { secondsToString } from "../utils/secondsToString";
import { checkSchedule } from "../utils/notifications";

// Reminders list — was a modal-in-modal (SettingsListWrapper inside the
// Reminders MiniModal). Now a stack screen reached from NotificationsSettingsScreen.
export const RemindersSettingsScreen: FC<ScreenModel> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  const remindersListString = JSON.stringify(state.settings.remindersList);
  // The reducer reconciles the OS schedule on every mutation; this keeps the
  // "reconcile while viewing/editing reminders" behavior the old modal had.
  useEffect(() => {
    checkSchedule(state);
  }, [remindersListString]);

  const getHumanFriendlyWeeDaysLabel: (arg: ReminderModel) => string = (
    item
  ) => {
    const binaryString = Object.values(item.days)
      .map((i) => (i ? 1 : 0))
      .join(",");
    switch (binaryString) {
      case "1,1,1,1,1,0,0":
        return t("dayWeekdays")
          .toString()
          .replace("true", "1")
          .replace("false", "0");
      case "0,0,0,0,0,1,1":
        return t("dayWeekends");
      case "1,1,1,1,1,1,1":
        return t("dayEveryday");
      default:
        return Object.entries(item.days)
          .map(([k, v]) => (v ? t(k as WORD) : ""))
          .filter((i) => i.length)
          .join(", ");
    }
  };

  return (
    <SettingsListWrapper
      theme={theme}
      themeType={state.settings.theme}
      handleClose={() => navigation.goBack()}
      header={t("settsRemindersList")}
      handleAddNew={() => {
        //limit to five
        if (state.settings.remindersList.length > 4) {
          return;
        }
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setRemindersList,
              payload: [...state.settings.remindersList, createReminder()]
            }) || st
        );
      }}
      handleRemove={(changedItem) =>
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setRemindersList,
              payload: state.settings.remindersList.filter(
                (r) => r.id !== changedItem.id
              )
            }) || st
        )
      }
      handleItemChange={(changedItem) =>
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setRemindersList,
              payload: state.settings.remindersList.map((r) =>
                r.id === changedItem.id ? (changedItem as ReminderModel) : r
              )
            }) || st
        )
      }
      items={state.settings.remindersList}
      renderListItem={(item, handleChange) => (
        <View style={remindersStyle.remindersListOptonsView}>
          <Pressable
            onPress={() =>
              handleChange({
                ...item,
                enabled: !(item as ReminderModel).enabled
              })
            }
          >
            <Icon
              iconName={
                (item as ReminderModel).enabled
                  ? IconName.bellGradient
                  : IconName.bellOutline
              }
              color={
                (item as ReminderModel).enabled ? undefined : theme.colors.text
              }
            />
          </Pressable>
          <Text style={theme.theme.headerText}>
            {`${secondsToString((item as ReminderModel).timeInSec)}`}
          </Text>
          <Text style={theme.theme.text}>
            {getHumanFriendlyWeeDaysLabel(item as ReminderModel)}
          </Text>
        </View>
      )}
      renderEditItem={(item, handleChange, handleRemove) => {
        const reminderItem = item as ReminderModel;
        const hoursOptions = Array(24)
          .fill(0)
          .map((v, i) => {
            return {
              value: i.toString(),
              label: addZero(i)
            } as OptionModel;
          });
        const minutesOptions = Array(MINUTE / 5)
          .fill(0)
          .map((v, i) => {
            return {
              value: (i * 5).toString(),
              label: addZero(i * 5)
            } as OptionModel;
          });
        const hoursSelected = Math.floor(reminderItem.timeInSec / HOUR);
        // /5 here b.c. we show minutes list in a factor if 5
        const minutesSelected = Math.floor(
          (reminderItem.timeInSec - hoursSelected * HOUR) / 60 / 5
        );
        return (
          <View style={remindersStyle.remindersEnabledView}>
            <SettingsMenuItem
              theme={theme}
              header={t("settsReminderEnabled")}
              subtext={`${t(
                reminderItem.enabled ? "settsEnabled" : "settsDisabled"
              )}`}
              type="checkbox"
              checkBoxState={reminderItem.enabled}
              onClick={(value) => {
                handleChange({
                  ...reminderItem,
                  enabled: value
                });
              }}
            />
            <View style={remindersStyle.remindersTimePickerView}>
              <Select
                options={hoursOptions}
                selectedIndex={hoursSelected}
                onSelect={(value) => {
                  //need additional *5 b.c. we have minutesSelected in steps by 5(5=1,60=12)
                  const newTime =
                    parseInt(value, 10) * HOUR + minutesSelected * 5 * MINUTE;
                  handleChange({
                    ...reminderItem,
                    timeInSec: newTime
                  });
                }}
              />
              <Select
                options={minutesOptions}
                selectedIndex={minutesSelected}
                onSelect={(value) => {
                  //dont need additional *5 b.c. options values in normal view
                  const newTime =
                    hoursSelected * HOUR + parseInt(value, 10) * MINUTE;
                  handleChange({
                    ...reminderItem,
                    timeInSec: newTime
                  });
                }}
              />
            </View>
            <Button
              theme={theme}
              onPress={() => handleRemove(reminderItem)}
              color="red"
              title={t("Remove")}
            />
          </View>
        );
      }}
    />
  );
};

const remindersStyle = StyleSheet.create({
  remindersListOptonsView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  remindersEnabledView: {
    gap: 20
  },
  remindersTimePickerView: {
    flexDirection: "row",
    gap: 10
  }
});
