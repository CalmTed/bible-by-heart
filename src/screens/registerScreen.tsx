import React, { FC, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useApp } from "..//utils/useApp";
import { Header } from "..//components/Header";
import { Button, IconButton } from "..//components/Button";
import { navigateWithState } from "..//screeenManagement";
import { IconName } from "..//components/Icon";
import { SCREEN } from "..//constants";
import { Input } from "..//components/Input";
import { Checkbox } from "..//components/Checkbox";

export const RegisterScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

  const [tempEmail, setTempEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordRepeat, setTempPasswordRepeat] = useState("");
  const [legalCheckBox, setLegalCheckBox] = useState(false);

  // const handleLoginImputChange = () => {};

  const handleRegisterSubmit = () => {
    Alert.alert("Work in progress", "Soon, but not yet");
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
        <View style={registerStyle.legalCheckWrapper}>
          <TouchableOpacity
            onPress={() => {
              setLegalCheckBox(!legalCheckBox);
            }}
            style={registerStyle.legal}
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
          onPress={handleRegisterSubmit}
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
  legal: {}
});
