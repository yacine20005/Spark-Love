import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { radius, space } from './theme';
import { makeStyles, useTheme } from './ThemeProvider';

/** The three-band stripe printed across a cassette label. */
export function Stripe({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const { stripe } = useTheme();
  return (
    <View style={[styles.stripe, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {stripe.map((c, i) => (
        <View key={c} style={{ height: [5, 3, 2][i], backgroundColor: c }} />
      ))}
    </View>
  );
}

/** A rubber stamp. States are stamped onto things, nothing just disappears. */
export function Stamp({ label, color, tilt = -5 }: { label: string; color?: string; tilt?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  color ??= colors.sideA;
  return (
    <View style={[styles.stamp, { borderColor: color, transform: [{ rotate: `${tilt}deg` }] }]}>
      <Text variant="tag" color={color} style={{ letterSpacing: 2 }}>
        {label}
      </Text>
    </View>
  );
}

/** Section head set like a cassette-label line: caps, then a rule to the edge. */
export function SectionHead({ children, right }: { children: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.head}>
      <Text variant="tag">{children}</Text>
      <View style={styles.rule} />
      {right}
    </View>
  );
}

/** A tracklist row: label, dot leaders, value. */
export function TrackRow({ label, value }: { label: string; value: string | number }) {
  const styles = useStyles();
  return (
    <View style={styles.track}>
      <Text variant="body">{label}</Text>
      <View style={styles.leader} />
      <Text variant="counter">{value}</Text>
    </View>
  );
}

const native = Platform.OS !== 'web';

/**
 * One side of the tape. When a locked side unlocks it arrives with a flip,
 * the app's signature moment: you answered, now the tape turns over.
 */
export function Side({ side, who, children, locked }: { side: 'A' | 'B'; who: string; children: ReactNode; locked?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const ink = side === 'A' ? colors.sideA : colors.sideB;
  const turn = useRef(new Animated.Value(1)).current;
  const wasLocked = useRef(locked);

  // Flip only at the moment of reveal (locked -> unlocked), never on every mount.
  useEffect(() => {
    const revealed = wasLocked.current && !locked;
    wasLocked.current = locked;
    if (!revealed) return;
    let cancelled = false;
    turn.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) return turn.setValue(1);
      Animated.timing(turn, { toValue: 1, duration: 520, delay: 120, easing: Easing.out(Easing.exp), useNativeDriver: native }).start();
    });
    return () => {
      cancelled = true;
      turn.setValue(1);
    };
  }, [locked, turn]);

  const rotateX = turn.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  return (
    <Animated.View
      style={[
        styles.side,
        locked && styles.sideLocked,
        { opacity: turn, transform: [{ perspective: 800 }, { rotateX }] },
      ]}
    >
      <View style={[styles.sideMark, locked ? styles.sideMarkLocked : { backgroundColor: ink }]}>
        <Text variant="title" color={locked ? colors.textSubtle : colors.onSide} style={styles.sideLetter}>
          {side}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="tag" color={locked ? colors.textSubtle : ink}>
          {who}
        </Text>
        {typeof children === 'string' ? (
          <Text variant={locked ? 'bodyMuted' : 'body'}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  stripe: { flexDirection: 'column', gap: 2 },
  stamp: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingTop: 4,
    paddingBottom: 3,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  rule: { flex: 1, height: 1, backgroundColor: colors.text, opacity: 0.18 },
  track: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: space.sm + 2 },
  leader: { flex: 1, height: 0, borderTopWidth: 2, borderStyle: 'dotted', borderColor: colors.border, marginHorizontal: space.sm, alignSelf: 'center', marginTop: 8 },
  side: { flexDirection: 'row', gap: space.md - 4, paddingVertical: space.xs, alignItems: 'flex-start' },
  sideLocked: {},
  sideMark: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  sideMarkLocked: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSubtle },
  sideLetter: { fontSize: 22, lineHeight: 26 },
}));
