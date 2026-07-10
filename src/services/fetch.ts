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
import { isTokenExpired } from "../utils/isTokenExpired";
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
    //if headers have an auth value, check whether the access token is still valid
    //if it expired: refresh it using the refresh token (while that is still valid)
    //if the refresh token expired too: initiate logout
    //then send the original request with the (possibly refreshed) token
    let currentHeaders = headers;
    if (currentHeaders?.Authorization?.includes("Bearer")) {
      const token = currentHeaders.Authorization.replace("Bearer ", "");
      if (isTokenExpired(token)) {
        const refreshToken = SecureStore.getItem(REFRESH_TOKEN_NAME) as string;
        if (!isTokenExpired(refreshToken)) {
          //refresh token still valid → exchange it for a fresh access token
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
              //apply the fresh access token to the outgoing request
              currentHeaders = {
                ...currentHeaders,
                Authorization: `Bearer ${newTokenData.newAccessToken}`
              };
              logger.write("Token refreshed");
            }
          } else {
            logger.error(
              `Not OK responce for link:${link} status: ${response.status} statusTest: ${response.statusText}`
            );
            return { response };
          }
        } else {
          //refresh token expired too → logging out
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
        logger.error(`Error on geting last version check data in fetch`);
      });
    if (
      new Date().getTime() > apiVersionLastCheck + APIVERSION_MAX_TIME * 1000 ||
      typeof apiVersionLastCheck === "undefined"
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
          logger.error(
            `Trying to fetch data with an outdated app: app expects APIVersion: ${API_VERSION}, current APIVersion: ${versionData.version}`
          );
          Alert.alert(
            "Версія застосунку застаріла, будь ласка, онови",
            "API version in incompatible with the app. Please update the app"
          );
          return; ///ABORTING THE FETCH
        }
      } else {
        logger.error(`Error on geting last version check data in fetch`);
      }
    } else {
      //checked ricently
      const apiVersionStatus = await storage
        .load({
          key: APIVERSION_STATUS
        })
        .catch((e) => {
          logger.error(
            `Error on geting api version check status local data in fetch`
          );
        });
      if (apiVersionStatus === false) {
        logger.error(`Trying to fetch data with an outdated app again...`);
        Alert.alert(
          "Версія застосунку застаріла, будь ласка, онови",
          "API version in incompatible with the app. Please update the app"
        );
        return; /////ABORTING THE FETCH
      }
    }
    const response = await fetch(HOST + link, {
      method: method,
      headers: currentHeaders,
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
        logger.error(
          `Unable to parce OK responce data. Responce: ${JSON.stringify(response)}, Error: ${err}`
        );
        return {
          response,
          error: err
        };
      }
    } else {
      const bodyWithoutPassword =
        typeof body?.password !== "undefined"
          ? { ...body, password: "***", email: "***" }
          : body;
      const headersWithoutSecrets = currentHeaders?.Authorization?.includes(
        "Bearer"
      )
        ? { ...currentHeaders, Authorization: "Bearer ***" }
        : currentHeaders;
      logger.error(
        `Not OK responce for link:${link} method: ${method} headers: ${JSON.stringify(headersWithoutSecrets)} body: ${JSON.stringify(bodyWithoutPassword)} status: ${response.status} statusTest: ${response.statusText}, JSON: ${JSON.stringify(response)}`
      );
      return { response };
    }
  } catch (error) {
    logger.error("Failed to fetch from API. Error:" + error);
  }

  return undefined;
};
