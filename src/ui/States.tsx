import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';
import { colors, space } from './theme';

type EmptyProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon, title, body, action }: EmptyProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text variant="heading" center>
        {title}
      </Text>
      {body && (
        <Text variant="bodyMuted" center style={{ maxWidth: 320 }}>
          {body}
        </Text>
      )}
      {action && <Button title={action.title} onPress={action.onPress} style={{ marginTop: space.sm }} />}
    </View>
  );
}

export function Loading() {
  return (
    <View style={[styles.center, { flex: 1 }]} accessibilityLabel="Loading">
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Something went wrong"
      body={message}
      action={onRetry ? { title: 'Try again', onPress: onRetry } : undefined}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
});
