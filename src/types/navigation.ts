import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { QuizCategory } from './quiz';

// Root Stack Navigator
export type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  AuthScreen: undefined;
  QuizScreen: undefined;
  QuizQuestionsScreen: { category: QuizCategory };
  QuizCompletionScreen: { category: QuizCategory; answers: any[] };
  ProfileScreen: undefined;
  SettingsScreen: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Quiz: undefined;
  Journal: undefined;
  Movies: undefined;
  Dates: undefined;
  Profile: undefined;
};

// Combined navigation type for screens that can be accessed from both stack and tabs
export type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// Screen props types
export interface ScreenProps<T extends keyof RootStackParamList> {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: {
    params: RootStackParamList[T];
  };
}

export interface TabScreenProps<T extends keyof MainTabParamList> {
  navigation: BottomTabNavigationProp<MainTabParamList, T>;
  route: {
    params: MainTabParamList[T];
  };
}

// For screens that don't need navigation props
export type ScreenComponent<T> = React.FC<T>; 