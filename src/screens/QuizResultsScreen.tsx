import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { compareCategory, fetchProgress, fetchQuestions, resetMyAnswers } from '../api/quiz';
import { useHousehold } from '../context/session';
import { alignmentScore, isAligned } from '../lib/answers';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { useLoader } from '../lib/useLoader';
import type { StackProps } from '../navigation/types';
import { Button, Card, colors, EmptyState, ErrorState, Loading, radius, Screen, space, Text } from '../ui';

function verdict(score: number) {
  if (score >= 80) return 'You think remarkably alike here.';
  if (score >= 50) return 'Plenty in common, and a few things to talk about.';
  return 'Different views. Good material for a long dinner.';
}

export function QuizResultsScreen({ route, navigation }: StackProps<'QuizResults'>) {
  const { categoryId, name } = route.params;
  const { partner } = useHousehold();
  const [resetting, setResetting] = useState(false);

  const { data, error, reload } = useLoader(async () => {
    const [questions, compared, progress] = await Promise.all([
      fetchQuestions(categoryId),
      compareCategory(categoryId),
      fetchProgress(),
    ]);
    const byId = new Map(compared.map((c) => [c.question_id, c]));
    const rows = questions.flatMap((q) => {
      const c = byId.get(q.id);
      return c ? [{ question: q, mine: c.mine, partner: c.partner }] : [];
    });
    return { questions, rows, progress: progress.find((p) => p.category_id === categoryId) };
  }, [categoryId]);

  async function retake() {
    if (!data) return;
    const ok = await confirm('Retake this quiz?', 'Your answers for this quiz will be cleared. Your partner keeps theirs.', 'Retake');
    if (!ok) return;
    setResetting(true);
    try {
      await resetMyAnswers(data.questions.map((q) => q.id));
      navigation.replace('QuizSession', { categoryId, name });
    } catch (e) {
      notify('Could not reset', errorMessage(e));
      setResetting(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const footer = (
    <Button title="Retake quiz" variant="secondary" icon="refresh" onPress={retake} loading={resetting} />
  );

  if (data.rows.length === 0) {
    return (
      <Screen edges={['bottom']} footer={footer}>
        <EmptyState
          icon="hourglass-outline"
          title={`Waiting for ${partner?.display_name}`}
          body={`${partner?.display_name} has answered ${data.progress?.partner ?? 0} of ${data.progress?.total ?? data.questions.length}. You'll see both answers side by side once they finish.`}
          action={{ title: 'Back to quizzes', onPress: () => navigation.goBack() }}
        />
      </Screen>
    );
  }

  const score = alignmentScore(data.rows);

  return (
    <Screen edges={['bottom']} footer={footer}>
      {score !== null && (
        <Card style={styles.score}>
          <Text variant="display" color={colors.plum}>
            {score}%
          </Text>
          <View style={{ flex: 1 }}>
            <Text variant="label">in agreement</Text>
            <Text variant="bodyMuted">{verdict(score)}</Text>
          </View>
        </Card>
      )}
      {data.rows.map(({ question, mine, partner: theirs }) => {
        const aligned = isAligned(question, mine, theirs);
        return (
          <Card key={question.id} style={{ gap: space.sm }}>
            <View style={styles.qRow}>
              <Text variant="label" style={{ flex: 1 }}>
                {question.text}
              </Text>
              {aligned !== null && (
                <Ionicons
                  name={aligned ? 'checkmark-circle' : 'swap-horizontal'}
                  size={20}
                  color={aligned ? colors.success : colors.textSubtle}
                  accessibilityLabel={aligned ? 'Same answer' : 'Different answers'}
                />
              )}
            </View>
            <Answer who="You" value={mine} tone="primary" />
            <Answer who={partner?.display_name ?? 'Partner'} value={theirs} tone="plum" />
          </Card>
        );
      })}
    </Screen>
  );
}

function Answer({ who, value, tone }: { who: string; value: string; tone: 'primary' | 'plum' }) {
  return (
    <View style={[styles.answer, { backgroundColor: tone === 'plum' ? colors.plumSoft : colors.primarySoft }]}>
      <Text variant="caption" color={colors.textMuted}>
        {who}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  score: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  answer: { borderRadius: radius.md, padding: space.md - 4, gap: 2 },
});
