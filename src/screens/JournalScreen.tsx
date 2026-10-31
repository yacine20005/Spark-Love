import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { deleteEntry, fetchJournal, type EntryWithPhoto } from '../api/journal';
import { useHousehold } from '../context/session';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Button, Card, colors, EmptyState, ErrorState, Loading, Screen, space, Text } from '../ui';
import { NeedsPartner } from './NeedsPartner';

export function JournalScreen(props: TabProps<'Journal'>) {
  const { linked } = useHousehold();
  if (!linked) return <NeedsPartner body="A private journal only the two of you can see: photos, notes and your daily sparks." />;
  return <Journal {...props} />;
}

function Journal({ navigation }: TabProps<'Journal'>) {
  const { me, partner } = useHousehold();
  const { data, setData, error, reload, refreshing, refresh } = useLoader(() => fetchJournal(100), []);

  async function remove(entry: EntryWithPhoto) {
    if (!(await confirm('Delete this entry?', 'It will be removed for both of you.', 'Delete'))) return;
    try {
      await deleteEntry(entry);
      setData((d) => d?.filter((e) => e.id !== entry.id) ?? null);
    } catch (e) {
      notify('Could not delete', errorMessage(e));
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <Text variant="title" style={{ flex: 1 }}>
          Journal
        </Text>
        <Button title="New" icon="add" onPress={() => navigation.navigate('Compose', { kind: 'memory' })} style={styles.new} />
      </View>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Your story starts here"
          body="Save a photo from a good day, a note you want them to find, or answer today's spark."
          action={{ title: 'Write the first entry', onPress: () => navigation.navigate('Compose', { kind: 'memory' }) }}
        />
      ) : (
        data.map((e) => {
          const mine = e.user_id === me.id;
          return (
            <Card key={e.id} style={{ padding: 0, overflow: 'hidden' }}>
              {e.photoUrl && <Image source={{ uri: e.photoUrl }} style={styles.photo} contentFit="cover" transition={200} />}
              <View style={{ padding: space.md, gap: space.xs }}>
                {e.kind === 'spark' && (
                  <View style={styles.kind}>
                    <Ionicons name="sparkles" size={14} color={colors.plum} />
                    <Text variant="caption" color={colors.plum}>
                      Daily spark
                    </Text>
                  </View>
                )}
                {e.title && <Text variant="heading">{e.title}</Text>}
                <Text variant="body">{e.body}</Text>
                <View style={styles.meta}>
                  <Text variant="caption" style={{ flex: 1 }}>
                    {mine ? 'You' : partner?.display_name} ·{' '}
                    {new Date(e.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {mine && (
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" onPress={() => remove(e)} hitSlop={12}>
                      <Ionicons name="trash-outline" size={18} color={colors.textSubtle} />
                    </Pressable>
                  )}
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  new: { minHeight: 40, paddingHorizontal: space.md },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  kind: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: space.xs },
});
