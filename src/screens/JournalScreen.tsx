import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { deleteEntry, fetchJournal, type EntryWithPhoto } from '../api/journal';
import { useHousehold } from '../context/session';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Avatar, Button, Card, colors, EmptyState, ErrorState, Loading, Screen, Side, space, Text } from '../ui';
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
        <Text variant="display" style={{ flex: 1 }}>
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
        groupSparks(data).map((item) => {
          if (item.type === 'spark') {
            const [a, b] = [item.entries.find((e) => e.user_id === me.id), item.entries.find((e) => e.user_id !== me.id)];
            return (
              <Card key={item.key} style={{ gap: space.sm }}>
                <Text variant="heading">{item.prompt}</Text>
                {a && <Side side="A" who="You">{a.body}</Side>}
                {b && <Side side="B" who={partner?.display_name ?? 'Partner'}>{b.body}</Side>}
                <View style={styles.meta}>
                  <Text variant="caption" style={{ flex: 1 }}>
                    Daily spark · {formatDay(item.entries[0].created_at)}
                  </Text>
                  {a && (
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete my answer" onPress={() => remove(a)} hitSlop={12}>
                      <Ionicons name="trash-outline" size={18} color={colors.textSubtle} />
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          }
          const e = item.entry;
          const mine = e.user_id === me.id;
          return (
            <Card key={e.id} style={{ padding: 0, overflow: 'hidden' }}>
              {e.photoUrl && <Image source={{ uri: e.photoUrl }} style={styles.photo} contentFit="cover" transition={200} />}
              <View style={{ padding: space.md, gap: space.xs }}>
                {e.title && <Text variant="heading">{e.title}</Text>}
                <Text variant="body">{e.body}</Text>
                <View style={styles.meta}>
                  <Avatar name={mine ? me.display_name : partner?.display_name} side={mine ? 'A' : 'B'} size={22} />
                  <Text variant="caption" style={{ flex: 1 }}>
                    {mine ? 'You' : partner?.display_name} · {formatDay(e.created_at)}
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

type Item =
  | { type: 'entry'; entry: EntryWithPhoto }
  | { type: 'spark'; key: string; prompt: string; entries: EntryWithPhoto[] };

/** Both answers to the same day's spark read as one tape: side A and side B. */
function groupSparks(entries: EntryWithPhoto[]): Item[] {
  const items: Item[] = [];
  const sparks = new Map<string, Extract<Item, { type: 'spark' }>>();
  for (const e of entries) {
    if (e.kind !== 'spark') {
      items.push({ type: 'entry', entry: e });
      continue;
    }
    const key = `${new Date(e.created_at).toDateString()}|${e.title}`;
    const group = sparks.get(key);
    if (group) group.entries.push(e);
    else {
      const created = { type: 'spark' as const, key, prompt: e.title ?? "Today's spark", entries: [e] };
      sparks.set(key, created);
      items.push(created);
    }
  }
  return items;
}

const formatDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  new: { minHeight: 40, paddingHorizontal: space.md },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
});
