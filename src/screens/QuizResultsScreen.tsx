import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { compareCategory, fetchProgress, fetchQuestions, resetMyAnswers } from '../api/quiz';
import { useHousehold } from '../context/session';
import { alignmentScore, isAligned } from '../lib/answers';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { useLoader } from '../lib/useLoader';
import type { StackProps } from '../navigation/types';
import { Button, Card, colors, EmptyState, ErrorState, Loading, Screen, Side, space, Stamp, Text } from '../ui';

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
        <View style={styles.score}>
          <Text variant="display" style={styles.scoreNum}>
            {score}%
          </Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="tag">In agreement</Text>
            <Text variant="body">{verdict(score)}</Text>
          </View>
        </View>
      )}
      {data.rows.map(({ question, mine, partner: theirs }) => {
        const aligned = isAligned(question, mine, theirs);
        return (
          <Card key={question.id} style={{ gap: space.sm }}>
            <View style={styles.qRow}>
              <Text variant="label" style={{ flex: 1 }}>
                {question.text}
              </Text>
              {aligned && <Stamp label={mine === theirs ? 'Same' : 'Close'} color={colors.success} tilt={4} />}
            </View>
            <Side side="A" who="You">{mine}</Side>
            <Side side="B" who={partner?.display_name ?? 'Partner'}>{theirs}</Side>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  scoreNum: { fontSize: 64, lineHeight: 64, paddingTop: 4 },
  qRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
});
