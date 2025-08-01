import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../screens/AuthScreen';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, loading } = useAuth();

  const QuizQuestionsScreen =
    require('../screens/QuizQuestionsScreen').QuizQuestionsScreen;
  const QuizCompletionScreen =
    require('../screens/QuizCompletionScreen').QuizCompletionScreen;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {session && session.user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="QuizQuestionsScreen"
              component={QuizQuestionsScreen}
            />
            <Stack.Screen
              name="QuizCompletionScreen"
              component={QuizCompletionScreen}
            />
          </>
        ) : (
          <Stack.Screen name="AuthScreen" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
