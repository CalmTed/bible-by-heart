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
// every screen, so that would be a cycle.
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
// Both hosts are listed for the same reason the intent filter names both: the
// site answers on www too, and a shared link carries whichever one was open.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "bbh://",
    "bible-by-heart://",
    "https://biblebyheart.app",
    "https://www.biblebyheart.app"
  ],
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

/**
 * The one option the four screens home reaches directly carry.
 *
 * `detachPreviousScreen: false` is what makes going back cheap. The stack
 * detaches the screen underneath the top one, and a detached screen is also a
 * FROZEN one (`react-native-screens` freezes on an inactive activity state) —
 * so popping back to home would unfreeze it and run its whole first render
 * during the pop, which is precisely when the JS thread has none to spare. Kept
 * attached, home is already drawn when the screen above it goes away. It costs
 * home re-rendering on state changes while a session is running, which is
 * cheap: `getStroke` and the week row are memoized on `state.testsHistory`, and
 * that only changes when a session finishes.
 */
const keepPreviousAttached = {
  detachPreviousScreen: false
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
          presentation: "card",
          // No screen transition, deliberately, on every screen.
          //
          // `animation: "none"` is not a shorter animation, it is none at all:
          // the stack skips the whole Animated path — no spring on the card's
          // gesture value, no interpolated card style, no deferred start — and
          // simply swaps the screens. An animated card is driven by a value the
          // dismissing pan gesture writes to as well, and either one
          // interrupting the other leaves the card resting wherever it stopped:
          // the previous screen still on top with a strip of the new one beside
          // it, which only a real back gesture clears. A screen that never
          // moves cannot be left half-moved.
          //
          // It is also the cheapest thing the navigator can do on a phone whose
          // JS thread is the bottleneck — nothing to interpolate per frame, and
          // no per-card pan handler competing with the app's own gestures (the
          // list's swipeable rows, home's four swipes, the address picker).
          animation: "none",
          // Dragging a card away only means anything while the card follows the
          // finger, and nothing moves here any more. A screen is left through
          // its Header's back button or the system back gesture, and home's own
          // swipes still reach all four destinations.
          gestureEnabled: false,
          // Blurred screens stay mounted (react-navigation keeps the stack), so
          // without this a single dispatch re-renders EVERY mounted screen and
          // re-runs its O(history) stat work. freezeOnBlur
          // suspends off-screen screens so only the focused one re-renders.
          freezeOnBlur: true
        }}
      >
        <Stack.Screen name={SCREEN.home} component={HomeScreen} />
        <Stack.Screen
          name={SCREEN.settings}
          component={SettingsScreen}
          options={keepPreviousAttached}
        />
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
        <Stack.Screen
          name={SCREEN.listPassage}
          component={ListScreen}
          options={keepPreviousAttached}
        />
        <Stack.Screen name={SCREEN.listFilters} component={FiltersScreen} />
        <Stack.Screen name={SCREEN.passage} component={PassageScreen} />
        <Stack.Screen
          name={SCREEN.test}
          component={TestsScreen}
          options={keepPreviousAttached}
        />
        <Stack.Screen name={SCREEN.testResults} component={FinishScreen} />
        <Stack.Screen
          name={SCREEN.stats}
          component={StatsScreen}
          options={keepPreviousAttached}
        />
        <Stack.Screen name={SCREEN.calendar} component={CalendarScreen} />
        <Stack.Screen name={SCREEN.login} component={LoginScreen} />
        <Stack.Screen name={SCREEN.register} component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
