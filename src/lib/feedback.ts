import { Alert, Platform } from 'react-native';

const messages: Record<string, string> = {
  invalid_code: "That code doesn't match any open invite. Check it with your partner.",
  own_code: "That's your own code. Send it to your partner instead.",
  already_linked: 'You are already linked with a partner.',
  not_linked: 'Link with your partner first.',
  not_authenticated: 'Your session expired. Please sign in again.',
};

/** Turns Supabase / RPC errors into a sentence a person can act on. */
export function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
  if (messages[raw]) return messages[raw];
  if (/network|fetch/i.test(raw)) return 'No connection. Check your internet and try again.';
  if (/token has expired or is invalid/i.test(raw)) return 'That code is wrong or expired. Request a new one.';
  if (/rate limit|too many/i.test(raw)) return 'Too many attempts. Wait a minute and try again.';
  return raw || 'Something went wrong. Please try again.';
}

/** Cross-platform confirm dialog (Alert buttons are a no-op on web). */
export function confirm(title: string, message: string, confirmLabel = 'Confirm'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
