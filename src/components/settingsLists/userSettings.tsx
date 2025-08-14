import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Linking from "expo-linking";
import { Button, IconButton } from "../Button";
import { Input } from "../Input";
import { MiniModal } from "../miniModal";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { ACCESS_TOKEN_NAME, API_LINK, DAY, PRIVACY_POLICY_LINK, REFRESH_TOKEN_NAME, SCREEN, TERMS_OF_SERVICE_LINK, VERSION } from "../../constants";
import { ThemeAndColorsModel } from "src/utils/getThemeFromScheme";
import { ActionName, AppStateModel } from "src/models";
import { WORD } from "src/l10n";
import { IconName } from "../Icon";
import { dateToString, timeToString } from "src/utils/formatDateTime";
import { reduce } from "src/utils/reduce";
import { fetchAPI } from "src/services/fetch";
import * as SecureStore from "expo-secure-store";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import { navigateWithState } from "src/screeenManagement";
import { ScrollView } from "react-native-gesture-handler";
import { ExternalStorageDirectoryPath } from "react-native-fs";
import { logger } from "src/utils/logger";
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
  const [isDeletionConfirmationModalShown, setDeletionConfirmationModalShown] = useState(false);
  const [deletionConfirmationTextValue, setDeletionConfirmationTextValue] = useState("");
  const deletionText = t("I confirm deletion of account ")+ `${state.userData.userName}`;
  const [loadingState, setLoadingState] = useState(false)

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
    },
  });

  const isProfilePublicOptions = [
    {value: "public", label: "profilePublicOptionPublic"},
    {value: "reference_link_olny", label: "profilePublicOptionReference"},
    {value: "private", label: "profilePublicOptionPrivate"},
    ]
  const isProfilePublicOptnionsSelected = isProfilePublicOptions.map(a => a.value).indexOf(state.userData.isProfilePublic || "private");
  const isDataPublicOptions = [
    {value: "public", label: "dataPublicOptionPublic"},
    {value: "private", label: "dataPublicOptionPrivate"},
    ]
  const isDataPublicOptnionsSelected = isDataPublicOptions.map(a => a.value).indexOf(state.userData.isDataPublic || "private");

  const handleUserTitleChange = (newValue: string) => {
    if(!/^[A-Za-z0-9\s ]{0,50}$/.test(newValue)){
      return;
    }
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        userTitle: newValue
      }
    })
    if(newState === null){
      return;
    }
    setState(newState)
  }

    const updateUserData = async () => {
      setLoadingState(true)
      const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
      //fetch user data
      const userData = await fetchAPI({
        link: API_LINK.getUserData,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        logoutMethods: {
          state, setState, navigation, screen: SCREEN.settings
        }
      })
      if (typeof userData === "undefined") {
        Alert.alert(`Unknown error`, `Unable to get user data`);
        return;
      }
      switch (userData.response.status) {
        case 200:
          const udd = userData.data as Record< keyof AppStateModel["userData"] | "appLanguage", any>;
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
              applang: state.settings.langCode !== udd.appLanguage ? udd.appLanguage : undefined //set app lang if different
          }
            
          });
          if (newState === null) {
            return Alert.alert(`Unknown error`, `Unable to reduce user data`);
          }
          setState(newState)
          navigateWithState({
            navigation,
            screen: SCREEN.settings,
            state: newState
          })
          break;
        case 400: Alert.alert(`Unable to get user data 400`, `${userData.response.statusText}`); break;
        case 401: Alert.alert(`Unable to get user data 401`, `${userData.response.statusText}`); break;
        case 403: Alert.alert(`Unauthorized to get user data 403`, `${userData.response.statusText}`); break;
        case 406: Alert.alert(`Unable to get user data. User not found 406`, `${userData.response.statusText}`); break;
        case 500: Alert.alert(`Unable to get user data. Server error 500`, `${userData.response.statusText}`); break;
      }
      setLoadingState(false)
    }

  const syncUserData = async () => {//each blur we sync user data
    // console.log("syncing")
    setLoadingState(true)
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    const updateUserDataResult = await fetchAPI({
          link: API_LINK.editUserData,
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
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
            state, setState, navigation, screen: SCREEN.settings
          }
        })
    setLoadingState(false)
  }

  const handleIsProfilePublicChange = (isPublic: AppStateModel["userData"]["isProfilePublic"]) => {
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        isProfilePublic: isPublic || undefined
      }
    })
    if(newState === null){
      return;
    }
    setState(newState)
    syncUserData()
  }

  const handleIsDataPublicChange = (isPublic: AppStateModel["userData"]["isDataPublic"]) => {
    const newState = reduce(state, {
      name: ActionName.setUserData,
      payload: {
        isDataPublic: isPublic || undefined
      }
    })
    if(newState === null){
      return;
    }
    setState(newState)
    syncUserData()
  }
  const handleRequestEmailConfirmation = async () => {
    if(state.userData.isEmailConfirmed){
      return;
    }
    setLoadingState(true)
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    const requestEmailConfirmationResult = await fetchAPI({
          link: API_LINK.requestEmailComfirmation,
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          logoutMethods: {
            state, setState, navigation, screen: SCREEN.settings
          }
        })
    console.log(requestEmailConfirmationResult?.response)
    if(requestEmailConfirmationResult?.response?.status === 200){
      
      Alert.alert(t("Link sent successfuly"), t("Open email you provided and follow the link we have provided"))

    }else{
      Alert.alert(t("Unable to send confirmation link"), t("You can try again in 5 minutes"))
    }
    
    setLoadingState(false)
  }

  const handleClosingDeletionConfirmationModal = () => {
    setDeletionConfirmationTextValue("")
    setDeletionConfirmationModalShown(false)
  }

  const handleAccountDeletion = async () => {
    setLoadingState(true)
    const accessToken = SecureStore.getItem(ACCESS_TOKEN_NAME);
    const requestEmailConfirmationResult = await fetchAPI({
          link: API_LINK.removeUser,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: {
            uuid: state.userData.uuid
          },
          logoutMethods: {
            state, setState, navigation, screen: SCREEN.settings
          }
        })
    console.log(requestEmailConfirmationResult?.response)
    if(requestEmailConfirmationResult?.response?.status === 200){
      const newState = reduce(state, {
        name: ActionName.resetUserData
      })
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
      })
      Alert.alert(t("Account deleted successfuly"))
    }else{
      Alert.alert(t("Unable to delete account"), t("Please write us at biblebyheartapp@gmail.com we can do it manualy"))
    }
    setDeletionConfirmationModalShown(false)
  }
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
          <Text style={theme.theme.headerText}>{t("settsUserHeader")} {loadingState ? "⏳" : ""}</Text>
        </View>
        <ScrollView>
          <SettingsMenuItem
              type="label"
              theme={theme}
              header={`${t("Email")}: ${state.userData.email?.replace(/(\w{3})[\w.-]+@([\w.]+\w)/, "$1***@$2")}`}
          />
          <SettingsMenuItem
              type="label"
              theme={theme}
              header={t(`Email is${state.userData.isEmailConfirmed ?  "" : " NOT"} confirmed`)} 
          />
          <SettingsMenuItem
              type="label"
              theme={theme}
              header={`${t("Registration date")}: ${dateToString(state.userData.registrationDate || 0)}`}
          />
          <SettingsMenuItem
              type="label"
              theme={theme}
              header={`${t("User data last sync date")}: ${timeToString(state.userData.lastUserDataSync || 0)}`}
          />
          <SettingsMenuItem
            type="action"
            theme={theme}
            header={t("Get remote user data")}
            subtext={t("Get data from the server")}
            actionCallBack={() => updateUserData()}
        />
          {/* <SettingsMenuItem
              type="label"
              theme={theme}
              header={t("User type") + ": " + t(`userType${state.userData.userRights}`)}
          /> */}
          <SettingsMenuItem
              type="textinput"
              theme={theme}
              header={t(`User name (unique)`)}
              //TODO limit charachters
              value={state.userData.userName || ""}
              onChange={() => {}}
              disabled={true}
          />
          <SettingsMenuItem
              type="textinput"
              theme={theme}
              header={t(`User title`)}
              value={state.userData.userTitle || ""}
              onChange={(newValue) => handleUserTitleChange(newValue)}
              onEndEditing={() => syncUserData()}
          />
          <SettingsMenuItem
              type="select"
              theme={theme}
              header={t("Is profive public")}
              subtext={isProfilePublicOptions[isProfilePublicOptnionsSelected].label}
              // options={["private","reference_link_olny","public"]}
              selectedIndex={isProfilePublicOptnionsSelected}
              options={isProfilePublicOptions}
              onSelect={(selectedValue) => handleIsProfilePublicChange(selectedValue as AppStateModel["userData"]["isProfilePublic"])}
          />
          <SettingsMenuItem
              type="select"
              theme={theme}
              header={t("Is statistics data public")}
              subtext={isDataPublicOptions[isDataPublicOptnionsSelected].label}
              selectedIndex={isDataPublicOptnionsSelected}
              options={isDataPublicOptions}
              onSelect={(selectedValue) => handleIsDataPublicChange(selectedValue as AppStateModel["userData"]["isDataPublic"])}
          />
          {!state.userData.isEmailConfirmed &&
            <SettingsMenuItem
            type="action"
            theme={theme}
            header={t("Request email confirmation letter")}
            subtext={t("You will have 24h to follow the link we will send you")}
            actionCallBack={() => handleRequestEmailConfirmation()}
        />}
          <SettingsMenuItem
            type="action"
            theme={theme}
            header={t("Delete account")}
            subtext={t("It is ireversable action. All account data will be lost!")}
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
          <Text style={theme.theme.headerText}>{t("confirm account deletion")} {loadingState ? "⏳" : ""}</Text>
        </View>
        <View>
          <Text>{t("Please be aware that it is not freezing of account, all data that stored by your email address will by irreversably lost")}</Text>
          <Text>{t("To confirm account deletion please write the folowing text: ")}{deletionText}</Text>
          <Input theme={theme} type="main" value={deletionConfirmationTextValue} onChange={setDeletionConfirmationTextValue} placeholder={""}/>
          <Button theme={theme} color="red" type={deletionConfirmationTextValue === deletionText ? "main" : "outline"} onPress={handleAccountDeletion} disabled={deletionConfirmationTextValue != deletionText} title={t("Delete account")}/>
        </View>
        </MiniModal>
      </MiniModal>
    </View>
  );
};
