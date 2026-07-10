import { useEffect, useRef, useState } from "react";
import { ActionName, AppStateModel } from "../models";
import { ThemeAndColorsModel, getThemeFromScheme } from "./getThemeFromScheme";
import { WORD, createT } from "../l10n";
import {
  DAY,
  LANGCODE,
  SCREEN,
  STORAGE_BACKUP_NAME,
  STORAGE_NAME
} from "../constants";
import storage from "../storage";
import * as Notifications from "expo-notifications";
import {
  checkSchedule,
  registerForPushNotificationsAsync
} from "../utils/notifications";
import { navigateWithState } from "../screeenManagement";
import { useColorScheme } from "react-native";
import { logger } from "./logger";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import toastShow from "./toastShow";
import { reduce } from "./reduce";

type UseAppModel = (arg: {
  route: any;
  navigation: StackNavigationHelpers;
}) => {
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  t: (w: WORD) => string;
  theme: ThemeAndColorsModel;
};

export const useApp: UseAppModel = ({ route, navigation }) => {
  const oldState = route.params as AppStateModel;
  const [state, setState] = useState(oldState);

  const stateString = JSON.stringify(state);
  const oldStateString = JSON.stringify(oldState);

  useEffect(() => {
    setState(oldState);
  }, [oldStateString]);

  useEffect(() => {
    storage
      .save({
        key: STORAGE_NAME,
        data: { ...state }
      })
      .catch((e) => {
        logger.error(`Error on geting data in useApp e:${e}`);
        toastShow(e, 10000);
      });

    //cheking for corruption bafore backup
    const safeObject = JSON.parse(JSON.stringify(state)) as AppStateModel;
    if ((safeObject?.lastBackup || 0) < new Date().getTime() - DAY) {
      storage
        .save({
          key: STORAGE_BACKUP_NAME,
          data: safeObject
        })
        .then(() => {
          setState({
            ...state,
            lastBackup: new Date().getTime()
          });
        });
    }
  }, [stateString]);

  // const [expoPushToken, setExpoPushToken] = useState("" as undefined | string);
  // const [notification, setNotification] = useState(undefined as unknown as Notifications.Notification);
  // const responseListener = useRef(undefined as unknown as Notifications.Subscription);
  const notificationListener = useRef(
    undefined as unknown as Notifications.Subscription
  );

  useEffect(() => {
    if (state.passages.length > 0 && state.settings.remindersEnabled) {
      registerForPushNotificationsAsync(
        state.settings?.langCode || LANGCODE.en
      ); //.then(token => setExpoPushToken(token));

      notificationListener.current =
        Notifications.addNotificationResponseReceivedListener((responce) => {
          //TODO save to user reaction history
          //weekday, time, success
          //on scheduling we do the same but with fail status
          logger.write(
            `Notification responce received. ${JSON.stringify(responce.notification.request.content)}`
          );
          logger.write(
            `Possible intent text ${responce.notification.request.content.data?.["android.intent.extra.TEXT"]}`
          );
          //handling intents
          if (
            typeof responce.notification.request.content.data?.[
              "androind.intent.extra.TEXT"
            ] !== "undefined"
          ) {
            const passageText =
              responce.notification.request.content.data?.[
                "android.intent.extra.TEXT"
              ] || "";
            navigateWithState({
              navigation,
              screen: SCREEN.listPassage,
              state,
              extraData: {
                passageText
              }
            });
          }
          if (
            typeof responce.notification.request.content.data?.id !==
            "undefined"
          ) {
            logger.write(
              `Recieved responce from reminder with id ${responce.notification.request.content.data?.id}`
            );
            //if there are train mode select first one

            const newState =
              reduce(state, {
                name: ActionName.generateTests,
                trainModeId: state.settings.trainModesList?.[0]?.id
              }) || state;

            navigateWithState({
              navigation,
              screen: SCREEN.test,
              state: newState
            });
          }
          //reschedule reminders
          checkSchedule(state);
          //TODO go to daily ractice screen
        });

      // Notifications.registerTaskAsync(backgroundNotificationName);
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false
        })
      });
    }
    return () => {
      if (state.passages.length > 0 && state.settings.remindersEnabled) {
        // Notifications.removeNotificationSubscription(
        //   notificationListener.current
        // );
        // Notifications.removeNotificationSubscription(responseListener.current);
        // Notifications.unregisterTaskAsync(backgroundNotificationName);
      }
    };
  }, []);

  useEffect(
    () => {
      const listenerFunction = (e: any) => {
        if (e.data.action.type === "GO_BACK" && route.name !== SCREEN.home) {
          // Prevent default behavior of leaving the screen
          e.preventDefault();
          navigateWithState({
            navigation,
            screen: SCREEN.home,
            state
          });
        }
      };
      (navigation as any).addListener("beforeRemove", listenerFunction);
      return () => {
        (navigation as any).removeListener("beforeRemove", listenerFunction);
      };
    },
    [state, stateString] //need latest state so it would be updated on navigating
  );
  const colorScheme = useColorScheme();
  const theme = getThemeFromScheme(state.settings.theme, colorScheme);
  const t = createT(state?.settings?.langCode || LANGCODE.en);

  return {
    state,
    setState,
    t,
    theme
  };
};
