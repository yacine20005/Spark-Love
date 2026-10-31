import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { deleteAccount, leaveCouple, updateDisplayName, updateTogetherSince } from '../api/couple';
import { useHousehold } from '../context/session';
import { parseISODate } from '../lib/dates';
import { confirm, errorMessage, notify } from '../lib/feedback';
import { supabase } from '../lib/supabase';
import type { StackProps } from '../navigation/types';
import { Avatar, Button, Card, Screen, Segmented, space, Text, TextField, useTheme, type ThemePreference } from '../ui';

const APPEARANCE: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ProfileScreen({ navigation }: StackProps<'Profile'>) {
  const { colors, preference, setPreference } = useTheme();
  const { me, couple, partner, linked, refresh } = useHousehold();
  const [name, setName] = useState(me.display_name ?? '');
  const [since, setSince] = useState(couple?.together_since ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ name?: string; since?: string }>({});

  const dirty = name.trim() !== me.display_name || (linked && since !== (couple?.together_since ?? ''));

  async function save() {
    const parsed = since.trim() ? parseISODate(since) : null;
    if (since.trim() && !parsed) return setError({ since: 'Use YYYY-MM-DD, and not a future date.' });
    if (!name.trim()) return setError({ name: 'Your name cannot be empty.' });
    setSaving(true);
    setError({});
    try {
      if (name.trim() !== me.display_name) await updateDisplayName(me.id, name);
      if (linked && parsed !== couple?.together_since) await updateTogetherSince(couple!.id, parsed);
      await refresh();
    } catch (e) {
      setError({ name: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  async function run(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      notify('Something went wrong', errorMessage(e));
    }
  }

  const unlink = async () => {
    const ok = await confirm(
      `Unlink from ${partner?.display_name}?`,
      'This permanently deletes everything you shared: quiz answers, matches and the journal. It cannot be undone.',
      'Unlink',
    );
    if (ok) run(async () => (await leaveCouple(), await refresh(), navigation.goBack()));
  };

  const removeAccount = async () => {
    const ok = await confirm('Delete your account?', 'Your profile and everything you shared will be deleted forever.', 'Delete');
    if (ok) run(async () => (await deleteAccount(), await supabase.auth.signOut()));
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.identity}>
        <Avatar name={me.display_name} size={64} />
        {linked && <Avatar name={partner?.display_name} size={64} side="B" />}
      </View>

      <Card style={{ gap: space.md }}>
        <TextField label="Your name" value={name} onChangeText={setName} maxLength={40} error={error.name} />
        {linked && (
          <TextField
            label="Together since"
            value={since}
            onChangeText={setSince}
            placeholder="YYYY-MM-DD"
            hint="Your anniversary. It sets the day counter on Home."
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={error.since}
          />
        )}
        <Button title="Save changes" onPress={save} loading={saving} disabled={!dirty} />
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="heading">Partner</Text>
        {linked ? (
          <>
            <Text variant="bodyMuted">You are linked with {partner?.display_name}.</Text>
            <Button title="Unlink" variant="danger" icon="unlink-outline" onPress={unlink} />
          </>
        ) : (
          <>
            <Text variant="bodyMuted">{couple ? 'Your invite is waiting for your partner.' : 'You are not linked yet.'}</Text>
            <Button title={couple ? 'See my invite code' : 'Link your partner'} variant="secondary" onPress={() => navigation.navigate('Link')} />
          </>
        )}
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="heading">Appearance</Text>
        <Segmented options={APPEARANCE} value={preference} onChange={setPreference} />
      </Card>

      <Button title="Sign out" variant="secondary" icon="log-out-outline" onPress={() => run(() => supabase.auth.signOut())} />
      <Button title="Delete account" variant="ghost" onPress={removeAccount} style={styles.delete} />
      <Text variant="caption" center color={colors.textSubtle}>
        Spark Love 1.0.0
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.sm },
  delete: { alignSelf: 'center' },
});
