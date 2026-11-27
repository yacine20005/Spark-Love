import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { fetchMatches } from '../api/swipe';
import type { SwipeItem } from '../lib/types';
import { useLoader } from '../lib/useLoader';
import type { StackProps } from '../navigation/types';
import { Card, EmptyState, ErrorState, Loading, makeStyles, radius, Screen, SectionHead, space, Stamp, Text, useTheme } from '../ui';

const TMDB_ATTRIBUTION = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

export function MatchesScreen({ navigation }: StackProps<'Matches'>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { data, error, reload, refreshing, refresh } = useLoader(fetchMatches, []);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const sections = [
    { title: 'Movies to watch', items: data.filter((i) => i.kind === 'movie') },
    { title: 'Series to watch', items: data.filter((i) => i.kind === 'tv') },
    { title: 'Dates to plan', items: data.filter((i) => i.kind === 'date') },
  ].filter((s) => s.items.length > 0);

  const hasTmdbMatches = data.some((i) => i.kind === 'movie' || i.kind === 'tv');

  return (
    <Screen edges={['bottom']} refreshing={refreshing} onRefresh={refresh}>
      {sections.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No matches yet"
          body="When you and your partner both like the same movie, series or date idea, it lands here."
          action={{ title: 'Keep swiping', onPress: () => navigation.goBack() }}
        />
      ) : (
        <>
          {sections.map((s) => (
            <View key={s.title} style={{ gap: space.sm }}>
              <SectionHead>{s.title}</SectionHead>
              {s.items.map((item) => (
                <Card key={item.id} style={styles.row}>
                  <MatchThumb item={item} />
                  <View style={styles.info}>
                    <Text variant="label" numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text variant="bodyMuted" numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Stamp label="Match" tilt={-4} />
                </Card>
              ))}
            </View>
          ))}
          {hasTmdbMatches && (
            <Text variant="caption" color={colors.textMuted} center style={styles.attribution}>
              {TMDB_ATTRIBUTION}
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}

function MatchThumb({ item }: { item: SwipeItem }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(item.image_url) && failedUrl !== item.image_url;

  if (showImage) {
    return (
      <Image
        source={{ uri: item.image_url! }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
        onError={() => setFailedUrl(item.image_url)}
      />
    );
  }

  return (
    <View style={styles.iconBox}>
      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.text} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  info: { flex: 1, gap: 2 },
  poster: {
    width: 48,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attribution: { paddingTop: space.md },
}));
