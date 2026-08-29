import React, { FC, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { IconName } from "../components/Icon";
import {
  API_LINK,
  PRIVACY_POLICY_LINK,
  SCREEN,
  TERMS_OF_SERVICE_LINK
} from "../constants";
import { ScreenPropsModel } from "../models";
import { Input } from "../components/Input";
import { Checkbox } from "../components/Checkbox";
import { fetchAPI } from "../services/fetch";
import { logger } from "../utils/logger";
import Constants from "expo-constants";

export const RegisterScreen: FC<ScreenPropsModel<SCREEN.register>> = ({
  navigation
}) => {
  const { state, t, theme, setState } = useAppContext();

  const [tempUserName, setTempUserName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordRepeat, setTempPasswordRepeat] = useState("");
  const [legalCheckBox, setLegalCheckBox] = useState(false);

  const handleOpenLink = async (url: string) => {
    await Linking.openURL(url);
  };

  const handleRegisterSubmit = async (
    regPossible: boolean,
    email: string,
    password: string,
    userName: string
  ) => {
    if (regPossible) {
      try {
        const result = await fetchAPI({
          link: API_LINK.createUser,
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: {
            userName: userName,
            password: password,
            email: email,
            appLanguage: state.settings.langCode
          },
          logoutMethods: {
            state,
            setState,
            navigation,
            screen: SCREEN.register
          }
        });
        if (typeof result === "undefined") {
          logger.write(`Registration error. Resieved undefined result`);
          Alert.alert(t("netUnknownError"));
          return;
        }
        switch (result.response.status) {
          case 200:
            Alert.alert(t("netRegSuccess"), t("netRegSuccessSubText"));
            logger.write(`Registered as ${userName}`);
            navigation.navigate(SCREEN.login);
            break;
          case 400:
            logger.write(
              `Registration Bad request data 400 ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netBadRequestData400"), t("netCheckDataAndRetry"));
            break;
          case 409:
            logger.write(
              `Registration User conflict 409 ${JSON.stringify(result.response)}`
            );
            Alert.alert(
              t("netUnableToCreateUser409"),
              t("netUnableToCreateUser409Sub")
            );
            break;
          case 500:
            logger.write(
              `Registration Server error 500 ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netServerError500"), t("netServerErrorSub"));
            break;
          default:
            logger.write(
              `Registration unexpected status ${result.response.status} ${JSON.stringify(result.response)}`
            );
            Alert.alert(t("netUnknownError"), t("netTryAgainLater"));
        }
      } catch (err) {
        logger.error(`Cant register. Error: ${err}`);
        Alert.alert(t("newUnknownErrorAuth"), t("netTryAgainLater"));
      }
    }
  };

  const handleLoginClick = () => {
    navigation.navigate(SCREEN.login);
  };
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    tempEmail
  );
  const isUserNameValid = /^[A-Za-z]{1}[A-Za-z0-9]{2,}$/.test(tempUserName);

  //one lowercase
  //one uppercase
  //one digt
  //one spectial char
  //length 8-50
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@'.,:;~#$!%*?\-+\{\}\[\]\\\/<>&])[A-Za-z\d@'.,:;~#$!%*?\-+\{\}\[\]\\\/<>&]{8,40}$/.test(
      tempPassword
    );
  const isRepeatPasswordValid =
    isPasswordValid && tempPassword === tempPasswordRepeat;
  const regPossible =
    isEmailValid && isPasswordValid && isRepeatPasswordValid && legalCheckBox;
  return (
    <ScrollView
      contentContainerStyle={{ ...theme.theme.view, ...theme.theme.screen }}
    >
      <Header
        title={t("registerScreenTitle")}
        onBack={() => navigation.navigate(SCREEN.settings)}
      />
      <View style={{ ...theme.theme.view, ...registerStyle.inputView }}>
        {state.settings.devModeEnabled && (
          <Text style={theme.theme.text}>
            {Constants.expoConfig?.extra?.HOST || ""}
            {API_LINK.createUser}
          </Text>
        )}
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempUserName}
          onChange={setTempUserName}
          placeholder={t("provideUserNameLabel")}
          inputMode="text"
          iconAfter={isUserNameValid ? IconName.greenCheck : IconName.redCross}
          autoComplete="username-new"
        />
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempEmail}
          onChange={setTempEmail}
          placeholder={t("provideEmailLabel")}
          inputMode="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          iconAfter={isEmailValid ? IconName.greenCheck : IconName.redCross}
          autoComplete="email"
        />
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempPassword}
          onChange={setTempPassword}
          placeholder={t("providePasswsordLabel")}
          inputMode="text"
          secureTextEntry
          iconAfter={isPasswordValid ? IconName.greenCheck : IconName.redCross}
          autoComplete="password-new"
        />
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempPasswordRepeat}
          onChange={setTempPasswordRepeat}
          placeholder={t("providePasswsordAgainLabel")}
          secureTextEntry
          autoComplete="password-new"
          iconAfter={
            isRepeatPasswordValid || false
              ? IconName.greenCheck
              : IconName.redCross
          }
        />
        {tempPassword.length > 0 && !isPasswordValid && (
          <Text
            style={{
              ...registerStyle.passwordRulesLabel,
              color: theme.colors.redGradient2
            }}
          >
            {t("passwordRulesLabel")}
          </Text>
        )}
        <View style={registerStyle.legalLinkList}>
          <TouchableOpacity
            onPress={() => handleOpenLink(TERMS_OF_SERVICE_LINK)}
          >
            <Text
              style={{
                ...{ color: theme.colors.text },
                ...registerStyle.legalLinkText
              }}
            >
              {t("openLegalTermsOfService")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink(PRIVACY_POLICY_LINK)}>
            <Text
              style={{
                ...{ color: theme.colors.text },
                ...registerStyle.legalLinkText
              }}
            >
              {t("openLegalPrivacyPolicy")}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={registerStyle.legalCheckWrapper}>
          <TouchableOpacity
            onPress={() => {
              setLegalCheckBox(!legalCheckBox);
            }}
          >
            <Checkbox isEnabled={legalCheckBox} />
          </TouchableOpacity>
          <Text style={{ color: theme.colors.text }}>
            {t("legalCheckLabel")}
          </Text>
        </View>
        <Button
          title={t("registerButton")}
          type="main"
          color="green"
          disabled={!regPossible}
          onPress={() =>
            handleRegisterSubmit(
              regPossible,
              tempEmail,
              tempPassword,
              tempUserName
            )
          }
        />
      </View>
      <Button
        title={t("loginButton")}
        type="transparent"
        onPress={handleLoginClick}
      />
    </ScrollView>
  );
};

const registerStyle = StyleSheet.create({
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
  passwordRulesLabel: {},
  legalCheckWrapper: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 40
  },
  legalLinkList: {
    flexDirection: "column",
    gap: 10
  },
  legalLinkText: {
    textDecorationLine: "underline"
  }
});
