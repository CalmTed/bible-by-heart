import { StackNavigationHelpers } from "@react-navigation/stack/src/types";
import { useEffect, useRef, useState } from "react"
import { AppStateModel } from "../models";
import { ThemeAndColorsModel, getTheme } from "./getTheme";
import { WORD, createT } from "../l10n";
import { LANGCODE, backgroundNotificationName, storageName } from "../constants";
import storage from '../storage';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../tools/notifications';

type useAppModel = (arg: {route: any, navigation: StackNavigationHelpers}) => {
  state: AppStateModel,
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>
  t: (w: WORD) => string
  theme: ThemeAndColorsModel
}

export const useApp:useAppModel = ({
  route,
  navigation
}) => {

  const oldState = route.params as AppStateModel;
    const [state, setState] = useState(oldState);
    useEffect(() => {
        setState(oldState);
    }, [JSON.stringify(oldState)]);

    useEffect(() => {
        storage
            .save({
                key: storageName,
                data: { ...state }
            })
            .then((e) => {});
    }, [JSON.stringify(state)]);

    // const [expoPushToken, setExpoPushToken] = useState("" as undefined | string);
    // const [notification, setNotification] = useState(undefined as unknown as Notifications.Notification);
    const notificationListener = useRef(undefined as unknown as Notifications.Subscription);
    const responseListener = useRef(undefined as unknown as Notifications.Subscription);

    useEffect(() => {
        registerForPushNotificationsAsync()//.then(token => setExpoPushToken(token));
    
        notificationListener.current = Notifications.addNotificationResponseReceivedListener(notification => {
            console.log("responce received", notification.notification.request.content.data)
            //dissmiss
            //navigate to test
            //reschedule reminders
        });

        Notifications.registerTaskAsync(backgroundNotificationName);

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
        });

        return () => {
          Notifications.removeNotificationSubscription(notificationListener.current);
          Notifications.removeNotificationSubscription(responseListener.current);
          Notifications.unregisterTaskAsync(backgroundNotificationName);
        };
      }, []);

    const theme = getTheme(state.settings.theme);
    const t = createT(state?.settings?.langCode || LANGCODE.en);

  return {
    state,
    setState,
    t,
    theme
  }
}