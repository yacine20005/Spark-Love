import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fetchMyAnswers, fetchQuestions, saveAnswer } from '../api/quiz';
import { useHousehold } from '../context/session';
import { errorMessage } from '../lib/feedback';
import { useLoader } from '../lib/useLoader';
import type { StackProps } from '../navigation/types';
import { Button, colors, ErrorState, Loading, radius, Screen, space, Text } from '../ui';
import { QuestionInput } from './QuestionInput';

export function QuizSessionScreen({ route, navigation }: StackProps<'QuizSession'>) {
  const { categoryId, name } = route.params;
  const { me, couple } = useHousehold();
  const [index, setIndex] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, error, reload } = useLoader(async () => {
    const questions = await fetchQuestions(categoryId);
    const answers = await fetchMyAnswers(questions.map((q) => q.id));
    setDrafts((d) => ({ ...answers, ...d }));
    setIndex((i) => i ?? Math.max(0, questions.findIndex((q) => !answers[q.id])));
    return questions;
  }, [categoryId]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || index === null) return <Loading />;

  const question = data[index];
  const value = drafts[question.id] ?? '';
  const last = index === data.length - 1;

  async function next() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveAnswer(couple!.id, me.id, question.id, value.trim());
      if (last) navigation.replace('QuizResults', { categoryId, name });
      else setIndex(index! + 1);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          {saveError && (
            <Text variant="caption" color={colors.danger} center>
              {saveError}
            </Text>
          )}
          <View style={styles.actions}>
            {index > 0 && <Button title="Back" variant="secondary" onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />}
            <Button
              title={last ? 'Finish' : 'Next'}
              onPress={next}
              loading={saving}
              disabled={!value.trim()}
              style={{ flex: 2 }}
            />
          </View>
        </>
      }
    >
      <View style={{ gap: space.sm }}>
        <Text variant="caption">
          Question {index + 1} of {data.length}
        </Text>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: data.length, now: index + 1 }}>
          <View style={[styles.fill, { width: `${((index + 1) / data.length) * 100}%` }]} />
        </View>
      </View>
      <Text variant="title" style={{ marginVertical: space.sm }}>
        {question.text}
      </Text>
      <QuestionInput
        key={question.id}
        question={question}
        value={value}
        onChange={(v) => setDrafts((d) => ({ ...d, [question.id]: v }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: space.sm },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.sideA, borderRadius: radius.pill },
});
