import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert } from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { useQuizStatus } from "../hooks/useQuizStatus";
import { QuizCategory } from "../types/quiz";
import { GlassCard } from "../components/GlassCard";
import { GradientButton } from "../components/GradientButton";
import { QuizService } from "../api/quizService";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";


type RouteProps = RouteProp<RootStackParamList, "QuizStatusScreen">;

interface Props { route: RouteProps; }

export const QuizStatusScreen: React.FC<Props> = ({ route }) => {
  const { category, coupleId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeCouple } = useAuth();
  const [resetting, setResetting] = useState(false);

  const {
    loading,
    error,
    canCompare,
    bothCompleted,
    isCouple,
    refresh
  } = useQuizStatus(category, coupleId);

  const partnerLabel = useMemo(() => activeCouple?.partner?.email || "Your partner", [activeCouple]);

  const goToComparison = useCallback(() => {
    if (isCouple && canCompare && coupleId) {
      navigation.replace("ComparisonScreen", { categoryId: category, coupleId });
    }
  }, [isCouple, canCompare, coupleId, category, navigation]);

  const goToQuestions = useCallback(() => {
    navigation.replace("QuizQuestionsScreen", { category });
  }, [navigation, category]);

  const confirmRedo = useCallback(() => {
    Alert.alert(
      "Retake quiz",
      isCouple
        ? "Retaking this quiz will also reset your partner's answers. Continue?"
        : "Retaking this quiz will reset your answers. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retake",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              setResetting(true);
              await QuizService.resetQuizAnswers(category, coupleId ?? null, user.id);
              setResetting(false);
              navigation.replace("QuizQuestionsScreen", { category });
            } catch (e) {
              console.error(e);
              setResetting(false);
              Alert.alert(
                "Error",
                `Unable to reset the quiz. Please try again.\n\n${e instanceof Error ? e.message : String(e)}`
              );
            }
          },
        },
      ]
    );
  }, [isCouple, user, category, coupleId, navigation]);

  // Auto-redirect to comparison when both partners have completed the quiz
  useEffect(() => {
    if (!loading && isCouple && bothCompleted && canCompare && coupleId) {
      navigation.replace("ComparisonScreen", { categoryId: category, coupleId });
    }
  }, [loading, isCouple, bothCompleted, canCompare, coupleId, category, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.content}>
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          {loading ? (
            <Text style={styles.subtitle}>Loading status...</Text>
          ) : error ? (
            <>
              <Text style={styles.title}>Status unavailable</Text>
              <Text style={styles.subtitle}>{error}</Text>
              <GradientButton title="Retry" onPress={refresh} style={styles.button} />
            </>
          ) : !isCouple ? (
            <>
              <Text style={styles.title}>Quiz completed (Solo)</Text>
              <Text style={styles.subtitle}>You have completed this quiz in solo mode.</Text>
              <GradientButton title="Retake quiz" onPress={confirmRedo} style={styles.button} disabled={resetting} />
            </>
          ) : canCompare && bothCompleted ? (
            <>
              <Text style={styles.title}>Ready to compare</Text>
              <Text style={styles.subtitle}>You and {partnerLabel} have completed this quiz.</Text>
              <GradientButton title="Compare our answers" onPress={goToComparison} style={styles.button} />
              <GradientButton title="Retake quiz" onPress={confirmRedo} style={styles.secondaryButton} disabled={resetting} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Waiting for your partner</Text>
              <Text style={styles.subtitle}>You have completed your part. {partnerLabel} still needs to answer.</Text>
              <GradientButton title="Refresh" onPress={refresh} style={styles.button} />
              <GradientButton title="Retake quiz" onPress={confirmRedo} style={styles.secondaryButton} disabled={resetting} />
            </>
          )}
        </GlassCard>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: SPACING.lg },
  card: { padding: SPACING.xl, alignItems: "center" },
  title: { ...FONTS.h1, color: COLORS.textPrimary, textAlign: "center", marginBottom: SPACING.md },
  subtitle: { ...FONTS.body1, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.lg },
  button: { width: "100%", marginBottom: SPACING.md },
  secondaryButton: { width: "100%", opacity: 0.9 },
});
