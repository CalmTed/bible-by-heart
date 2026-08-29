import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { Button, IconButton } from "../components/Button";
import { Input } from "../components/Input";
import { MiniModal } from "../components/MiniModal";
import { IconName } from "../components/Icon";
import {
  ACCESS_TOKEN_NAME,
  API_LINK,
  REFRESH_TOKEN_NAME,
  SCREEN
} from "../constants";
import { ActionName, AppStateModel, ScreenPropsModel } from "../models";
import { dateToString, timeToString } from "../utils/formatDateTime";
import { reduce } from "../utils/reduce";
import { fetchAPI } from "../services/fetch";
import { logger } from "../utils/logger";

// User / account settings — was a MiniModal rendered inline in the settings list.
// Now a stack screen reached from settingsScreen (only when authorized). The
// delete-account confirmation stays a MiniModal (it is a dialog, not a sub-menu).
export const UserSettingsScreen: FC<ScreenPropsModel<SCREEN.settingsUser>> = ({
  navigation
}) => {
  const { state, setState, dispatch, t, theme } = useAppContext();

  const [isDeletionConfirmationModalShown, setDeletionConfirmationModalShown] =
    useState(false);
  const [deletionConfirmationTextValue, setDeletionConfirmationTextValue] =
    useState("");
  const deletionText =
    t("settsIConfirmDeletion") + `${state.userData.userName}`;
  const [loadingState, setLoadingState] = useState(false);

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
    // dispatch rather than reduce(state) + setState, here and below (8.2.24):
    // a whole-snapshot write is a rollback of everything that changed since the
    // snapshot was read.
    dispatch({
      name: ActionName.setUserData,
      payload: {
        userTitle: newValue
      }
    });
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
        // A functional updater rather than a dispatch, because the payload reads
        // the state too: `applang` compares the server's language against the
        // one the app is CURRENTLY in, and this runs after an awaited request
        // (8.2.24). Reading it off a captured `state` compares against whatever
        // the language was before the call.
        setState(
          (prev) =>
            reduce(prev, {
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
                  prev.settings.langCode !== udd.appLanguage
                    ? udd.appLanguage
                    : undefined //set app lang if different
              }
            }) ?? prev
        );
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
    dispatch({
      name: ActionName.setUserData,
      payload: {
        isProfilePublic: isPublic || undefined
      }
    });
    syncUserData();
  };

  const handleIsDataPublicChange = (
    isPublic: AppStateModel["userData"]["isDataPublic"]
  ) => {
    dispatch({
      name: ActionName.setUserData,
      payload: {
        isDataPublic: isPublic || undefined
      }
    });
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
        setState,
        navigation,
        screen: SCREEN.settings
      }
    });
    if (requestEmailConfirmationResult?.response?.status === 200) {
      logger.write(`Local user data cleared after account deletion`);
      dispatch({ name: ActionName.resetUserData });
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_NAME);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_NAME);
      navigation.navigate(SCREEN.settings);
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
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={`${t("settsUserHeader")}${loadingState ? " ⏳" : ""}`}
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        style={userSettingsStyle.scrollView}
        contentContainerStyle={theme.theme.scrollContent}
      >
        <SettingsMenuItem
          type="label"
          header={`${t("settsUserEmail")}: ${state.userData.email?.replace(/(\w{3})[\w.-]+@([\w.]+\w)/, "$1***@$2")}`}
        />
        <SettingsMenuItem
          type="label"
          header={t(
            `${state.userData.isEmailConfirmed ? "settsUserEmailConfirmed" : "settsUserEmailNOTConfirmed"}`
          )}
        />
        {!state.userData.isEmailConfirmed && (
          <SettingsMenuItem
            type="action"
            header={t("settsUserRequestEmailConfLinkHeadert")}
            subtext={t("settsUserRequestEmailConfLinkSubtext")}
            actionCallBack={() => handleRequestEmailConfirmation()}
          />
        )}
        <SettingsMenuItem
          type="label"
          header={`${t("settsUserRegDate")}: ${dateToString(state.userData.registrationDate || 0)}`}
        />
        {state.userData.userRights !== "free" && (
          <SettingsMenuItem
            type="label"
            header={`User type: ${state.userData.userRights}`}
          />
        )}
        <SettingsMenuItem
          type="textinput"
          header={t("settsUserUserName")}
          //TODO limit charachters
          value={state.userData.userName || ""}
          onChange={() => {}}
          disabled={true}
        />
        <SettingsMenuItem
          type="textinput"
          header={t("settsUserUserTitle")}
          value={state.userData.userTitle || ""}
          onChange={(newValue) => handleUserTitleChange(newValue)}
          onEndEditing={() => syncUserData()}
          autoCorrect={false}
        />
        {state.settings.devModeEnabled && (
          <SettingsMenuItem
            type="label"
            header={`${t("settsUserLastSyncDate")}: ${timeToString(state.userData.lastUserDataSync || 0)}`}
          />
        )}
        {state.settings.devModeEnabled && (
          <SettingsMenuItem
            type="action"
            header={t("settsUserGetRemoteUserDataHeader")}
            subtext={t("settsUserGetRemoteUserDataSubtext")}
            actionCallBack={() => updateUserData()}
          />
        )}
        <SettingsMenuItem
          type="select"
          header={t("settsUserProfilePublic")}
          subtext={
            isProfilePublicOptions[isProfilePublicOptnionsSelected].label
          }
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
          header={t("settsUserDeleteAccountHeader")}
          subtext={t("settsUserDeleteAccountSubtext")}
          actionCallBack={() => setDeletionConfirmationModalShown(true)}
        />
      </ScrollView>
      <MiniModal
        shown={isDeletionConfirmationModalShown}
        handleClose={() => handleClosingDeletionConfirmationModal()}
        style={userSettingsStyle.deletionMiniModal}
      >
        <View style={userSettingsStyle.deletionModalHeader}>
          <Text style={{ ...theme.theme.headerText, ...theme.theme.flexOne }}>
            {t("settsUserConfirmDeleteAccountHeader")}{" "}
            {loadingState ? "⏳" : ""}
          </Text>
          {/* a dialog is dismissed, not navigated back out of */}
          <IconButton
            icon={IconName.cross}
            onPress={() => handleClosingDeletionConfirmationModal()}
          />
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
            type="main"
            value={deletionConfirmationTextValue}
            onChange={setDeletionConfirmationTextValue}
            placeholder={t(
              "settsUserConfirmDeleteAccountDisclosureInputPlaceholder"
            )}
          />
          <Button
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
    </SettingsSubScreen>
  );
};

const userSettingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  },
  // 8.2.2: this is a confirmation, so it stays a dialog - but it used to be
  // sized width/height 100%, which made it a screen wearing a modal's clothes.
  // A dialog is as tall as what it says.
  deletionMiniModal: {
    width: "90%"
  },
  deletionModalHeader: {
    flexWrap: "nowrap",
    flexDirection: "row",
    width: "100%",
    alignItems: "center"
  }
});
