import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { tap } from '../lib/haptics';
import type { SwipeItem } from '../lib/types';
import { makeStyles, radius, space, Stamp, Stripe, Text, useTheme } from '../ui';

const THRESHOLD = 110;
const native = Platform.OS !== 'web';
const webCardStyle: ViewStyle | undefined = Platform.OS === 'web'
  ? ({ userSelect: 'none', touchAction: 'none', cursor: 'grab' } as unknown as ViewStyle)
  : undefined;

type Props = { items: SwipeItem[]; onSwipe: (item: SwipeItem, liked: boolean) => void };

export function SwipeDeck({ items, onSwipe }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const deckWidth = Math.min(width, 480);
  const pan = useRef(new Animated.ValueXY()).current;
  const flinging = useRef(false);
  const [top, next] = items;

  useEffect(() => {
    flinging.current = false;
  }, [top?.id]);

  const fling = (liked: boolean) => {
    if (!top || flinging.current) return;
    flinging.current = true;
    tap();
    Animated.timing(pan, { toValue: { x: (liked ? 1 : -1) * deckWidth * 1.2, y: 40 }, duration: 220, useNativeDriver: native }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      flinging.current = false;
      onSwipe(top, liked);
    });
  };

  // Rebuilt per top card so release handlers see the current item.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !flinging.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > THRESHOLD) fling(g.dx > 0);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: native }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: native }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [top?.id, deckWidth],
  );

  if (!top) return null;

  const rotate = pan.x.interpolate({ inputRange: [-deckWidth, 0, deckWidth], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = pan.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.stack}>
        {next && (
          <View style={[styles.card, styles.behind]} pointerEvents="none">
            <CardBody item={next} />
          </View>
        )}
        <Animated.View
          {...responder.panHandlers}
          style={[styles.card, webCardStyle, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
        >
          <View style={{ flex: 1 }} pointerEvents="none">
            <CardBody item={top} />
          </View>
          <Animated.View pointerEvents="none" style={[styles.stamp, { left: space.lg, opacity: likeOpacity }]}>
            <Stamp label="Yes please" color={colors.success} tilt={-8} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, { right: space.lg, opacity: passOpacity }]}>
            <Stamp label="Not for us" color={colors.textMuted} tilt={8} />
          </Animated.View>
        </Animated.View>
      </View>
      <View style={styles.buttons}>
        <RoundButton icon="close" label={`Pass on ${top.title}`} onPress={() => fling(false)} />
        <RoundButton icon="heart" label={`Like ${top.title}`} onPress={() => fling(true)} primary />
      </View>
    </View>
  );
}

function CardBody({ item }: { item: SwipeItem }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(item.image_url) && failedUrl !== item.image_url;

  return (
    <View style={styles.body}>
      <View style={[styles.art, showImage && styles.artPoster]}>
        {showImage ? (
          <Image
            source={{ uri: item.image_url! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            onError={() => setFailedUrl(item.image_url)}
          />
        ) : (
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={56} color={colors.text} />
        )}
        <Stripe style={styles.artStripe} />
      </View>
      <Text variant="title" numberOfLines={2}>
        {item.title}
      </Text>
      {item.description ? (
        <Text variant="bodyMuted" numberOfLines={showImage ? 3 : 4}>
          {item.description}
        </Text>
      ) : null}
      {item.tags.length > 0 && (
        <View style={styles.tags}>
          {item.tags.map((t, idx) => (
            <View key={`${t}-${idx}`} style={styles.tag}>
              <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RoundButton({ icon, label, onPress, primary }: { icon: 'close' | 'heart'; label: string; onPress: () => void; primary?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, primary && styles.roundPrimary, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      <Ionicons name={icon} size={30} color={primary ? colors.onSide : colors.textMuted} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  stack: { height: 480 },
  card: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    overflow: 'hidden',
  },
  behind: { transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.7 },
  body: { flex: 1, gap: space.sm + 2, overflow: 'hidden' },
  art: {
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: space.xs,
  },
  artPoster: { height: 216 },
  artStripe: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2, overflow: 'hidden' },
  tag: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 3, maxWidth: '100%' },
  stamp: { position: 'absolute', top: space.lg, backgroundColor: colors.surface, borderRadius: radius.sm },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
  round: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPrimary: { backgroundColor: colors.sideA, borderColor: colors.sideA },
}));
