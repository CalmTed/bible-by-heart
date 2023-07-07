import { StackNavigationHelpers } from '@react-navigation/stack/src/types';
import { useEffect, useRef, useState } from 'react';
import { AppStateModel } from '../models';
import { ThemeAndColorsModel, getTheme } from './getTheme';
import { WORD, createT } from '../l10n';
import { LANGCODE, SCREEN, storageName } from '../constants';
import storage from '../storage';
import * as Notifications from 'expo-notifications';
import {
    checkSchedule,
    registerForPushNotificationsAsync
} from '../tools/notifications';
import { navigateWithState } from '../screeenManagement';

type useAppModel = (arg: {
    route: any;
    navigation: StackNavigationHelpers;
}) => {
    state: AppStateModel;
    setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
    t: (w: WORD) => string;
    theme: ThemeAndColorsModel;
};

export const useApp: useAppModel = ({ route, navigation }) => {
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
    // const responseListener = useRef(undefined as unknown as Notifications.Subscription);
    const notificationListener = useRef(
        undefined as unknown as Notifications.Subscription
    );

    useEffect(() => {
        if (state.passages.length > 0 && state.settings.remindersEnabled) {
            registerForPushNotificationsAsync(); //.then(token => setExpoPushToken(token));

            notificationListener.current =
                Notifications.addNotificationResponseReceivedListener(
                    (notification) => {
                        //save to user reaction history
                        //weekday, time, success
                        //on scheduling we do the same but with fail status
                        console.log(
                            'responce received',
                            notification.notification.request.content
                        );
                        //reschedule reminders
                        checkSchedule(state);
                    }
                );

            // Notifications.registerTaskAsync(backgroundNotificationName);
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true
                })
            });
        }
        return () => {
            if (state.passages.length > 0 && state.settings.remindersEnabled) {
                Notifications.removeNotificationSubscription(
                    notificationListener.current
                );
                // Notifications.removeNotificationSubscription(responseListener.current);
                // Notifications.unregisterTaskAsync(backgroundNotificationName);
            }
        };
    }, []);

    useEffect(
        () => {
            const listenerFunction = (e: any) => {
                if (
                    e.data.action.type === 'GO_BACK' &&
                    route.name !== SCREEN.home
                ) {
                    // Prevent default behavior of leaving the screen
                    e.preventDefault();
                    navigateWithState({
                        navigation,
                        screen: SCREEN.home,
                        state
                    });
                }
            };
            (navigation as any).addListener('beforeRemove', listenerFunction);
            return () => {
                (navigation as any).removeListener(
                    'beforeRemove',
                    listenerFunction
                );
            };
        },
        [JSON.stringify(state)] //need latest state so it would be updated on navigating
    );

    const theme = getTheme(state.settings.theme);
    const t = createT(state?.settings?.langCode || LANGCODE.en);

    return {
        state,
        setState,
        t,
        theme
    };
};
