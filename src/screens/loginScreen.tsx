import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { ScreenModel } from "./homeScreen";
import { useApp } from "../utils/useApp";
import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { navigateWithState } from "../screeenManagement";
import { IconName } from "../components/Icon";
import { ACCESS_TOKEN_NAME, API_LINK, REFRESH_TOKEN_NAME, SCREEN } from "../constants";
import { Input } from "../components/Input";
import { logger } from "src/utils/logger";
import { fetchAPI } from "src/services/fetch";
import * as SecureStore from "expo-secure-store";

export const LoginScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

  const [tempEmail, setTempEmail] = useState("test@biblebyheart.app");
  const [tempPassword, setTempPassword] = useState("p@ssTest");

  const handleLoginSubmit = async (loginPossible: boolean, email: string, password: string) => {
    if(loginPossible){
      try{
        const result = await fetchAPI({
          link: API_LINK.login,
          method: "POST",
          body: {
            email,
            password
          }
        })
        if(typeof result === "undefined"){
          Alert.alert(`Unknown error with authorization!`);
          return;
        }
        switch(result.response.status){
          case 200:
            if(result?.data){
              //save auth keys
              SecureStore.setItem(ACCESS_TOKEN_NAME, result.data.token);
              SecureStore.setItem(REFRESH_TOKEN_NAME, result.data.refreshToken);
              //fetch user data
              const userData = await fetchAPI({
                link: API_LINK.getUserData,
                method: "GET",
                headers: {
                  Authorization: `Bearer ${result.data.token}`
                }
              })
              if(typeof userData === "undefined"){
                Alert.alert(`Unknown error`,`Unable to get user data`);
                return;
              }
              switch(result.response.status){
                case 200: 
                  //write data to state 
                  //go to settings screen
                break;
                case 401: break;
                case 403: break;
                case 406: break;
                case 500: break;
              }
              
            }else{
              Alert.alert(`Unknown server error`,`Recieved status 200 with no data`);
            }
          break;
          case 400: Alert.alert(`Bad request data 400`,`${result.response.statusText}`);break;
          case 401: Alert.alert(`Unable to login 401`,`${result.response.statusText}`);break;
          case 500: Alert.alert(`Server error 500`,`${result.response.statusText}`);break;
        }
      }catch(err){
        logger.error(`Cant login. Error: ${err}`);
        Alert.alert(`Unknown error with authorization!`, `${err}`);
        console.log(err)
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
          onPress={() => handleLoginSubmit(loginPossible, tempEmail, tempPassword)}
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
