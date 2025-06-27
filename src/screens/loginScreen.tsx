import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useApp } from "src/utils/useApp";
import { Header } from "src/components/Header";
import { Button, IconButton } from "src/components/Button";
import { navigateWithState } from "src/screeenManagement";
import { IconName } from "src/components/Icon";
import { SCREEN } from "src/constants";
import { Input } from "src/components/Input";

export const LoginScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

  const [tempEmail, setTempEmail] = useState("test@biblebyheart.app");
  const [tempPassword, setTempPassword] = useState("p@ssTest");

  const handleLoginSubmit = () => {
    Alert.alert("Work in progress", "Soon, but not yet");
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

  //one lowercase
  //one uppercase
  //one digt
  //one spectial char
  //length 8-50
  const isPasswordValid = /^[A-Za-z\d@.#$!%*?&]{8,40}$/.test(tempPassword);
  const loginPossible = isEmailValid && isPasswordValid;
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
        />
        <Input
          wrapperStyle={{ ...loginStyle.wrapperInput }}
          value={tempPassword}
          onChange={setTempPassword}
          placeholder={t("providePasswsordLabel")}
          secureTextEntry
          theme={theme}
          iconAfter={isPasswordValid ? IconName.greenCheck : IconName.redCross}
        />
        {tempPassword.length > 0 && !isPasswordValid && (
          <Text
            style={{
              ...loginStyle.passwordRulesLabel,
              color: theme.colors.redGradient2
            }}
          >
            {t("passwordRulesLabel")}
          </Text>
        )}
        <Button
          title={t("loginButton")}
          theme={theme}
          type="main"
          color="green"
          disabled={!loginPossible}
          onPress={handleLoginSubmit}
        />
      </View>
      <Button
        title={t("registerButton")}
        theme={theme}
        type="transparent"
        onPress={handleRegisterClick}
      />
    </View>
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
