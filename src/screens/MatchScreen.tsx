import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { fetchDeckPage, fetchMatches, resetDeck, swipe } from '../api/swipe';
import { useHousehold } from '../context/session';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { celebrate } from '../lib/haptics';
import type { SwipeItem, SwipeKind } from '../lib/types';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Button, Card, EmptyState, ErrorState, Loading, makeStyles, Screen, Segmented, space, Stamp, Text, useTheme } from '../ui';
import { NeedsPartner } from './NeedsPartner';
import { SwipeDeck } from './SwipeDeck';

const PREFETCH_THRESHOLD = 5;
const TMDB_ATTRIBUTION = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

const KINDS: { value: SwipeKind; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
  { value: 'date', label: 'Dates' },
];

const KIND_COPY: Record<SwipeKind, { emptyTitle: string; emptyBody: string; matchAction: string }> = {
  movie: {
    emptyTitle: 'No more movies',
    emptyBody: 'Check your matches, or start over if you want another pass at trending movies.',
    matchAction: 'both want to watch',
  },
  tv: {
    emptyTitle: 'No more series',
    emptyBody: 'Check your matches, or start over if you want another pass at trending series.',
    matchAction: 'both want to watch',
  },
  date: {
    emptyTitle: 'No more date ideas',
    emptyBody: "Check your matches, or start over if you've changed your mind about some.",
    matchAction: 'both picked',
  },
};

export function MatchScreen(props: TabProps<'Match'>) {
  const { linked } = useHousehold();
  if (!linked) {
    return <NeedsPartner body="Swipe through movies, series and date ideas on your own. When you both like the same one, it's a match." />;
  }
  return <Match {...props} />;
}

function Match({ navigation }: TabProps<'Match'>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { partner } = useHousehold();
  const [kind, setKind] = useState<SwipeKind>('movie');
  const [items, setItems] = useState<SwipeItem[] | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [matched, setMatched] = useState<SwipeItem | null>(null);
  const [resetting, setResetting] = useState(false);

  const requestIdRef = useRef(0);
  const kindRef = useRef<SwipeKind>(kind);
  const nextPageRef = useRef<number | null>(null);
  const failedPageRef = useRef<number | null>(null);
  const loadingMoreRef = useRef(false);
  const itemsLengthRef = useRef(0);
  const swipedIdsRef = useRef<Set<string>>(new Set());

  itemsLengthRef.current = items?.length ?? 0;

  const matches = useLoader(fetchMatches, []);

  const loadInitial = useCallback(async (targetKind: SwipeKind) => {
    const reqId = ++requestIdRef.current;
    kindRef.current = targetKind;
    nextPageRef.current = null;
    failedPageRef.current = null;
    loadingMoreRef.current = false;
    swipedIdsRef.current.clear();

    setItems(null);
    setNextPage(null);
    setError(null);
    setLoadingMore(false);

    try {
      const page = await fetchDeckPage(targetKind, 1);
      if (requestIdRef.current !== reqId) return;
      nextPageRef.current = page.nextPage;
      setNextPage(page.nextPage);
      setItems(page.items);
    } catch (e) {
      if (requestIdRef.current !== reqId) return;
      setError(errorMessage(e));
    }
  }, []);

  const loadMore = useCallback(async () => {
    const pageToFetch = nextPageRef.current;
    if (pageToFetch === null || loadingMoreRef.current) return;

    const reqId = requestIdRef.current;
    const targetKind = kindRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchDeckPage(targetKind, pageToFetch);
      if (requestIdRef.current !== reqId) return;
      failedPageRef.current = null;
      nextPageRef.current = page.nextPage;
      setNextPage(page.nextPage);
      setItems((prev) => {
        if (!prev) return page.items;
        const seen = new Set(prev.map((i) => i.id));
        const fresh = page.items.filter((i) => !seen.has(i.id) && !swipedIdsRef.current.has(i.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
    } catch (e) {
      if (requestIdRef.current !== reqId) return;
      failedPageRef.current = pageToFetch;
      if (itemsLengthRef.current === 0) setError(errorMessage(e));
      else notify('Could not load more', errorMessage(e));
    } finally {
      if (requestIdRef.current === reqId) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    loadInitial(kind);
    return () => {
      requestIdRef.current += 1;
    };
  }, [kind, loadInitial]);

  const remainingCount = items?.length ?? null;
  useEffect(() => {
    if (error || remainingCount === null || remainingCount > PREFETCH_THRESHOLD || nextPage === null || loadingMoreRef.current) {
      return;
    }
    if (failedPageRef.current === nextPage && remainingCount > 0) {
      return;
    }
    loadMore();
  }, [error, remainingCount, nextPage, loadMore]);

  useEffect(() => {
    if (!matched) return;
    const id = setTimeout(() => setMatched(null), 3500);
    return () => clearTimeout(id);
  }, [matched]);

  async function onSwipe(item: SwipeItem, liked: boolean) {
    swipedIdsRef.current.add(item.id);
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    try {
      if (await swipe(item, liked)) {
        celebrate();
        setMatched(item);
        matches.reload();
      }
    } catch (e) {
      notify('Swipe not saved', errorMessage(e));
    }
  }

  function retry() {
    if (items === null) {
      loadInitial(kind);
    } else {
      failedPageRef.current = null;
      setError(null);
      loadMore();
    }
  }

  async function startOver() {
    const targetKind = kind;
    const ok = await confirm(
      'Start over?',
      'Your swipes and matches for this deck will be cleared so you can swipe through it again.',
      'Start over',
    );
    if (!ok) return;
    setResetting(true);
    try {
      await resetDeck(targetKind);
      matches.reload();
      if (kindRef.current === targetKind) {
        await loadInitial(targetKind);
      }
    } catch (e) {
      notify('Could not reset', errorMessage(e));
    } finally {
      setResetting(false);
    }
  }

  const matchCount = matches.data?.length ?? 0;
  const copy = KIND_COPY[kind];
  const isTmdbKind = kind === 'movie' || kind === 'tv';
  const isLoading = items === null || (items.length === 0 && (loadingMore || nextPage !== null));
  const isEmpty = !error && !isLoading && items.length === 0;

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
        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : isLoading ? (
          <Loading />
        ) : isEmpty ? (
          <EmptyState
            icon="checkmark-done-outline"
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{ title: 'See matches', onPress: () => navigation.navigate('Matches') }}
          />
        ) : (
          <SwipeDeck key={kind} items={items} onSwipe={onSwipe} />
        )}
        {matched && (
          <Card style={styles.banner} accessibilityLiveRegion="polite">
            <Stamp label="Match" tilt={-6} />
            <Text variant="body" style={{ flex: 1 }}>
              You and {partner?.display_name ?? 'your partner'} {KIND_COPY[matched.kind].matchAction}{' '}
              <Text variant="label">{matched.title}</Text>.
            </Text>
          </Card>
        )}
      </View>

      {isEmpty && (
        <Button title="Start over" variant="ghost" icon="refresh" onPress={startOver} loading={resetting} />
      )}

      {isTmdbKind && (
        <Text variant="caption" color={colors.textMuted} center style={styles.attribution}>
          {TMDB_ATTRIBUTION}
        </Text>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: 'row', alignItems: 'center' },
  matchesLink: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.sm, minHeight: 44 },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: colors.sideA },
  attribution: { paddingTop: space.xs },
}));
