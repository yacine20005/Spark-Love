import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { fetchDeck, fetchMatches, resetDeck, swipe } from '../api/swipe';
import { useHousehold } from '../context/session';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { celebrate } from '../lib/haptics';
import type { SwipeItem, SwipeKind } from '../lib/types';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Button, Card, EmptyState, ErrorState, Loading, makeStyles, Screen, Segmented, space, Stamp, Text, useTheme } from '../ui';
import { NeedsPartner } from './NeedsPartner';
import { SwipeDeck } from './SwipeDeck';

const KINDS: { value: SwipeKind; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'date', label: 'Date ideas' },
];

export function MatchScreen(props: TabProps<'Match'>) {
  const { linked } = useHousehold();
  if (!linked) return <NeedsPartner body="Swipe through movies and date ideas on your own. When you both like the same one, it's a match." />;
  return <Match {...props} />;
}

function Match({ navigation }: TabProps<'Match'>) {
  const { colors } = useTheme();
  const styles = useStyles();
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

      <Segmented options={KINDS} value={kind} onChange={setKind} />

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
            <Stamp label="Match" tilt={-6} />
            <Text variant="body" style={{ flex: 1 }}>
              You and {partner?.display_name} both want <Text variant="label">{matched.title}</Text>.
            </Text>
          </Card>
        )}
      </View>

      {deck.data?.length === 0 && (
        <Button title="Start over" variant="ghost" icon="refresh" onPress={startOver} loading={resetting} />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: 'row', alignItems: 'center' },
  matchesLink: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.sm, minHeight: 44 },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: colors.sideA },
}));
