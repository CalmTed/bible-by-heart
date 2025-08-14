import React, { FC, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useApp } from "..//utils/useApp";
import { Header } from "..//components/Header";
import { Button, IconButton } from "..//components/Button";
import { navigateWithState } from "..//screeenManagement";
import { IconName } from "..//components/Icon";
import { API_LINK, PRIVACY_POLICY_LINK, SCREEN, TERMS_OF_SERVICE_LINK } from "..//constants";
import { Input } from "..//components/Input";
import { Checkbox } from "..//components/Checkbox";
import { fetchAPI } from "../services/fetch"
import { logger } from "src/utils/logger";

export const RegisterScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

  const [tempEmail, setTempEmail] = useState("test@biblebyheart.app");
  const [tempPassword, setTempPassword] = useState("passwordA@2");
  const [tempPasswordRepeat, setTempPasswordRepeat] = useState("passwordA@2");
  const [legalCheckBox, setLegalCheckBox] = useState(false);

  const handleOpenLink = async (url: string) => {
    await Linking.openURL(url)
  }

  const handleRegisterSubmit = async (regPossible: boolean, email: string, password: string) => {
    if(regPossible){
      try{
        const result = await fetchAPI({
          link: API_LINK.createUser,
          method: "POST",
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: {
              userName: email.split("@")[0],
              password: password,
              email: email,
              appLanguage: state.settings.langCode
          }
        })
        if(typeof result === "undefined"){
          Alert.alert(`Unknown error with registration!`);
          return;
        }
        switch(result.response.status){
          case 200: 
            Alert.alert(`Success!`,`Welcome! Now you can login`);
            navigateWithState({
              navigation,
              screen: SCREEN.login,
              state
            });
             break;
          case 400:
            Alert.alert(`Bad request data 400`,`${result.response.statusText}`);break;
          case 409:
            Alert.alert(`Unable to create user 409`,`${result.response.statusText}`);break;
          case 500:
            Alert.alert(`Server error 500`,`${result.response.statusText}`);break;
        }
      }catch(err){
        logger.error(`Cant register. Error: ${err}`);
        console.log(err)
      }
    }
  };

  const handleLoginClick = () => {
    navigateWithState({
      navigation,
      screen: SCREEN.login,
      state
    });
  };
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    tempEmail
  );

  //one lowercase
  //one uppercase
  //one digt
  //one spectial char
  //length 8-50
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,40}$/.test(
      tempPassword
    );
  const isRepeatPasswordValid =
    isPasswordValid && tempPassword === tempPasswordRepeat;
  const regPossible =
    isEmailValid && isPasswordValid && isRepeatPasswordValid && legalCheckBox;
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
                navigation,
                screen: SCREEN.settings,
                state
              })
            }
          />,
          <Text key="title" style={theme.theme.headerText}>
            {t("registerScreenTitle")}
          </Text>
        ]}
      />
      <View style={{ ...theme.theme.view, ...registerStyle.inputView }}>
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempEmail}
          onChange={setTempEmail}
          placeholder={t("provideEmailLabel")}
          theme={theme}
          inputMode="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          iconAfter={isEmailValid ? IconName.greenCheck : IconName.redCross}
        />
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempPassword}
          onChange={setTempPassword}
          placeholder={t("providePasswsordLabel")}
          secureTextEntry
          theme={theme}
          iconAfter={isPasswordValid ? IconName.greenCheck : IconName.redCross}
        />
        <Input
          wrapperStyle={{ ...registerStyle.wrapperInput }}
          value={tempPasswordRepeat}
          onChange={setTempPasswordRepeat}
          placeholder={t("providePasswsordAgainLabel")}
          secureTextEntry
          theme={theme}
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
          <TouchableOpacity onPress={() => handleOpenLink(TERMS_OF_SERVICE_LINK)}>
            <Text style={{...{color: theme.colors.text}, ...registerStyle.legalLinkText}}>{t("openLegalTermsOfService")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink(PRIVACY_POLICY_LINK)}>
            <Text style={{...{color: theme.colors.text}, ...registerStyle.legalLinkText}}>{t("openLegalPrivacyPolicy")}</Text>
          </TouchableOpacity>
        </View>
        <View style={registerStyle.legalCheckWrapper}>
          
          <TouchableOpacity
            onPress={() => {
              setLegalCheckBox(!legalCheckBox);
            }}
          >
            <Checkbox isEnabled={legalCheckBox} theme={theme} />
          </TouchableOpacity>
          <Text style={{ color: theme.colors.text }}>
            {t("legalCheckLabel")}
          </Text>
        </View>
        <Button
          title={t("registerButton")}
          theme={theme}
          type="main"
          color="green"
          disabled={!regPossible}
          onPress={() => handleRegisterSubmit(regPossible, tempEmail, tempPassword)}
        />
      </View>
      <Button
        title={t("loginButton")}
        theme={theme}
        type="transparent"
        onPress={handleLoginClick}
      />
    </View>
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
    gap: 10,
  },
  legalLinkText: {
    textDecorationLine: "underline"
  }
});
