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
import { ActionName, ScreenPropsModel } from "../models";
import { createT } from "../l10n";
import { Button, IconButton } from "../components/Button";
import { reduce } from "../utils/reduce";
import { Header } from "../components/Header";
import { Icon, IconName } from "../components/Icon";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { StatusBar } from "expo-status-bar";
import { useAppContext } from "../context/AppContext";
import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "../services/fetch";
import { logger } from "../utils/logger";

export const SettingsScreen: FC<ScreenPropsModel<SCREEN.settings>> = ({
  navigation
}) => {
  const { state, setState, t, theme } = useAppContext();
  const [loadingState, setLoadingState] = useState(false);

  const languageOptions = Object.entries(LANGCODE).map(([k, v]) => {
    const customT = createT(v);
    return {
      value: k,
      label: `${customT("name")} ${customT("flag")}`
    };
  });

  const handleLoginPress = () => {
    navigation.navigate(SCREEN.login);
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
        navigation={navigation}
        showBackButton={false}
        alignChildren="flex-start"
        additionalChildren={[
          <IconButton
            key="back"
            icon={IconName.back}
            onPress={() => navigation.navigate(SCREEN.home)}
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
              onPress={() => updateUserData()}
              title={t("update")}
              type="transparent"
            /> */}
              <Button
                onPress={() => handleLogoutPress()}
                title={t("logoutButton")}
                type="transparent"
              />
            </View>
          )}
        </View>
        <View style={settingsStyle.menuItemsListView}>
          {/* MAIN */}
          <SettingsMenuItem header={t("settsLabelMain")} type="label" />
          <SettingsMenuItem
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
          {/* USER (account) — only when signed in */}
          {isAutorized && (
            <SettingsMenuItem
              type="action"
              header={t("settsUserHeader")}
              subtext=""
              actionCallBack={() => navigation.navigate(SCREEN.settingsUser)}
            />
          )}
          {/* LISTS */}
          <SettingsMenuItem
            type="action"
            header={t("settsLabelList")}
            subtext=""
            actionCallBack={() => navigation.navigate(SCREEN.settingsList)}
          />
          {/* TESTS */}
          <SettingsMenuItem
            type="action"
            header={t("settsLabelTests")}
            subtext=""
            actionCallBack={() => navigation.navigate(SCREEN.settingsTests)}
          />
          {/* NOTIFICATIONS */}
          <SettingsMenuItem
            type="action"
            header={t("settsLabelReminders")}
            subtext=""
            actionCallBack={() =>
              navigation.navigate(SCREEN.settingsNotifications)
            }
          />
          {/* STATS */}
          <SettingsMenuItem
            type="action"
            header={t("settsLabelStats")}
            subtext=""
            actionCallBack={() => navigation.navigate(SCREEN.settingsStats)}
          />
          {/* ABOUT */}
          <SettingsMenuItem
            type="action"
            header={t("settsAboutHeader")}
            subtext=""
            actionCallBack={() => navigation.navigate(SCREEN.settingsAbout)}
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
