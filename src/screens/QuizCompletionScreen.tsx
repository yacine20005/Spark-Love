import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../types/navigation';
import { QuizService } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, OPACITY } from '../constants';

type QuizCompletionScreenRouteProp = RouteProp<RootStackParamList, 'QuizCompletionScreen'>;

interface QuizCompletionScreenProps {
  route: QuizCompletionScreenRouteProp;
}

type ComparisonState = 'loading' | 'solo' | 'waiting' | 'ready' | 'error';

export const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({ route }) => {
  const { category, answers, coupleId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeCouple } = useAuth();

  const [comparisonState, setComparisonState] = useState<ComparisonState>('loading');

  useEffect(() => {
    const handleCompletion = async () => {
      if (!user) return;

      try {
        // 1. Save the user's answers
        await QuizService.saveAnswers(answers.map(a => ({ ...a, user_id: user.id, couple_id: coupleId })));

        // 2. If in solo mode, we're done.
        if (!coupleId || !activeCouple) {
          setComparisonState('solo');
          return;
        }

        // 3. If in couple mode, check partner's status
        const allAnswers = await QuizService.getComparisonAnswers(coupleId, category);
        const partnerId = activeCouple.partner.id;
        
        const partnerAnswers = allAnswers?.filter(a => a.user_id === partnerId) || [];
        const totalQuestions = answers.length;

        if (partnerAnswers.length >= totalQuestions) {
          setComparisonState('ready');
        } else {
          setComparisonState('waiting');
        }

      } catch (error) {
        console.error("Failed to process quiz completion:", error);
        setComparisonState('error');
      }
    };

    handleCompletion();
  }, [user, category, answers, coupleId, activeCouple]);

  const handleCompare = () => {
    if (coupleId) {
      navigation.navigate('ComparisonScreen', { categoryId: category, coupleId });
    }
  };

  const handleBackToQuizzes = () => {
    // @ts-ignore
    navigation.navigate('MainTabNavigator', { screen: 'Quiz' });
  };

  const renderContent = () => {
    switch (comparisonState) {
      case 'loading':
        return <ActivityIndicator size="large" color={COLORS.primary} />;
      case 'error':
        return <Text style={styles.infoText}>An error occurred. Please try again.</Text>;
      case 'solo':
        return (
          <>
            <Text style={styles.title}>🎉 Quiz Completed! 🎉</Text>
            <Text style={styles.subtitle}>Your answers for the "{category}" category have been saved.</Text>
          </>
        );
      case 'waiting':
        return (
          <>
            <Text style={styles.title}>🎉 Well Done! 🎉</Text>
            <Text style={styles.subtitle}>Your answers have been saved.</Text>
            <Text style={styles.infoText}>Waiting for your partner to complete the quiz. We'll notify you when they're done!</Text>
          </>
        );
      case 'ready':
        return (
          <>
            <Text style={styles.title}>🎉 You're Both Done! 🎉</Text>
            <Text style={styles.subtitle}>Your partner has also completed the quiz. Ready to see how you compare?</Text>
            <GradientButton title="Compare Our Answers" onPress={handleCompare} style={styles.button} />
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.backgroundGradient} />
      <View style={styles.content}>
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          {renderContent()}
        </GlassCard>
        <GradientButton
          title="Back to Quizzes"
          onPress={handleBackToQuizzes}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.lg,
    width: '100%',
  },
});
