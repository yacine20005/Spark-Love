import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { fetchDeck, fetchMatches, resetDeck, swipe } from '../api/swipe';
import { useHousehold } from '../context/session';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { celebrate } from '../lib/haptics';
import type { SwipeItem, SwipeKind } from '../lib/types';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Button, Card, colors, EmptyState, ErrorState, Loading, radius, Screen, space, Text } from '../ui';
import { NeedsPartner } from './NeedsPartner';
import { SwipeDeck } from './SwipeDeck';

const KINDS: { kind: SwipeKind; label: string }[] = [
  { kind: 'movie', label: 'Movies' },
  { kind: 'date', label: 'Date ideas' },
];

export function MatchScreen(props: TabProps<'Match'>) {
  const { linked } = useHousehold();
  if (!linked) return <NeedsPartner body="Swipe through movies and date ideas on your own. When you both like the same one, it's a match." />;
  return <Match {...props} />;
}

function Match({ navigation }: TabProps<'Match'>) {
  const { partner } = useHousehold();
  const [kind, setKind] = useState<SwipeKind>('movie');
  const [matched, setMatched] = useState<SwipeItem | null>(null);
  const [resetting, setResetting] = useState(false);

  const deck = useLoader(() => fetchDeck(kind), [kind]);
  const matches = useLoader(fetchMatches, []);

  useEffect(() => {
    if (!matched) return;
    const id = setTimeout(() => setMatched(null), 3500);
    return () => clearTimeout(id);
  }, [matched]);

  async function onSwipe(item: SwipeItem, liked: boolean) {
    deck.setData((d) => d?.filter((i) => i.id !== item.id) ?? null);
    try {
      if (await swipe(item.id, liked)) {
        celebrate();
        setMatched(item);
        matches.reload();
      }
    } catch (e) {
      notify('Swipe not saved', errorMessage(e));
    }
  }

  async function startOver() {
    const ok = await confirm('Start over?', 'Your swipes for this deck will be cleared. Existing matches stay until you swipe again.', 'Start over');
    if (!ok) return;
    setResetting(true);
    try {
      await resetDeck(kind);
      await deck.reload();
    } catch (e) {
      notify('Could not reset', errorMessage(e));
    } finally {
      setResetting(false);
    }
  }

  const matchCount = matches.data?.length ?? 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title" style={{ flex: 1 }}>
          Match
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Matches')}
          style={({ pressed }) => [styles.matchesLink, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="heart" size={16} color={colors.primary} />
          <Text variant="label" color={colors.primary}>
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        {KINDS.map((k) => {
          const active = k.kind === kind;
          return (
            <Pressable
              key={k.kind}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setKind(k.kind)}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Text variant="label" color={active ? colors.text : colors.textSubtle}>
                {k.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {deck.error ? (
          <ErrorState message={deck.error} onRetry={deck.reload} />
        ) : deck.loading ? (
          <Loading />
        ) : deck.data!.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="You've seen them all"
            body={`Check your matches, or start over if you've changed your mind about some.`}
            action={{ title: 'See matches', onPress: () => navigation.navigate('Matches') }}
          />
        ) : (
          <SwipeDeck key={kind} items={deck.data!} onSwipe={onSwipe} />
        )}
        {matched && (
          <Card style={styles.banner} accessibilityLiveRegion="polite">
            <Ionicons name="heart" size={22} color={colors.onPrimary} />
            <View style={{ flex: 1 }}>
              <Text variant="label" color={colors.onPrimary}>
                It's a match
              </Text>
              <Text variant="body" color={colors.onPrimary}>
                You and {partner?.display_name} both want {matched.title}.
              </Text>
            </View>
          </Card>
        )}
      </View>

      {deck.data?.length === 0 && (
        <Button title="Start over" variant="ghost" icon="refresh" onPress={startOver} loading={resetting} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  matchesLink: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.sm, minHeight: 44 },
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: space.md },
});
