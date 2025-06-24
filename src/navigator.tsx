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
import { logger } from "./utils/logger";
import { LoginScreen } from "./screens/loginScreen";
import { RegisterScreen } from "./screens/registerScreen";

const Stack = createStackNavigator();

interface NavigatorModel {
  state: AppStateModel;
}

export const Navigator: FC<NavigatorModel> = ({ state }) => {
  //TODO handle open training
  TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_NAME,
    async ({ data, error, executionInfo }) => {
      logger.write(`Received a notification in the background! Data: ${data}; Error: ${error}; Execution info: ${executionInfo}`)
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
        <Stack.Screen
          name={SCREEN.login}
          component={LoginScreen}
          initialParams={{ ...state }}
        />
        <Stack.Screen
          name={SCREEN.register}
          component={RegisterScreen}
          initialParams={{ ...state }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
