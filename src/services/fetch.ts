import Constants from "expo-constants";
import {
  ACCESS_TOKEN_NAME,
  API_LINK,
  API_VERSION,
  APIVERSION_LAST_CHECK,
  APIVERSION_MAX_TIME,
  APIVERSION_STATUS,
  REFRESH_TOKEN_NAME,
  SCREEN
} from "../constants";
import { logger } from "../utils/logger";
import { ActionName, AppStateModel } from "../models";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import { reduce } from "../utils/reduce";
import { navigateWithState } from "../screeenManagement";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";
import storage from "../storage";
import { Alert } from "react-native";

const HOST = Constants.expoConfig?.extra?.HOST || "";
if (HOST === "") {
  logger.error("Unable to get HOST name");
}
interface fetchResponseModel {
  response: Record<string, any>;
  data?: Record<string, any>;
}
export const fetchAPI: (a: {
  link: API_LINK;
  method: "POST" | "GET" | "DELETE";
  logoutMethods: {
    //mandatory, in case of invalid refresh token
    state: AppStateModel;
    setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
    navigation: StackNavigationHelpers;
    screen: SCREEN;
  };
  headers?: Record<string, string>;
  body?: Record<string, any>; //without JSON.stringify()
}) => Promise<fetchResponseModel | undefined> = async ({
  link,
  method,
  logoutMethods,
  headers,
  body
}) => {
  try {
    const initiateLogout: (
      state: AppStateModel,
      setState: React.Dispatch<React.SetStateAction<AppStateModel>>,
      navigation: StackNavigationHelpers,
      screen: SCREEN
    ) => Promise<void> = async (state, setState, navigation, screen) => {
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
        screen: screen,
        state: newState
      });
      logger.write(`Logging out b.c. of invalid token`);
    };
    //if headers have auth value, then check if token valid
    //if not, than refresh
    //if refresh token is invalid too, then initiate logout - how do we do it from here?
    //and only then send original request
    if (headers?.Authorization?.includes("Bearer")) {
      const token = headers.Authorization.replace("Bearer ", "");
      const tokenPayload = JSON.parse(
        token
          .split(".")
          .map((part) =>
            Buffer.from(
              part.replace(/-/g, "+").replace(/_/g, "/"),
              "base64"
            ).toString()
          )[1]
      );
      if (tokenPayload.exp * 1000 < new Date().getTime()) {
        const refreshToken = SecureStore.getItem(REFRESH_TOKEN_NAME) as string;
        const refreshTokenPayload = JSON.parse(
          refreshToken
            .split(".")
            .map((part) =>
              Buffer.from(
                part.replace(/-/g, "+").replace(/_/g, "/"),
                "base64"
              ).toString()
            )[1]
        );
        if (refreshTokenPayload.exp * 1000 < new Date().getTime()) {
          const response = await fetch(HOST + API_LINK.refreshToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accessToken: token,
              refreshToken: refreshToken
            })
          });
          if (response.ok) {
            const newTokenData = await response.json();
            if (
              typeof newTokenData.newAccessToken !== "undefined" &&
              typeof newTokenData.refreshToken !== "undefined"
            ) {
              //updating token
              SecureStore.setItem(
                ACCESS_TOKEN_NAME,
                newTokenData.newAccessToken
              );
              SecureStore.setItem(
                REFRESH_TOKEN_NAME,
                newTokenData.refreshToken
              );
            }
          } else {
            logger.error(
              `Not OK responce for link:${link} status: ${response.status} statusTest: ${response.statusText}`
            );
            return { response };
          }
        } else {
          //loging out
          initiateLogout(
            logoutMethods.state,
            logoutMethods.setState,
            logoutMethods.navigation,
            logoutMethods.screen
          );
        }
      }
    }

    //api version check
    //get time of last check
    //if checked longer than a minute ago - check again
    //if status(new or old) is false - abort the fetch and show the message

    const apiVersionLastCheck = await storage
      .load({
        key: APIVERSION_LAST_CHECK
      })
      .catch((e) => {
        logger.error(`Error on geting data in fetch e:${e}`);
      });
    if (
      new Date().getTime() >
      apiVersionLastCheck + APIVERSION_MAX_TIME * 1000
    ) {
      const apiVersionResponce = (await fetch(HOST + API_LINK.apiVersion, {
        method: "GET"
      })) as any | undefined;
      const versionData = await apiVersionResponce.json();
      if (typeof versionData?.version !== "undefined") {
        await storage.save({
          key: APIVERSION_LAST_CHECK,
          data: new Date().getTime()
        });
        const isVersionValid = versionData.version === API_VERSION;
        await storage.save({
          key: APIVERSION_STATUS,
          data: isVersionValid
        });
        if (isVersionValid === false) {
          Alert.alert(
            "Версія застосунку застаріла, будь ласка, онови",
            "API version in incompatible with the app. Please update the app"
          );
          return; ///ABORTING THE FETCH
        }
      }
    } else {
      //checked ricently
      const apiVersionStatus = await storage
        .load({
          key: APIVERSION_STATUS
        })
        .catch((e) => {
          logger.error(`Error on geting data in fetch e:${e}`);
        });
      if (apiVersionStatus === false) {
        Alert.alert(
          "Версія застосунку застаріла, будь ласка, онови",
          "API version in incompatible with the app. Please update the app"
        );
        return; /////ABORTING THE FETCH
      }
    }
    const response = await fetch(HOST + link, {
      method: method,
      headers: headers,
      body: JSON.stringify(body)
    });
    if (response.ok) {
      try {
        const data = await response.json();
        return {
          response,
          data
        };
      } catch (err) {
        return {
          response,
          error: err
        };
      }
    } else {
      logger.error(
        `Not OK responce for link:${link} status: ${response.status} statusTest: ${response.statusText}`
      );
      return { response };
    }
  } catch (error) {
    logger.error("Failed to fetch from API. Error:" + error);
  }

  return undefined;
};
