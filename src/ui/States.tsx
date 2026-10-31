import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';
import { radius, space } from './theme';
import { makeStyles, useTheme } from './ThemeProvider';

type EmptyProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon, title, body, action }: EmptyProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.text} />
      </View>
      <Text variant="title" center>
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
  const { colors } = useTheme();
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
  center: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
}));
