import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { QuizService } from "../api/quizService";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";

import { Answer, Question } from "../types/quiz";

type ComparisonScreenRouteProp = RouteProp<
  RootStackParamList,
  "ComparisonScreen"
>;

interface ComparisonScreenProps {
  route: ComparisonScreenRouteProp;
}

interface ComparisonData {
  questionText: string;
  yourAnswer: string | number;
  partnerAnswer: string | number;
}

// Types souples pour supporter RPC ou jointure client
type AnyAnswerRow = {
  user_id: string;
  answer: string | number;
  question?: Question | Question[];
  question_id?: string;
  question_text?: string;
};

export const ComparisonScreen: React.FC<ComparisonScreenProps> = ({
  route,
}) => {
  const { categoryId, coupleId } = route.params;
  const { user, activeCouple } = useAuth();
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!user || !activeCouple) return;

      try {
        setLoading(true);
        const rows: AnyAnswerRow[] = await QuizService.getComparisonAnswers(coupleId, categoryId);
        if (rows && Array.isArray(rows)) {
          const partnerId = activeCouple.partner.id;

          const groupedByQuestion = rows.reduce((acc, ans) => {
            const qJoined = Array.isArray(ans.question) ? ans.question[0] : ans.question;
            const qId = ans.question_id ?? qJoined?.id ?? 'unknown';
            const qText = ans.question_text ?? qJoined?.text ?? '';
            if (!acc[qId]) {
              acc[qId] = {
                questionText: qText,
                yourAnswer: 'N/A',
                partnerAnswer: 'N/A',
              } as ComparisonData;
            }
            if (ans.user_id === user.id) {
              acc[qId].yourAnswer = ans.answer;
            } else if (ans.user_id === partnerId) {
              acc[qId].partnerAnswer = ans.answer;
            }
            return acc;
          }, {} as Record<string, ComparisonData>);

          setComparison(Object.values(groupedByQuestion));
        }
      } catch (err) {
        setError('Failed to load comparison. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [categoryId, coupleId, user, activeCouple]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Comparison</Text>
        <Text style={styles.subtitle}>Category: {categoryId}</Text>
        {comparison.map((item, index) => (
          <GlassCard key={index} style={styles.card} opacity={OPACITY.glass}>
            <Text style={styles.questionText}>{item.questionText}</Text>
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>You:</Text>
              <Text style={styles.answerText}>{item.yourAnswer}</Text>
            </View>
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>Partner:</Text>
              <Text style={styles.answerText}>{item.partnerAnswer}</Text>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.h2,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  questionText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  answerContainer: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  answerLabel: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.sm,
  },
  answerText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  errorText: {
    ...FONTS.body1,
    color: "red",
    textAlign: "center",
  },
});
