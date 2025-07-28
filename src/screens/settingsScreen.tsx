import React, { FC } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SCREEN, LANGCODE, THEMETYPE } from "../constants";
import { ActionName } from "../models";
import { navigateWithState } from "../screeenManagement";
import { createT } from "../l10n";
import { Button, IconButton } from "../components/Button";
import { reduce } from "../utils/reduce";
import { Header } from "../components/Header";
import { Icon, IconName } from "../components/Icon";
import { ScreenModel } from "./homeScreen";
import { SettingsMenuItem } from "../components/setttingsMenuItem";
import { StatusBar } from "expo-status-bar";
import { ListSettingsList } from "../components/settingsLists/listSettings";
import { NotificationsSettingsList } from "../components/settingsLists/notificationsSettings";
import { AboutSettingsList } from "../components/settingsLists/aboutSettings";
import { TestsSettingsList } from "../components/settingsLists/testsSettings";
import { StatsSettingsList } from "../components/settingsLists/statsSettings";
import { useApp } from "../utils/useApp";

export const SettingsScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, setState, t, theme } = useApp({ route, navigation });

  const languageOptions = Object.entries(LANGCODE).map(([k, v]) => {
    const customT = createT(v);
    return {
      value: k,
      label: `${customT("name")} ${customT("flag")}`
    };
  });

  const handleLoginPress = (v: string) => {
    // toastShowWithGravity(t("ComingSoon"), 5000, 0.5)
    navigateWithState({
      screen: SCREEN.login,
      state,
      navigation
    });
    // checkAPIVersion({localAPIVersion: v})
  };

  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <Header
        theme={theme}
        navigation={navigation}
        showBackButton={false}
        alignChildren="flex-start"
        additionalChildren={[
          <IconButton
            key="back"
            theme={theme}
            icon={IconName.back}
            onPress={() =>
              navigateWithState({
                screen: SCREEN.home,
                state,
                navigation
              })
            }
          />,
          <Text key="title" style={theme.theme.headerText}>
            {t("settingsScreenTitle")}
          </Text>
        ]}
      />
      <ScrollView style={settingsStyle.scrollView}>
        <View style={settingsStyle.topUserDataView}>
          <View style={{ ...settingsStyle.userImageView }}>
            <Icon iconName={IconName.cloudAttention} size={75} />
          </View>

          <Button
            theme={theme}
            onPress={() => handleLoginPress(state.apiVersion)}
            title={t("loginButton")}
            type="transparent"
          />
        </View>
        <View style={settingsStyle.menuItemsListView}>
          {/* MAIN */}
          <SettingsMenuItem
            theme={theme}
            header={t("settsLabelMain")}
            type="label"
          />
          <SettingsMenuItem
            theme={theme}
            header={t("settsChangeLang")}
            subtext={`${t("name")} ${t("flag")}`}
            type="select"
            options={languageOptions}
            selectedIndex={languageOptions
              .map((op) => op.value)
              .indexOf(state.settings.langCode)}
            onSelect={(value) => {
              setState(
                (st) =>
                  reduce(st, {
                    name: ActionName.setLang,
                    payload: value as LANGCODE
                  }) || st
              );
            }}
          />
          <SettingsMenuItem
            theme={theme}
            header={t("settsChangeTheme")}
            subtext={t(state.settings.theme)}
            type="select"
            options={Object.entries(THEMETYPE).map(([k, v]) => {
              return {
                value: k,
                label: t(v)
              };
            })}
            selectedIndex={Object.keys(THEMETYPE).indexOf(state.settings.theme)}
            onSelect={(value) => {
              setState(
                (st) =>
                  reduce(st, {
                    name: ActionName.setTheme,
                    payload: value as THEMETYPE
                  }) || st
              );
            }}
          />
          {/* LISTS */}
          <ListSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
            languageOptions={languageOptions}
          />
          {/* TESTS */}
          <TestsSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
          />
          {/* NOTIFICATIONS */}
          <NotificationsSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
          />
          {/* STATS */}
          <StatsSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
          />
          {/* ABOUT */}
          <AboutSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
          />
        </View>
      </ScrollView>
      <StatusBar
        style={state.settings.theme === THEMETYPE.light ? "dark" : "light"}
      />
    </View>
  );
};

const settingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  },
  topUserDataView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 20,
    marginBottom: 25
  },
  userImageView: {
    borderRadius: 50,
    width: 75,
    aspectRatio: 1
  },
  groupView: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap"
  },
  textarea: {
    width: "100%",
    minHeight: 20,
    maxHeight: 300
  },
  menuItemsListView: {
    width: "100%"
  }
});
