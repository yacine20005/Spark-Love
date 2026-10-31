import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { JournalKind } from '../lib/types';

export type TabParams = {
  Home: undefined;
  Quizzes: undefined;
  Match: undefined;
  Journal: undefined;
};

export type StackParams = {
  Auth: undefined;
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParams>;
  Profile: undefined;
  Link: undefined;
  QuizSession: { categoryId: string; name: string };
  QuizResults: { categoryId: string; name: string };
  Matches: undefined;
  Compose: { kind: JournalKind; prompt?: string };
};

export type StackProps<T extends keyof StackParams> = NativeStackScreenProps<StackParams, T>;
export type TabProps<T extends keyof TabParams> = CompositeScreenProps<
  BottomTabScreenProps<TabParams, T>,
  NativeStackScreenProps<StackParams>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends StackParams {}
  }
}
