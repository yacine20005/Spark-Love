import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../types/navigation';
import { QuizCategory } from '../types/quiz';
import { COLORS, FONTS, SPACING, OPACITY } from '../constants';

interface QuizCompletionScreenProps {
  route: { params: { category: QuizCategory; answers: any[] } };
}

export const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({ route }) => {
  const { category, answers } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleBackToQuizzes = () => {
    navigation.navigate('MainTabs', { screen: 'Quiz' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.backgroundGradient} />
      <View style={styles.content}>
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>🎉 Quiz Terminé ! 🎉</Text>
          <Text style={styles.subtitle}>
            Vos réponses pour la catégorie "{category}" ont bien été enregistrées.
          </Text>
          <Text style={styles.infoText}>
            En attente de votre partenaire...
          </Text>
          <Text style={styles.infoText}>
            Vous serez notifié(e) dès que votre partenaire aura terminé le quiz à son tour. Vous pourrez alors comparer vos réponses !
          </Text>
        </GlassCard>
        <GradientButton
          title="Faire un autre quiz"
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
    ...FONTS.body2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.xl,
    width: '100%',
  },
});
