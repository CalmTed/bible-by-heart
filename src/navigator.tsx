import React, { FC } from "react";
import * as TaskManager from "expo-task-manager";
import {
  NavigationContainer,
  createNavigationContainerRef,
  LinkingOptions
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { SCREEN, BACKGROUND_NOTIFICATION_NAME } from "./constants";
import { HomeScreen } from "./screens/homeScreen";
import { ListScreen } from "./screens/listScreen";
import { PassageScreen } from "./screens/PassageScreen";
import { TestsScreen } from "./screens/testsScreen";
import { FinishScreen } from "./screens/finishScreen";
import { SettingsScreen } from "./screens/settingsScreen";
import { ListSettingsScreen } from "./screens/ListSettingsScreen";
import { TranslationsSettingsScreen } from "./screens/TranslationsSettingsScreen";
import { TestsSettingsScreen } from "./screens/TestsSettingsScreen";
import { TrainModesSettingsScreen } from "./screens/TrainModesSettingsScreen";
import { NotificationsSettingsScreen } from "./screens/NotificationsSettingsScreen";
import { RemindersSettingsScreen } from "./screens/RemindersSettingsScreen";
import { StatsSettingsScreen } from "./screens/StatsSettingsScreen";
import { AboutSettingsScreen } from "./screens/AboutSettingsScreen";
import { UserSettingsScreen } from "./screens/UserSettingsScreen";
import { StatsScreen } from "./screens/statsScreen";
import { CalendarScreen } from "./screens/calendarScreen";
import { LoginScreen } from "./screens/loginScreen";
import { RegisterScreen } from "./screens/registerScreen";

import { logger } from "./utils/logger";
import toastShow from "./utils/toastShow";

const Stack = createStackNavigator();

// State no longer travels through route params — it lives in AppContext. Route
// params now carry only small screen-specific args (e.g. { passageId } or
// { passageText } for the add-passage flow / deep links).
export type RootStackParamList = Record<string, object | undefined>;

// Ref so code outside the navigator tree (AppContext notifications, share-intent
// handling in App.tsx) can drive navigation once the container is mounted.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Deep links: `bbh://`, `bible-by-heart://` (custom scheme, already registered in
// app.config.js) and verified `https://biblebyheart.app/...` App Links map to
// screens here. e.g. `bbh://train` -> tests, `bbh://passage/12` -> editor.
// Verified https links additionally require /.well-known/assetlinks.json served
// by the API (biblebyheart.app) — until then https falls back to the website.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["bbh://", "bible-by-heart://", "https://biblebyheart.app"],
  config: {
    screens: {
      [SCREEN.home]: "",
      [SCREEN.listPassage]: "passages",
      [SCREEN.passage]: "passage/:passageId",
      [SCREEN.test]: "train",
      [SCREEN.stats]: "stats",
      [SCREEN.calendar]: "calendar",
      [SCREEN.settings]: "settings"
    }
  }
};

export const Navigator: FC = () => {
  //TODO handle open training
  TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_NAME,
    async ({ data, error, executionInfo }) => {
      logger.write(
        `Received a notification in the background! Data: ${data}; Error: ${error}; Execution info: ${executionInfo}`
      );
      toastShow(
        "Received a notification in the background!" + JSON.stringify(data),
        1000
      );
    }
  );

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          presentation: "card"
        }}
      >
        <Stack.Screen name={SCREEN.home} component={HomeScreen} />
        <Stack.Screen name={SCREEN.settings} component={SettingsScreen} />
        <Stack.Screen
          name={SCREEN.settingsList}
          component={ListSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsTranslations}
          component={TranslationsSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsTests}
          component={TestsSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsTrainModes}
          component={TrainModesSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsNotifications}
          component={NotificationsSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsReminders}
          component={RemindersSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsStats}
          component={StatsSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsAbout}
          component={AboutSettingsScreen}
        />
        <Stack.Screen
          name={SCREEN.settingsUser}
          component={UserSettingsScreen}
        />
        <Stack.Screen name={SCREEN.listPassage} component={ListScreen} />
        <Stack.Screen name={SCREEN.passage} component={PassageScreen} />
        <Stack.Screen name={SCREEN.test} component={TestsScreen} />
        <Stack.Screen name={SCREEN.testResults} component={FinishScreen} />
        <Stack.Screen name={SCREEN.stats} component={StatsScreen} />
        <Stack.Screen name={SCREEN.calendar} component={CalendarScreen} />
        <Stack.Screen name={SCREEN.login} component={LoginScreen} />
        <Stack.Screen name={SCREEN.register} component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
