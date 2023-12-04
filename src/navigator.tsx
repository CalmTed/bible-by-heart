import React, { FC } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AppStateModel } from "./models";
import { SCREEN, BACKGROUND_NOTIFICATION_NAME } from "./constants";
import { HomeScreen } from "./screens/homeScreen";
import { ListScreen } from "./screens/listScreen";
import { TestsScreen } from "./screens/testsScreen";
import { FinishScreen } from "./screens/finishScreen";
import { SettingsScreen } from "./screens/settingsScreen";
import * as TaskManager from "expo-task-manager";
import { ToastAndroid } from "react-native";
import { StatsScreen } from "./screens/statsScreen";
import { CalendarScreen } from "./screens/calendarScreen";

const Stack = createStackNavigator();

interface NavigatorModel {
  state: AppStateModel;
}

export const Navigator: FC<NavigatorModel> = ({ state }) => {
  TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_NAME,
    ({ data, error, executionInfo }) => {
      console.log(
        "Received a notification in the background!",
        data,
        error,
        executionInfo
      );
      ToastAndroid.show("Received a notification in the background!" + JSON.stringify(data), 1000)
    }
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          presentation: "modal"
        }}
      >
        <Stack.Screen
          name={SCREEN.home}
          component={HomeScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.settings}
          component={SettingsScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.listPassage}
          component={ListScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.test}
          component={TestsScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.testResults}
          component={FinishScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.stats}
          component={StatsScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.calendar}
          component={CalendarScreen}
          initialParams={{ ...state }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
