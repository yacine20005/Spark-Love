import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { MainTabNavigator } from "./MainTabNavigator";
import { RootStackParamList } from "../types/navigation";

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        {/* Add other screens here when needed */}
        {/* <Stack.Screen name="QuizQuestionsScreen" component={QuizQuestionsScreen} /> */}
        {/* <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
        {/* <Stack.Screen name="SettingsScreen" component={SettingsScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
