import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button, IconButton } from "../Button";
import { Input } from "../Input";
import { MiniModal } from "../miniModal";
import { SettingsMenuItem } from "../setttingsMenuItem";
import {
  ACCESS_TOKEN_NAME,
  API_LINK,
  REFRESH_TOKEN_NAME,
  SCREEN
} from "../../constants";
import { ThemeAndColorsModel } from "../../utils/getThemeFromScheme";
import { ActionName, AppStateModel } from "../../models";
import { WORD } from "../../l10n";
import { IconName } from "../Icon";
import { dateToString, timeToString } from "../../utils/formatDateTime";
import { reduce } from "../../utils/reduce";
import { fetchAPI } from "../../services/fetch";
import * as SecureStore from "expo-secure-store";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import { navigateWithState } from "../../screeenManagement";
import { ScrollView } from "react-native-gesture-handler";
import { logger } from "../../utils/logger";

interface UserSettingsListModel {
  theme: ThemeAndColorsModel;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  t: (w: WORD) => string;
  navigation: StackNavigationHelpers;
}

export const UserSettingsList: FC<UserSettingsListModel> = ({
  theme,
  state,
  t,
  setState,
  navigation
}) => {
  const [isUserSettsdModalShown, setIsUserSettsModalShown] = useState(false);
  const [isDeletionConfirmationModalShown, setDeletionConfirmationModalShown] =
    useState(false);
  const [deletionConfirmationTextValue, setDeletionConfirmationTextValue] =
    useState("");
  const deletionText =
    t("settsIConfirmDeletion") + `${state.userData.userName}`;
  const [loadingState, setLoadingState] = useState(false);

  const settingsGroupStyle = StyleSheet.create({
    miniModal: {
      width: "100%",
      height: "100%",
      paddingTop: 50
    },
    miniModalContent: {
      height: 60,
      flexWrap: "nowrap",
      flexDirection: "row",
      width: "100%",
      alignItems: "center"
    }
  });

  const isProfilePublicOptions = [
    { value: "public", label: t("profilePublicOptionPublic") },
    { value: "reference_link_olny", label: t("profilePublicOptionReference") },
    { value: "private", label: t("profilePublicOptionPrivate") }
  ];
  const isProfilePublicOptnionsSelected = isProfilePublicOptions
    .map((a) => a.value)
    .indexOf(state.userData.isProfilePublic || "private");
  const isDataPublicOptions = [
    { value: "public", label: t("dataPublicOptionPublic") },
    { value: "private", label: t("dataPublicOptionPrivate") }
  ];
  const isDataPublicOptnionsSelected = isDataPublicOptions
    .map((a) => a.value)
    .indexOf(state.userData.isDataPublic || "private");

  const handleUserTitleChange = (newValue: string) => {
    if (!/^[A-Za-z0-9\s ]{0,50}$/.test(newValue)) {
      return;
    }
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        userTitle: newValue
      }
    });
    if (newState === null) {
      return;
    }
    setState(newState);
  };

  const updateUserData = async () => {
    setLoadingState(true);
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    //fetch user data
    const userData = await fetchAPI({
      link: API_LINK.getUserData,
      method: "GET",
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
    if (typeof userData === "undefined") {
      Alert.alert(t("netUnknownError"), t("netUnableToGetUserData"));
      return;
    }
    switch (userData.response.status) {
      case 200:
        const udd = userData.data as Record<
          keyof AppStateModel["userData"] | "appLanguage",
          any
        >;
        const newState = reduce(state, {
          name: ActionName.setUserData,
          payload: {
            uuid: udd.uuid,
            email: udd.email,
            registrationDate: udd.registrationDate,
            isEmailConfirmed: udd.isEmailConfirmed,
            //setting user data update time automaticaly
            userName: udd.userName,
            userTitle: udd.userTitle,
            userPicture: udd.userPicture,
            birthDate: udd.birthDate,
            userRights: udd.userRights,
            isProfilePublic: udd.isProfilePublic,
            isDataPublic: udd.isDataPublic,
            friendRequests: udd.friendRequests,
            friends: udd.friends,
            blockedUsers: udd.blockedUsers,
            sessions: udd.sessions,
            applang:
              state.settings.langCode !== udd.appLanguage
                ? udd.appLanguage
                : undefined //set app lang if different
          }
        });
        if (newState === null) {
          return Alert.alert(
            t("netUnknownError"),
            t("netUnableToSaveUserData")
          );
        }
        setState(newState);
        navigateWithState({
          navigation,
          screen: SCREEN.settings,
          state: newState
        });
        break;
      case 400:
        Alert.alert(
          t("netBadRequestData400"),
          `${userData.response.statusText}`
        );
        break;
      case 401:
        Alert.alert(t("netUnauthorized401"), `${userData.response.statusText}`);
        break;
      case 403:
        Alert.alert(t("netForbidden403"), `${userData.response.statusText}`);
        break;
      case 406:
        Alert.alert(t("netUserNotFound406"), `${userData.response.statusText}`);
        break;
      case 500:
        Alert.alert(t("netServerError500"), `${userData.response.statusText}`);
        break;
    }
    setLoadingState(false);
  };

  const syncUserData = async () => {
    //each blur we sync user data
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
        userTitle: state.userData.userTitle,
        isProfilePublic: state.userData.isProfilePublic,
        isDataPublic: state.userData.isDataPublic,
        friends: state.userData.friends,
        blockedUsers: state.userData.blockedUsers
        //need to add on API side: userName
      },
      logoutMethods: {
        state,
        setState,
        navigation,
        screen: SCREEN.settings
      }
    }).finally(() => {
      setLoadingState(false);
    });
    setLoadingState(false);
  };

  const handleIsProfilePublicChange = (
    isPublic: AppStateModel["userData"]["isProfilePublic"]
  ) => {
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        isProfilePublic: isPublic || undefined
      }
    });
    if (newState === null) {
      return;
    }
    setState(newState);
    syncUserData();
  };

  const handleIsDataPublicChange = (
    isPublic: AppStateModel["userData"]["isDataPublic"]
  ) => {
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        isDataPublic: isPublic || undefined
      }
    });
    if (newState === null) {
      return;
    }
    setState(newState);
    syncUserData();
  };
  const handleRequestEmailConfirmation = async () => {
    if (state.userData.isEmailConfirmed) {
      return;
    }
    setLoadingState(true);
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    const requestEmailConfirmationResult = await fetchAPI({
      link: API_LINK.requestEmailComfirmation,
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
    if (requestEmailConfirmationResult?.response?.status === 200) {
      Alert.alert(
        t("settsEmailConfirmLintSentTitle"),
        t("settsEmailConfirmLintSentSubtext")
      );
    } else {
      Alert.alert(
        t("settsEmailConfirmLintFailTitle"),
        t("settsEmailConfirmLintFailSubtext")
      );
    }

    setLoadingState(false);
  };

  const handleClosingDeletionConfirmationModal = () => {
    setDeletionConfirmationTextValue("");
    setDeletionConfirmationModalShown(false);
  };

  const handleAccountDeletion = async () => {
    setLoadingState(true);
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    const requestEmailConfirmationResult = await fetchAPI({
      link: API_LINK.removeUser,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: {
        uuid: state.userData.uuid
      },
      logoutMethods: {
        state,
        setState,
        navigation,
        screen: SCREEN.settings
      }
    });
    if (requestEmailConfirmationResult?.response?.status === 200) {
      const newState = reduce(state, {
        name: ActionName.resetUserData
      });
      if (newState === null) {
        return logger.error(`Unknown error: Unable to reset user data`);
      }
      setState(newState);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_NAME);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_NAME);
      navigateWithState({
        navigation,
        screen: SCREEN.settings,
        state: newState
      });
      Alert.alert(t("settsAccountDeletionSuccess"));
    } else {
      Alert.alert(
        t("settsAccountDeletionFailTitle"),
        t("settsAccountDeletionFailSubtext")
      );
    }
    setDeletionConfirmationModalShown(false);
  };
  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsUserHeader")}
        subtext=""
        actionCallBack={() => {
          setIsUserSettsModalShown(true);
        }}
      />
      <MiniModal
        theme={theme}
        shown={isUserSettsdModalShown}
        handleClose={() => setIsUserSettsModalShown(false)}
        style={settingsGroupStyle.miniModal}
      >
        <View style={settingsGroupStyle.miniModalContent}>
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() => setIsUserSettsModalShown(false)}
          />
          <Text style={theme.theme.headerText}>
            {t("settsUserHeader")}
            {loadingState ? " ⏳" : " "}
          </Text>
        </View>
        <ScrollView>
          <SettingsMenuItem
            type="label"
            theme={theme}
            header={`${t("settsUserEmail")}: ${state.userData.email?.replace(/(\w{3})[\w.-]+@([\w.]+\w)/, "$1***@$2")}`}
          />
          <SettingsMenuItem
            type="label"
            theme={theme}
            header={t(
              `${state.userData.isEmailConfirmed ? "settsUserEmailConfirmed" : "settsUserEmailNOTConfirmed"}`
            )}
          />
          {!state.userData.isEmailConfirmed && (
            <SettingsMenuItem
              type="action"
              theme={theme}
              header={t("settsUserRequestEmailConfLinkHeadert")}
              subtext={t("settsUserRequestEmailConfLinkSubtext")}
              actionCallBack={() => handleRequestEmailConfirmation()}
            />
          )}
          <SettingsMenuItem
            type="label"
            theme={theme}
            header={`${t("settsUserRegDate")}: ${dateToString(state.userData.registrationDate || 0)}`}
          />
          {state.userData.userRights !== "free" && (
            <SettingsMenuItem
              type="label"
              theme={theme}
              header={`User type: ${state.userData.userRights}`}
            />
          )}
          <SettingsMenuItem
            type="textinput"
            theme={theme}
            header={t("settsUserUserName")}
            //TODO limit charachters
            value={state.userData.userName || ""}
            onChange={() => {}}
            disabled={true}
          />
          <SettingsMenuItem
            type="textinput"
            theme={theme}
            header={t("settsUserUserTitle")}
            value={state.userData.userTitle || ""}
            onChange={(newValue) => handleUserTitleChange(newValue)}
            onEndEditing={() => syncUserData()}
            autoCorrect={false}
          />
          {state.settings.devModeEnabled && (
            <SettingsMenuItem
              type="label"
              theme={theme}
              header={`${t("settsUserLastSyncDate")}: ${timeToString(state.userData.lastUserDataSync || 0)}`}
            />
          )}
          {state.settings.devModeEnabled && (
            <SettingsMenuItem
              type="action"
              theme={theme}
              header={t("settsUserGetRemoteUserDataHeader")}
              subtext={t("settsUserGetRemoteUserDataSubtext")}
              actionCallBack={() => updateUserData()}
            />
          )}
          <SettingsMenuItem
            type="select"
            theme={theme}
            header={t("settsUserProfilePublic")}
            subtext={
              isProfilePublicOptions[isProfilePublicOptnionsSelected].label
            }
            // options={["private","reference_link_olny","public"]}
            selectedIndex={isProfilePublicOptnionsSelected}
            options={isProfilePublicOptions}
            onSelect={(selectedValue) =>
              handleIsProfilePublicChange(
                selectedValue as AppStateModel["userData"]["isProfilePublic"]
              )
            }
          />
          <SettingsMenuItem
            type="select"
            theme={theme}
            header={t("settsUserDataPublic")}
            subtext={isDataPublicOptions[isDataPublicOptnionsSelected].label}
            selectedIndex={isDataPublicOptnionsSelected}
            options={isDataPublicOptions}
            onSelect={(selectedValue) =>
              handleIsDataPublicChange(
                selectedValue as AppStateModel["userData"]["isDataPublic"]
              )
            }
          />
          <SettingsMenuItem
            type="action"
            theme={theme}
            header={t("settsUserDeleteAccountHeader")}
            subtext={t("settsUserDeleteAccountSubtext")}
            actionCallBack={() => setDeletionConfirmationModalShown(true)}
          />
        </ScrollView>
        <MiniModal
          theme={theme}
          shown={isDeletionConfirmationModalShown}
          handleClose={() => handleClosingDeletionConfirmationModal()}
          style={settingsGroupStyle.miniModal}
        >
          <View style={settingsGroupStyle.miniModalContent}>
            <IconButton
              theme={theme}
              icon={IconName.back}
              onPress={() => handleClosingDeletionConfirmationModal()}
            />
            <Text style={theme.theme.headerText}>
              {t("settsUserConfirmDeleteAccountHeader")}{" "}
              {loadingState ? "⏳" : ""}
            </Text>
          </View>
          <View style={{ ...theme.theme.view, gap: 12 }}>
            <Text style={{ ...theme.theme.text, fontSize: 16 }}>
              {t("settsUserConfirmDeleteAccountDisclosureText")}
            </Text>
            <Text style={{ ...theme.theme.text, fontSize: 16 }}>
              {t("settsUserConfirmDeleteAccountDisclosureSubtext")}
              {deletionText}
            </Text>
            <Input
              theme={theme}
              type="main"
              value={deletionConfirmationTextValue}
              onChange={setDeletionConfirmationTextValue}
              placeholder={t(
                "settsUserConfirmDeleteAccountDisclosureInputPlaceholder"
              )}
            />
            <Button
              theme={theme}
              color="red"
              type={
                deletionConfirmationTextValue === deletionText
                  ? "main"
                  : "outline"
              }
              onPress={handleAccountDeletion}
              disabled={deletionConfirmationTextValue !== deletionText}
              title={t("settsUserDeleteAccountHeader")}
            />
          </View>
        </MiniModal>
      </MiniModal>
    </View>
  );
};
