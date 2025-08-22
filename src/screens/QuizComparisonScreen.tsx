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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../types/navigation";
import { QuizService } from "../api/quizService";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import {
  COLORS,
  FONTS,
  SPACING,
  OPACITY,
  QUIZ_CATEGORIES,
  LAYOUT,
} from "../constants";
import { Question, QuizCategory } from "../types/quiz";

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
  questionType: string; // Assuming you can get this from your data
}

type AnyAnswerRow = {
  user_id: string;
  answer: string | number;
  question?: Question | Question[];
  question_id?: string;
  question_text?: string;
  question_type?: string;
};

const AnswerDisplay = ({
  label,
  answer,
  isScale,
}: {
  label: string;
  answer: string | number;
  isScale: boolean;
}) => {
  if (isScale && typeof answer === "number") {
    const percentage = Math.max(0, Math.min(100, answer * 10)); // Assuming a 1-10 scale
    return (
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>{label}:</Text>
        <View style={styles.scaleWrapper}>
          <View style={styles.scaleTrack}>
            <View
              style={[styles.scaleBar, { width: `${percentage}%` }]}
            />
          </View>
          <Text style={styles.scaleText}>{answer}/10</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.answerContainer}>
      <Text style={styles.answerLabel}>{label}:</Text>
      <Text style={styles.answerText}>{answer}</Text>
    </View>
  );
};

export const ComparisonScreen: React.FC<ComparisonScreenProps> = ({
  route,
}) => {
  const { categoryId, coupleId } = route.params;
  const { user, activeCouple } = useAuth();
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const categoryInfo =
    QUIZ_CATEGORIES[categoryId as keyof typeof QUIZ_CATEGORIES];

  useEffect(() => {
    const fetchComparison = async () => {
      if (!user || !activeCouple) return;

      try {
        setLoading(true);
        const rows: AnyAnswerRow[] = await QuizService.getComparisonAnswers(
          coupleId,
          categoryId
        );

        if (rows && Array.isArray(rows)) {
          const partnerId = activeCouple.partner.id;

          const groupedByQuestion = rows.reduce((acc, ans) => {
            const qJoined = Array.isArray(ans.question)
              ? ans.question[0]
              : ans.question;
            const qId = ans.question_id ?? qJoined?.id ?? "unknown";
            const qText = ans.question_text ?? qJoined?.text ?? "";
            const qType =
              ans.question_type ?? qJoined?.type ?? "multiple_choice";

            if (!acc[qId]) {
              acc[qId] = {
                questionText: qText,
                yourAnswer: "N/A",
                partnerAnswer: "N/A",
                questionType: qType,
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
        setError("Failed to load comparison. Please try again.");
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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comparison</Text>
          {categoryInfo && (
            <GlassCard
              style={{
                backgroundColor: categoryInfo.color || COLORS.primary,
                borderRadius: SPACING.xl,
              }}
              contentStyle={styles.categoryCardContent}
              opacity={0.3}
            >
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
              <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            </GlassCard>
          )}
        </View>

        {comparison.map((item, index) => {
          const areAnswersSame = item.yourAnswer === item.partnerAnswer;
          const isScaleQuestion = item.questionType === "scale";

          return (
            <GlassCard
              key={index}
              style={styles.card}
              opacity={OPACITY.glass}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionText}>{item.questionText}</Text>
                {areAnswersSame && (
                  <Text style={styles.checkMark}>✅</Text>
                )}
              </View>
              <AnswerDisplay
                label="You"
                answer={item.yourAnswer}
                isScale={isScaleQuestion}
              />
              <AnswerDisplay
                label="Partner"
                answer={item.partnerAnswer}
                isScale={isScaleQuestion}
              />
            </GlassCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  categoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  categoryIcon: {
    fontSize: FONTS.h3.fontSize,
    marginRight: SPACING.sm,
  },
  categoryName: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  questionText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  checkMark: {
    fontSize: FONTS.h3.fontSize,
    color: COLORS.success,
  },
  answerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  answerLabel: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.sm,
    width: 80,
  },
  answerText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  scaleWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  scaleTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.glass,
    marginRight: SPACING.md,
  },
  scaleBar: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  scaleText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  errorText: {
    ...FONTS.body1,
    color: "red",
    textAlign: "center",
    padding: SPACING.lg,
  },
});