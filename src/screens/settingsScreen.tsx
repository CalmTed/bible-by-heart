import React, { FC, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import {
  SCREEN,
  LANGCODE,
  THEMETYPE,
  ACCESS_TOKEN_NAME,
  API_LINK,
  REFRESH_TOKEN_NAME
} from "../constants";
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
import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "../services/fetch";
import { logger } from "../utils/logger";
import { UserSettingsList } from "../components/settingsLists/userSettings";

export const SettingsScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, setState, t, theme } = useApp({ route, navigation });
  const [loadingState, setLoadingState] = useState(false);

  const languageOptions = Object.entries(LANGCODE).map(([k, v]) => {
    const customT = createT(v);
    return {
      value: k,
      label: `${customT("name")} ${customT("flag")}`
    };
  });

  const handleLoginPress = () => {
    navigateWithState({
      screen: SCREEN.login,
      state,
      navigation
    });
  };

  const handleLogoutPress = async () => {
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    //fetch user data
    const logingoutResult = await fetchAPI({
      link: API_LINK.logout,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      logoutMethods: {
        state,
        setState,
        navigation,
        screen: SCREEN.settings
      }
    });
    if (typeof logingoutResult === "undefined") {
      Alert.alert(t("netUnknownError"), t("netUnableToLogOut"));
      return;
    }
    switch (logingoutResult.response.status) {
      case 200:
        logger.write(`Logged out manualy from ${state.userData.userName}`);
        const newState = reduce(state, {
          name: ActionName.resetUserData
        });
        if (newState === null) {
          return logger.error(`Unknown error: Unable to reset user data`);
        }
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_NAME);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_NAME);
        setState(newState);
        break;
      case 401:
        Alert.alert(
          t("netUnauthorized401"),
          `${logingoutResult.response.statusText}`
        );
        break;
      case 500:
        Alert.alert(
          t("netServerError500"),
          `${logingoutResult.response.statusText}`
        );
        break;
    }
  };

  const syncLangChange = async (newLangCode: LANGCODE) => {
    setLoadingState(true);
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    await fetchAPI({
      link: API_LINK.editUserData,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: {
        uuid: state.userData.uuid,
        appLanguage: newLangCode
      },
      logoutMethods: {
        state,
        setState,
        navigation,
        screen: SCREEN.settings
      }
    });
    setLoadingState(false);
  };

  const haveToken = SecureStore.getItem(ACCESS_TOKEN_NAME) !== null;
  const isAutorized = haveToken && state.userData.uuid !== null;
  const dataSynced =
    state.dateSyncSuccess !== -1 && state.dateSyncTry === state.dateSyncSuccess;

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
            {t("settingsScreenTitle")} {loadingState ? "⏳" : ""}
          </Text>
        ]}
      />
      <ScrollView style={settingsStyle.scrollView}>
        <View style={settingsStyle.topUserDataView}>
          <View style={{ ...settingsStyle.userImageView }}>
            <Icon
              iconName={
                dataSynced ? IconName.cloudSuccess : IconName.cloudAttention
              }
              size={75}
            />
          </View>
          {!isAutorized && (
            <Button
              theme={theme}
              onPress={() => handleLoginPress()}
              title={t("loginButton")}
              type="transparent"
            />
          )}
          {isAutorized && (
            <View>
              <Text style={theme.theme.headerText}>
                {state.userData.userTitle}
              </Text>
              <Text style={theme.theme.text}>@{state.userData.userName}</Text>
              {/* <Button
              theme={theme}
              onPress={() => updateUserData()}
              title={t("update")}
              type="transparent"
            /> */}
              <Button
                theme={theme}
                onPress={() => handleLogoutPress()}
                title={t("logoutButton")}
                type="transparent"
              />
            </View>
          )}
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
              syncLangChange(value as LANGCODE);
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
          {/* {isAutorized && ( */}
          <UserSettingsList
            theme={theme}
            state={state}
            setState={setState}
            t={t}
            navigation={navigation}
          />
          {/* )} */}
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
            navigation={navigation}
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
