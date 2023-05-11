import React, { FC } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStateModel } from './models';
import { SCREEN } from './constants';
import { HomeScreen } from './screens/homeScreen';
import { ListScreen } from './screens/listScreen';
import { TestsScreen } from './screens/testsScreen';
import { FinishScreen } from './screens/finishScreen';

const Stack = createStackNavigator();

interface NavigatorModel {
    state: AppStateModel;
}

export const Navigator: FC<NavigatorModel> = ({ state }) => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animationEnabled: true,
                    gestureEnabled: true,
                    presentation: 'modal'
                }}
            >
                <Stack.Screen
                    name={SCREEN.home}
                    component={HomeScreen}
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
            </Stack.Navigator>
        </NavigationContainer>
    );
};
