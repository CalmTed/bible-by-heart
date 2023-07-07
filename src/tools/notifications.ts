import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { COLOR_DARK, DAY, HOUR, LANGCODE, MINUTE } from '../constants';
import { AppStateModel, ReminderModel, TestModel } from '../models';
import { cancelScheduledNotificationAsync } from 'expo-notifications';
import { WORD, createT } from '../l10n';
import { randomRange } from './randomizers';

export const getAutoTimeTrigger: (
    history: TestModel[]
) => Record<string, string | number | boolean> = (history) => {
    //if no history
    if (!history.length) {
        return { channelId: 'Reminders', hour: 8, minute: 0, repeats: true };
    }
    //we cant do average and cant do just most common hour
    //but we need to find most probable second
    const hourAndMinutes = history
        .filter(
            (histItem) =>
                new Date().getTime() - histItem.triesDuration[0][0] <
                DAY * 30000
        ) //just last month
        .map((histItem) => {
            const d = new Date(histItem.triesDuration[0][0]);
            return [d.getHours(), d.getMinutes()];
        });
    const mostCommonHour = new Array(24)
        .fill(0)
        .map((z, i) => hourAndMinutes.filter((h) => h[0] === i).length)
        .map((a, i) => [a, i])
        .sort((a, b) => b[0] - a[0])[0][1];
    const minutesGroups = 5;
    const mostCommon5Minutes = new Array(60 / minutesGroups)
        .fill(0)
        .map(
            (z, i) =>
                hourAndMinutes.filter(
                    (h) =>
                        h[1] > i * minutesGroups &&
                        h[1] < (i + 1) * minutesGroups
                ).length
        )
        .map((a, i) => [a, i])
        .sort((a, b) => b[0] - a[0])[0][1];
    return {
        channelId: 'Reminders',
        hour: mostCommonHour,
        minute: mostCommon5Minutes * 5,
        repeats: true
    };
};

//usualy activated from reducer
export const checkSchedule = async (state: AppStateModel) => {
    //get all remiders
    const allScheduled =
        await Notifications.getAllScheduledNotificationsAsync();
    //get reminders from state
    const allUserSetted = state.settings.remindersList;
    allScheduled.map(async (scheduled) => {
        //if removed, disabled, autotimed, or disabledAll
        const removeAll =
            !state.settings.remindersEnabled ||
            state.settings.remindersSmartTime;
        if (!scheduled.content.data.itemString) {
            await cancelScheduledNotificationAsync(scheduled.identifier);
            return;
        }
        const itemData = JSON.parse(
            scheduled.content.data.itemString
        ) as ReminderModel;
        const fromState = allUserSetted.find(
            (setted) => setted.id === itemData.id
        );
        if (removeAll || !fromState || !fromState?.enabled) {
            // await cancelScheduledNotificationAsync(scheduled.identifier)
        }
    });

    //we need to return here b.c. we need to remove existing first b.c. maybe we just disabled reminders
    if (!state.settings.remindersEnabled) {
        return;
    }

    const t = createT(state?.settings?.langCode || LANGCODE.en);
    const randNum = randomRange(1, 3);

    // IF ENABLED BUT AUTOMATIC TIME
    if (state.settings.remindersSmartTime) {
        await schedulePushNotification(
            t(`notificationTitle${randNum}` as WORD),
            t(`notificationBody${randNum}` as WORD),
            {},
            getAutoTimeTrigger(state.testsHistory)
        );
    } else {
        //IF ENABLED AND NOT AUTOMATIC TIME
        //get scheduled reminders
        const getNextActivationTime: (item: ReminderModel) => Date = (item) => {
            // what weekday today?
            const d = new Date();
            const timeNow =
                d.getHours() * HOUR + d.getMinutes() * MINUTE + d.getSeconds();
            const today = d.getDay() ? d.getDay() - 1 : 6;
            const days = Object.entries(item.days);
            // whats next weekday on item
            const getNextIndex = (start: number, array: boolean[]) => {
                let i = 0;
                let n = undefined;
                while (i < array.length && typeof n === 'undefined') {
                    const marker =
                        i + start > array.length - 1
                            ? start + i - array.length
                            : start + i;
                    if (array[marker]) {
                        n = i;
                    }
                    i++;
                }
                return i - 1;
            };
            const nextIndex = getNextIndex(
                today,
                days.map((d) => d[1])
            );
            const nextIndexWithoutToday = getNextIndex(
                today,
                days.map((d) => d[1]).map((v, i) => (i !== today ? v : !v))
            );
            const daysInFuture = !nextIndex
                ? item.timeInSec > timeNow
                    ? 0
                    : days.filter((d) => d[1]).length <= 1
                    ? 7
                    : nextIndexWithoutToday
                : nextIndex;
            // what time to do it
            const trigger = new Date(d.getTime() + daysInFuture * DAY * 1000);
            const h = Math.floor(item.timeInSec / HOUR);
            const m = Math.floor((item.timeInSec - h * HOUR) / MINUTE);
            trigger.setHours(h);
            trigger.setMinutes(m);
            trigger.setSeconds(0);
            return trigger;
        };
        allUserSetted.map(async (item) => {
            //ignore disabled
            if (!item.enabled) {
                return;
            }
            const scheduledRiminder = allScheduled.find((scheduledItem) =>
                !scheduledItem.content.data.itemString
                    ? false
                    : JSON.parse(scheduledItem.content.data.itemString).id ===
                      item.id
            );
            if (!scheduledRiminder) {
                //add reminder
                await schedulePushNotification(
                    t(`notificationTitle${randNum}` as WORD),
                    t(`notificationBody${randNum}` as WORD),
                    { itemString: JSON.stringify(item) },
                    getNextActivationTime(item)
                );
            } else {
                //change reminder
                if (
                    JSON.stringify(item) !==
                    scheduledRiminder.content.data.itemString
                ) {
                    await cancelScheduledNotificationAsync(
                        scheduledRiminder.identifier
                    );
                    await schedulePushNotification(
                        t(`notificationTitle${randNum}` as WORD),
                        t(`notificationBody${randNum}` as WORD),
                        { itemString: JSON.stringify(item) },
                        getNextActivationTime(item)
                    );
                }
            }
        });
    }
};

export const schedulePushNotification = async (
    title: string = 'Hi!',
    body: string = 'Would you like to click me?',
    data: Record<string, any> = {},
    trigger: Notifications.NotificationTriggerInput = null
) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: data
        },
        trigger
    });
};

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('Reminders', {
            name: 'Reminders', //TODO translate if needed
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: COLOR_DARK.mainColor
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get token for notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
};
