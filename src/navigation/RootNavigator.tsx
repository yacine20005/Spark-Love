import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { MainTabNavigator } from "./MainTabNavigator";
import { RootStackParamList } from "../types/navigation";

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  // Import dynamique pour éviter les problèmes de dépendances circulaires
  const QuizQuestionsScreen =
    require("../screens/QuizQuestionsScreen").QuizQuestionsScreen;
  const QuizCompletionScreen =
    require("../screens/QuizCompletionScreen").QuizCompletionScreen;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="QuizQuestionsScreen"
          component={QuizQuestionsScreen}
        />
        <Stack.Screen
          name="QuizCompletionScreen"
          component={QuizCompletionScreen}
        />
        {/* <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
        {/* <Stack.Screen name="SettingsScreen" component={SettingsScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
