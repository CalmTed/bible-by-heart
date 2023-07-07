import { Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { COLOR_DARK, DAY, HOUR, LANGCODE, MINUTE } from "../constants";
import { AppStateModel, ReminderModel } from "../models";
import { cancelScheduledNotificationAsync } from "expo-notifications";
import { WORD, createT } from "../l10n";
import { randomRange } from "./generateTests";


//usualy activated from reducer
export const checkSchedule = async (state: AppStateModel) => {

  console.log("TODO check permissions here")
  console.log("TODO if reminders disabled after is was scheduled")
  console.log("TODO auto time")
  if(!state.settings.remindersEnabled){
    return;
  }
  const t = createT(state?.settings?.langCode || LANGCODE.en);
  //get reminders from state
  const allUserSetted = state.settings.remindersList
  //get scheduled reminders
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync()
  const getNextActivationTime:(item: ReminderModel) => Date = (item) => {
    // what weekday today?
    const d = new Date();
    const timeNow = d.getHours() * HOUR + d.getMinutes() * MINUTE + d.getSeconds()
    const today = d.getDay() ? d.getDay() -1 : 6;
    const days = Object.entries(item.days);
    // whats next weekday on item
    const getNextIndex = (start: number, array: boolean[]) => {
      let i = 0
      let n = undefined
      while(i < array.length && typeof n === "undefined"){
        const marker = i + start > array.length-1 ? start + i - array.length : start + i;
        if(array[marker]){
          n = i
        }
        i++
      }
      return i-1;
    }
    const nextIndex = getNextIndex(today, days.map(d => d[1]))
    const nextIndexWithoutToday = getNextIndex(today, days.map(d => d[1]).map((v,i) => i !== today ? v : !v))
    const daysInFuture = 
      !nextIndex ? 
        item.timeInSec > timeNow ? 
          0 :
          days.filter(d => d[1]).length <= 1 ?
            7:
            nextIndexWithoutToday:
        nextIndex;
    // what time to do it
    const trigger = new Date(d.getTime() + (daysInFuture * DAY * 1000));
    const h = Math.floor(item.timeInSec / HOUR)
    const m = Math.floor((item.timeInSec - (h * HOUR)) / MINUTE)
    trigger.setHours(h)
    trigger.setMinutes(m);
    trigger.setSeconds(0);
    return trigger;
  }
  allUserSetted.map(async item => {
    //ignore disabled
    if(!item.enabled){
      return;
    }
    const randNum = randomRange(1,3);
    const scheduledRiminder = allScheduled.find(scheduledItem => JSON.parse(scheduledItem.content.data.itemString).id === item.id)
    if(!scheduledRiminder){
      //get reminders to add
      await schedulePushNotification(t(`notificationTitle${randNum}` as WORD), t(`notificationBody${randNum}` as WORD), {itemString: JSON.stringify(item)}, getNextActivationTime(item))
    }else{  
      //get reminders to change
      if(JSON.stringify(item) !== scheduledRiminder.content.data.itemString){
        await cancelScheduledNotificationAsync(scheduledRiminder.identifier)
        await schedulePushNotification(t(`notificationTitle${randNum}` as WORD), t(`notificationBody${randNum}` as WORD), {itemString: JSON.stringify(item)}, getNextActivationTime(item))
        }else{
        }
    }
  })
  //get remiders to remove
  allScheduled.map(async scheduled => {
    //if removed, disabled, autotimed, or disabledAll
    const removeAll = !state.settings.remindersEnabled || state.settings.remindersSmartTime
    const itemData = JSON.parse(scheduled.content.data.itemString) as ReminderModel
    const fromState = allUserSetted.find(setted => setted.id === itemData.id)
    if(removeAll || !fromState || !fromState?.enabled){
      await cancelScheduledNotificationAsync(scheduled.identifier)
    }
  })
} 


export async function schedulePushNotification(
  title: string = "Hi!",
  body: string = "Would you like to click me?",
  data: Record<string, any> = {},
  trigger: Notifications.NotificationTriggerInput = null
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: data,
    },
    trigger
  });
}


export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('Reminders', {
      name: 'Reminders',//TODO translate if needed
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: COLOR_DARK.mainColor,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}