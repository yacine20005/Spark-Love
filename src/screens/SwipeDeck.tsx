import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { tap } from '../lib/haptics';
import type { SwipeItem } from '../lib/types';
import { colors, radius, shadow, space, Text } from '../ui';

const THRESHOLD = 110;
const native = Platform.OS !== 'web';

type Props = { items: SwipeItem[]; onSwipe: (item: SwipeItem, liked: boolean) => void };

export function SwipeDeck({ items, onSwipe }: Props) {
  const { width } = useWindowDimensions();
  const pan = useRef(new Animated.ValueXY()).current;
  const [top, next] = items;

  const fling = (liked: boolean) => {
    if (!top) return;
    tap();
    Animated.timing(pan, { toValue: { x: (liked ? 1 : -1) * width * 1.2, y: 40 }, duration: 220, useNativeDriver: native }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onSwipe(top, liked);
    });
  };

  // Rebuilt per top card so release handlers see the current item.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > THRESHOLD) fling(g.dx > 0);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: native }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [top?.id],
  );

  if (!top) return null;

  const rotate = pan.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
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
          style={[styles.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
        >
          <CardBody item={top} />
          <Animated.View style={[styles.stamp, styles.like, { opacity: likeOpacity }]}>
            <Text variant="label" color={colors.success}>
              Yes please
            </Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.pass, { opacity: passOpacity }]}>
            <Text variant="label" color={colors.textMuted}>
              Not for us
            </Text>
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
  const plum = item.kind === 'movie';
  return (
    <View style={{ flex: 1, gap: space.md }}>
      <View style={[styles.art, { backgroundColor: plum ? colors.plumSoft : colors.primarySoft }]}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={64} color={plum ? colors.plum : colors.primary} />
      </View>
      <Text variant="title">{item.title}</Text>
      <Text variant="bodyMuted">{item.description}</Text>
      <View style={styles.tags}>
        {item.tags.map((t) => (
          <View key={t} style={styles.tag}>
            <Text variant="caption" color={colors.textMuted}>
              {t}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoundButton({ icon, label, onPress, primary }: { icon: 'close' | 'heart'; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, primary && styles.roundPrimary, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      <Ionicons name={icon} size={30} color={primary ? colors.onPrimary : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { height: 440 },
  card: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 8,
    padding: space.lg - 4,
    ...shadow,
  },
  behind: { transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.7 },
  art: { height: 160, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  tag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: 4 },
  stamp: { position: 'absolute', top: space.lg, borderWidth: 2, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 4, backgroundColor: colors.surface },
  like: { left: space.lg, borderColor: colors.success, transform: [{ rotate: '-8deg' }] },
  pass: { right: space.lg, borderColor: colors.textSubtle, transform: [{ rotate: '8deg' }] },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
  round: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
});
