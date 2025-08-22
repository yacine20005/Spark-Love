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
  questionType: string;
  question: Question;
}

type AnyAnswerRow = {
  user_id: string;
  answer: string | number;
  question?: Question | Question[];
};

const AnswerRenderer = ({
  answer,
  question,
  isScale,
}: {
  answer: string | number;
  question: Question;
  isScale: boolean;
}) => {
  if (isScale && typeof answer === "number") {
    const min = question.min_scale ?? 1;
    const max = question.max_scale ?? 10;
    const range = max - min;
    const percentage = range > 0 ? ((answer - min) / range) * 100 : 0;
    const displayPercentage = Math.max(0, Math.min(100, percentage));

    return (
      <View style={styles.scaleWrapper}>
        <View style={styles.scaleTrack}>
          <View
            style={[styles.scaleBar, { width: `${displayPercentage}%` }]}
          />
        </View>
        <Text style={styles.scaleText}>
          {answer}/{max}
        </Text>
      </View>
    );
  }

  return <Text style={styles.answerText}>{String(answer)}</Text>;
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
            if (!qJoined) return acc; // Skip if question data is missing

            const qId = qJoined.id;
            const qText = qJoined.text;
            const qType = qJoined.type ?? "multiple_choice";

            let finalAnswer: string | number = ans.answer;
            if (qType === "scale" && typeof ans.answer === "string") {
              const parsedAnswer = parseFloat(ans.answer);
              if (!isNaN(parsedAnswer)) {
                finalAnswer = parsedAnswer;
              }
            }

            if (!acc[qId]) {
              acc[qId] = {
                questionText: qText,
                yourAnswer: "N/A",
                partnerAnswer: "N/A",
                questionType: qType,
                question: qJoined,
              };
            }

            if (ans.user_id === user.id) {
              acc[qId].yourAnswer = finalAnswer;
            } else if (ans.user_id === partnerId) {
              acc[qId].partnerAnswer = finalAnswer;
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

  const partnerName = activeCouple?.partner?.first_name || "Partner";

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
                borderRadius: SPACING.md,
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

              <View style={styles.comparisonRow}>
                <View style={styles.labelsColumn}>
                  <Text style={styles.answerLabel}>You:</Text>
                  <Text style={styles.answerLabel}>{partnerName}:</Text>
                </View>
                <View style={styles.answersColumn}>
                  <AnswerRenderer
                    answer={item.yourAnswer}
                    isScale={isScaleQuestion}
                    question={item.question}
                  />
                  <AnswerRenderer
                    answer={item.partnerAnswer}
                    isScale={isScaleQuestion}
                    question={item.question}
                  />
                </View>
              </View>
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
  comparisonRow: {
    flexDirection: "row",
  },
  labelsColumn: {
    justifyContent: "space-around",
    marginRight: SPACING.md,
  },
  answersColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  answerLabel: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  answerText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  scaleWrapper: {
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
