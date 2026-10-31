import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useSession } from '../context/session';
import { AuthScreen } from '../screens/AuthScreen';
import { ComposeScreen } from '../screens/ComposeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { LinkScreen } from '../screens/LinkScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { QuizResultsScreen } from '../screens/QuizResultsScreen';
import { QuizSessionScreen } from '../screens/QuizSessionScreen';
import { QuizzesScreen } from '../screens/QuizzesScreen';
import { useMemo } from 'react';
import { fonts, Loading, useTheme } from '../ui';
import type { StackParams, TabParams } from './types';

const Stack = createNativeStackNavigator<StackParams>();
const Tab = createBottomTabNavigator<TabParams>();


const tabIcons: Record<keyof TabParams, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  Quizzes: ['help-circle', 'help-circle-outline'],
  Match: ['heart', 'heart-outline'],
  Journal: ['book', 'book-outline'],
};

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.sideA,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          ...(Platform.OS === 'web' && { height: 60, paddingBottom: 8 }),
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcons[route.name][focused ? 0 : 1]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Quizzes" component={QuizzesScreen} />
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
    </Tab.Navigator>
  );
}

const linking = { prefixes: [Linking.createURL('/')] };

export function RootNavigator() {
  const { colors, scheme } = useTheme();
  const { session, household, booting } = useSession();
  const theme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: colors.sideA, background: colors.background, card: colors.background, text: colors.text, border: colors.border },
    };
  }, [colors, scheme]);
  if (booting || (session && !household)) return <Loading />;

  return (
    <NavigationContainer theme={theme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
          headerTintColor: colors.text,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : !household?.me.display_name ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name="Link" component={LinkScreen} options={{ title: 'Link your partner' }} />
            <Stack.Screen name="QuizSession" component={QuizSessionScreen} options={({ route }) => ({ title: route.params.name })} />
            <Stack.Screen name="QuizResults" component={QuizResultsScreen} options={({ route }) => ({ title: route.params.name })} />
            <Stack.Screen name="Matches" component={MatchesScreen} options={{ title: 'Your matches' }} />
            <Stack.Screen name="Compose" component={ComposeScreen} options={({ route }) => ({
                title: route.params.kind === 'spark' ? "Today's spark" : 'New entry',
                presentation: 'modal',
              })} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
