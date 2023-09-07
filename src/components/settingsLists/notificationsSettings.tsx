import React, { FC, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Button, IconButton } from "../Button";
import { Icon, IconName } from "../Icon";
import { Select } from "../Select";
import { SettingsListWrapper } from "../settingsListWrapper";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { HOUR, MINUTE, SETTINGS } from "../../constants";
import { createReminder } from "../../initials";
import { WORD } from "../../l10n";
import {
  ActionName,
  AppStateModel,
  OptionModel,
  ReminderModel
} from "../../models";
import addZero from "../../tools/addZero";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";
import { secondsToString } from "../../tools/secondsToString";
import {
  checkSchedule,
  getAutoTimeTrigger,
  schedulePushNotification
} from "../../tools/notifications";
import { randomRange } from "../../tools/randomizers";
import { MiniModal } from "../miniModal";

interface NotificationsSettingsListModel {
  theme: ThemeAndColorsModel;
  t: (w: WORD) => string;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
}

export const NotificationsSettingsList: FC<NotificationsSettingsListModel> = ({
  theme,
  t,
  state,
  setState
}) => {
  const [isNotificationSettingsShown, setNotificationSettingsShown] =
    useState(false);
  const [isRemindersListShown, setRemindersListShown] = useState(false);

  const remindersListString = JSON.stringify(state.settings.remindersList);

  const settingsGroupStyle = StyleSheet.create({
    miniModal: {
      width: "100%",
      height: "100%"
    },
    miniModalContent: {
      height: 60,
      flexWrap: "nowrap",
      flexDirection: "row",
      width: "100%",
      alignItems: "center"
    },
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
    },
    remindersDaysListView: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10
    }
  });

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
  const autoTime = getAutoTimeTrigger(state.testsHistory);
  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsLabelReminders")}
        subtext=""
        actionCallBack={() => setNotificationSettingsShown(true)}
      />
      <MiniModal
        theme={theme}
        shown={isNotificationSettingsShown}
        handleClose={() => setNotificationSettingsShown(false)}
        style={settingsGroupStyle.miniModal}
      >
        <View style={settingsGroupStyle.miniModalContent}>
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() => setNotificationSettingsShown(false)}
          />
          <Text style={theme.theme.headerText}>{t("settsLabelReminders")}</Text>
        </View>
        <SettingsMenuItem
          theme={theme}
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
          theme={theme}
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
          theme={theme}
          type="action"
          header={t("settsRemindersListHeader")}
          subtext={t("settsRemindersListSubtext")}
          disabled={
            !state.settings.remindersEnabled ||
            state.settings.remindersSmartTime
          }
          actionCallBack={() => setRemindersListShown(true)}
        />
        <SettingsListWrapper
          theme={theme}
          shown={isRemindersListShown}
          handleClose={() => setRemindersListShown(false)}
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
            <View style={settingsGroupStyle.remindersListOptonsView}>
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
                    (item as ReminderModel).enabled
                      ? undefined
                      : theme.colors.text
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
              <View style={settingsGroupStyle.remindersEnabledView}>
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
                <View style={settingsGroupStyle.remindersTimePickerView}>
                  <Select
                    theme={theme}
                    options={hoursOptions}
                    selectedIndex={hoursSelected}
                    onSelect={(value) => {
                      //need additional *5 b.c. we have minutesSelected in steps by 5(5=1,60=12)
                      const newTime =
                        parseInt(value, 10) * HOUR +
                        minutesSelected * 5 * MINUTE;
                      handleChange({
                        ...reminderItem,
                        timeInSec: newTime
                      });
                    }}
                  />
                  <Select
                    theme={theme}
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
                <View style={settingsGroupStyle.remindersDaysListView}>
                  {Object.entries(reminderItem.days).map(([key, value]) => {
                    return (
                      <Button
                        key={key}
                        theme={theme}
                        onPress={() =>
                          handleChange({
                            ...reminderItem,
                            days: {
                              ...reminderItem.days,
                              [key]: !value
                            }
                          })
                        }
                        color={value ? "green" : "gray"}
                        type={"outline"}
                        title={t(key as WORD)}
                      />
                    );
                  })}
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
        {state.settings.devMode && (
          <SettingsMenuItem
            theme={theme}
            type="action"
            header={t("settsTestNotification")}
            subtext=""
            actionCallBack={async () => {
              const randNum = randomRange(1, 3);
              schedulePushNotification(
                t(`notificationTitle${randNum}` as WORD),
                t(`notificationBody${randNum}` as WORD),
                state.settings.remindersList[0] || {}
              );
            }}
          />
        )}
      </MiniModal>
    </View>
  );
};
