import React, { FC, useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useAppContext } from "../context/AppContext";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
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
import { ActionName, AppStateModel, ScreenPropsModel } from "../models";
import { reduce } from "../utils/reduce";

export const LoginScreen: FC<ScreenPropsModel<SCREEN.login>> = ({
  navigation
}) => {
  const { t, setState, theme } = useAppContext();

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
                  logger.write(`Authinicated as ${userData?.data?.userName}`);
                  // Functional updater, not reduce(state) + setState: this runs
                  // two awaited requests after `state` was read, and `applang`
                  // has to compare against the language the app is in NOW
                  // rather than the one it was in when the login started.
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
                  navigation.navigate(SCREEN.settings);
                  break;
                case 400:
                  logger.error(
                    `Login geting data: Error 400: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netCheckDataAndRetry")
                  );
                  break;
                case 401:
                  logger.error(
                    `Login geting data: Error 401: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netSessionExpired")
                  );
                  break;
                case 403:
                  logger.error(
                    `Login geting data: Error 403: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netTryAgainLater")
                  );
                  break;
                case 406:
                  logger.error(
                    `Login geting data: Error 406: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netTryAgainLater")
                  );
                  break;
                case 500:
                  logger.error(
                    `Login : Error 500: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netServerErrorSub")
                  );
                  break;
                default:
                  logger.error(
                    `Login geting data: Unexpected status ${userData.response.status}: ${JSON.stringify(userData.response)}`
                  );
                  Alert.alert(
                    t("netUnableToGetUserData"),
                    t("netTryAgainLater")
                  );
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
            Alert.alert(t("netBadRequestData400"), t("netCheckDataAndRetry"));
            break;
          case 401:
            logger.error(
              `Login: Error 401: ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netUnauthorized401"), t("netWrongCredentials"));
            break;
          case 500:
            logger.error(
              `Login: Error 500: ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netServerError500"), t("netServerErrorSub"));
            break;
          default:
            logger.error(
              `Login: Unexpected status ${result.response.status}: ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netUnknownError"), t("netTryAgainLater"));
        }
      } catch (err) {
        logger.error(`Cant login. Error: ${err}`);
        Alert.alert(t("newUnknownErrorAuth"), `${err}`);
      }
    }
  };

  const handleRegisterClick = () => {
    navigation.navigate(SCREEN.register);
  };
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    tempEmail
  );
  // Login accepts either an email or a username (same username rule as registration).
  // The server matches the value against email OR userName.
  const isUserNameValid = /^[A-Za-z]{1}[A-Za-z0-9]{2,}$/.test(tempEmail);
  const isIdentifierValid = isEmailValid || isUserNameValid;

  // Login must NOT enforce password-format rules (those belong on the register
  // screen and are enforced server-side). Requiring only a non-empty password lets
  // existing accounts — e.g. the store-review demo account — sign in regardless of
  // how their password is shaped.
  const isPasswordEntered = tempPassword.length > 0;
  const loginPossible = isIdentifierValid && isPasswordEntered;
  return (
    <ScrollView
      contentContainerStyle={{ ...theme.theme.view, ...theme.theme.screen }}
    >
      <Header
        title={t("loginScreenTitle")}
        onBack={() => navigation.navigate(SCREEN.settings)}
      />
      <View style={{ ...theme.theme.view, ...loginStyle.inputView }}>
        <Input
          wrapperStyle={{ ...loginStyle.wrapperInput }}
          value={tempEmail}
          onChange={setTempEmail}
          placeholder={t("provideEmailOrUsernameLabel")}
          inputMode="text"
          iconAfter={
            isIdentifierValid ? IconName.greenCheck : IconName.redCross
          }
          autoComplete="username"
        />
        <Input
          wrapperStyle={{ ...loginStyle.wrapperInput }}
          value={tempPassword}
          onChange={setTempPassword}
          placeholder={t("providePasswsordLabel")}
          secureTextEntry
          iconAfter={
            isPasswordEntered ? IconName.greenCheck : IconName.redCross
          }
          autoComplete="password"
        />
        <Button
          title={t("loginButton")}
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
