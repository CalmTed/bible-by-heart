import React, { FC } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActionModel, ActionName, AppStateModel } from "./models";
import { SCREEN } from "./constants";
import { StackNavigationHelpers } from "@react-navigation/stack/src/types";
import { HomeScreen } from "./screens/homeScreen";
import { ListScreen } from "./screens/listScreen";

const Stack =  createStackNavigator()

interface NavigatorModel {
  state: AppStateModel
}

export const Navigator: FC<NavigatorModel> = ({state}) => {
  return <NavigationContainer>
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      gestureEnabled: true,
      presentation: "modal"
    }}
  >
   <Stack.Screen name={SCREEN.home} component={HomeScreen} initialParams={{...state}}/> 
   <Stack.Screen name={SCREEN.listPassage} component={ListScreen} initialParams={{...state}}/> 
  </Stack.Navigator>
</NavigationContainer>;
}

