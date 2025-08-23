import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { QuizCategory } from "./quiz";

export type RootStackParamList = {
  MainTabNavigator: NavigatorScreenParams<MainTabParamList>;
  AuthScreen: undefined;
  NameSetupScreen: undefined;
  QuizScreen: undefined;
  QuizQuestionsScreen: { category: QuizCategory };
  QuizCompletionScreen: {
    category: QuizCategory;
    answers: any[];
    coupleId: string | null;
  };
  ComparisonScreen: { // New screen for comparing answers
    categoryId: string;
    coupleId: string;
  };
  QuizStatusScreen: { // New screen to show status/wait/compare and redo option
    category: QuizCategory;
    coupleId: string | null;
  };
  ProfileScreen: undefined;
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
