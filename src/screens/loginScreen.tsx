import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useApp } from "../utils/useApp";
import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { navigateWithState } from "../screeenManagement";
import { IconName } from "../components/Icon";
import {
  ACCESS_TOKEN_NAME,
  API_LINK,
  REFRESH_TOKEN_NAME,
  SCREEN
} from "../constants";
import { Input } from "../components/Input";
import { logger } from "../utils/logger";
import { fetchAPI } from "../services/fetch";
import * as SecureStore from "expo-secure-store";
import { ActionName, AppStateModel } from "../models";
import { reduce } from "../utils/reduce";

export const LoginScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, setState, theme } = useApp({ route, navigation });

  const [tempEmail, setTempEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  //if session is already defined?
  //- then login button will be blocked,
  // but if you for some reason anready here, you can login again

  const handleLoginSubmit = async (
    loginPossible: boolean,
    email: string,
    password: string
  ) => {
    if (loginPossible) {
      try {
        const result = await fetchAPI({
          link: API_LINK.login,
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: {
            email,
            password
          },
          logoutMethods: {
            state,
            setState,
            navigation,
            screen: SCREEN.settings
          }
        });
        if (typeof result === "undefined") {
          logger.error("Cant login. No result...");
          Alert.alert(t("newUnknownErrorAuth"));
          return;
        }
        switch (result.response.status) {
          case 200:
            if (result?.data) {
              //save auth keys
              SecureStore.setItem(ACCESS_TOKEN_NAME, result.data.token);
              SecureStore.setItem(REFRESH_TOKEN_NAME, result.data.refreshToken);
              //fetch user data
              const userData = await fetchAPI({
                link: API_LINK.getUserData,
                method: "GET",
                headers: {
                  Authorization: `Bearer ${result.data.token}`
                },
                logoutMethods: {
                  state,
                  setState,
                  navigation,
                  screen: SCREEN.settings
                }
              });
              if (typeof userData === "undefined") {
                logger.error("Login : Resieved undefined result");
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
                    logger.error(
                      `Login : Unable to update user data. User data: ${JSON.stringify(udd)}`
                    );
                    return Alert.alert(
                      t("netUnknownError"),
                      t("netUnableToSaveUserData")
                    );
                  }
                  logger.write(`Authinicated as ${userData?.data?.userName}`);
                  setState(newState);
                  navigateWithState({
                    navigation,
                    screen: SCREEN.settings,
                    state: newState
                  });
                  break;
                case 400:
                  logger.error(
                    `Login geting data: Error 400: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData") + t("netBadRequestData400"),
                    `${userData.response.statusText}`
                  );
                  break;
                case 401:
                  logger.error(
                    `Login geting data: Error 401: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData") + t("netUnauthorized401"),
                    `${userData.response.statusText}`
                  );
                  break;
                case 403:
                  logger.error(
                    `Login geting data: Error 403: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData") + t("netForbidden403"),
                    `${userData.response.statusText}`
                  );
                  break;
                case 406:
                  logger.error(
                    `Login geting data: Error 406: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData") + t("netUserNotFound406"),
                    `${userData.response.statusText}`
                  );
                  break;
                case 500:
                  logger.error(
                    `Login : Error 500: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData") + t("netServerError500"),
                    `${userData.response.statusText}`
                  );
                  break;
              }
            } else {
              logger.error(
                `Cant login. Error unknown ${JSON.stringify(result)}`
              );
              Alert.alert(t("netUnknownError"), t("net200withNoData"));
            }
            break;
          case 400:
            logger.error(
              `Login: Error 400: ${JSON.stringify(result.response)}`
            );
            Alert.alert(
              t("netBadRequestData400"),
              `${result.response.statusText}`
            );
            break;
          case 401:
            logger.error(
              `Login: Error 401: ${JSON.stringify(result.response)}`
            );
            Alert.alert(
              t("netUnauthorized401"),
              `${result.response.statusText}`
            );
            break;
          case 500:
            logger.error(
              `Login: Error 500: ${JSON.stringify(result.response)}`
            );
            Alert.alert(
              t("netServerError500"),
              `${result.response.statusText}`
            );
            break;
        }
      } catch (err) {
        logger.error(`Cant login. Error: ${err}`);
        Alert.alert(t("newUnknownErrorAuth"), `${err}`);
      }
    }
  };

  const handleRegisterClick = () => {
    navigateWithState({
      navigation,
      screen: SCREEN.register,
      state
    });
  };
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    tempEmail
  );

  // Login must NOT enforce password-format rules (those belong on the register
  // screen and are enforced server-side). Requiring only a non-empty password lets
  // existing accounts — e.g. the store-review demo account — sign in regardless of
  // how their password is shaped.
  const isPasswordEntered = tempPassword.length > 0;
  const loginPossible = isEmailValid && isPasswordEntered;
  return (
    <ScrollView
      contentContainerStyle={{ ...theme.theme.view, ...theme.theme.screen }}
    >
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
                navigation,
                screen: SCREEN.settings,
                state
              })
            }
          />,
          <Text key="title" style={theme.theme.headerText}>
            {t("loginScreenTitle")}
          </Text>
        ]}
      />
      <View style={{ ...theme.theme.view, ...loginStyle.inputView }}>
        <Input
          wrapperStyle={{ ...loginStyle.wrapperInput }}
          value={tempEmail}
          onChange={setTempEmail}
          placeholder={t("provideEmailLabel")}
          theme={theme}
          inputMode="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          iconAfter={isEmailValid ? IconName.greenCheck : IconName.redCross}
          autoComplete="email"
        />
        <Input
          wrapperStyle={{ ...loginStyle.wrapperInput }}
          value={tempPassword}
          onChange={setTempPassword}
          placeholder={t("providePasswsordLabel")}
          secureTextEntry
          theme={theme}
          iconAfter={
            isPasswordEntered ? IconName.greenCheck : IconName.redCross
          }
          autoComplete="password"
        />
        <Button
          title={t("loginButton")}
          theme={theme}
          type="main"
          color="green"
          disabled={!loginPossible}
          onPress={() =>
            handleLoginSubmit(loginPossible, tempEmail, tempPassword)
          }
        />
      </View>
      <Button
        title={t("registerButton")}
        theme={theme}
        type="transparent"
        onPress={handleRegisterClick}
      />
    </ScrollView>
  );
};

const loginStyle = StyleSheet.create({
  wrapperInput: {
    display: "flex",
    width: "100%",
    alignItems: "flex-start",
    paddingVertical: 10
  },
  inputView: {
    gap: 20,
    paddingHorizontal: 40,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    height: "70%"
    // paddingTop: "50%",
  },
  passwordRulesLabel: {}
});
