import React, { FC } from "react";
import * as TaskManager from "expo-task-manager";
import {
  NavigationContainer,
  createNavigationContainerRef,
  LinkingOptions
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { SCREEN, BACKGROUND_NOTIFICATION_NAME } from "./constants";
import { RootStackParamList } from "./models";
import { candyTransition } from "./utils/screenTransition";
import { HomeScreen } from "./screens/HomeScreen";
import { ListScreen } from "./screens/ListScreen";
import { FiltersScreen } from "./screens/FiltersScreen";
import { PassageScreen } from "./screens/PassageScreen";
import { TestsScreen } from "./screens/TestsScreen";
import { FinishScreen } from "./screens/FinishScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ListSettingsScreen } from "./screens/ListSettingsScreen";
import { TranslationsSettingsScreen } from "./screens/TranslationsSettingsScreen";
import { TestsSettingsScreen } from "./screens/TestsSettingsScreen";
import { TrainModesSettingsScreen } from "./screens/TrainModesSettingsScreen";
import { NotificationsSettingsScreen } from "./screens/NotificationsSettingsScreen";
import { RemindersSettingsScreen } from "./screens/RemindersSettingsScreen";
import { StatsSettingsScreen } from "./screens/StatsSettingsScreen";
import { AboutSettingsScreen } from "./screens/AboutSettingsScreen";
import { LogSettingsScreen } from "./screens/LogSettingsScreen";
import { UserSettingsScreen } from "./screens/UserSettingsScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";

import { logger } from "./utils/logger";
import toastShow from "./utils/toastShow";

// `RootStackParamList` lives in models.ts next to the rest of the data model,
// so screens can type their props without importing this file — which imports
// every screen, so that would be a cycle (8.1.14).
const Stack = createStackNavigator<RootStackParamList>();

// Makes the untyped hooks (`useNavigation`, `useRoute`) resolve to the real
// param list app-wide, so a screen name typo is a type error even outside a
// screen component.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

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
        detachInactiveScreens
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          presentation: "card",
          // The app's one transition (8.2.3), instead of whatever preset the
          // library picks from `Platform.Version`. Spread here so it covers
          // every screen - a screen that opts out is a bug, not a feature.
          ...candyTransition,
          // Blurred screens stay mounted (react-navigation keeps the stack), so
          // without this a single dispatch re-renders EVERY mounted screen and
          // re-runs its O(history) stat work (8.1.1 finding #4). freezeOnBlur
          // suspends off-screen screens so only the focused one re-renders.
          freezeOnBlur: true
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
        <Stack.Screen name={SCREEN.settingsLog} component={LogSettingsScreen} />
        <Stack.Screen name={SCREEN.listPassage} component={ListScreen} />
        <Stack.Screen name={SCREEN.listFilters} component={FiltersScreen} />
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
