import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { NameSetupScreen } from '../screens/NameSetupScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { QuizQuestionsScreen } from '../screens/QuizQuestionsScreen';
import { QuizCompletionScreen } from '../screens/QuizCompletionScreen';
import { ComparisonScreen } from '../screens/ComparisonScreen';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Check if user has completed their profile setup
          profile && profile.first_name && profile.last_name ? (
            <>
              <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
              <Stack.Screen name="QuizScreen" component={QuizScreen} />
              <Stack.Screen name="QuizQuestionsScreen" component={QuizQuestionsScreen} />
              <Stack.Screen name="QuizCompletionScreen" component={QuizCompletionScreen} />
              <Stack.Screen name="ComparisonScreen" component={ComparisonScreen} />
            </>
          ) : (
            <Stack.Screen name="NameSetupScreen" component={NameSetupScreen} />
          )
        ) : (
          <Stack.Screen name="AuthScreen" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
