import { useState } from 'react';
import { View } from 'react-native';
import { updateDisplayName } from '../api/couple';
import { useHousehold } from '../context/session';
import { errorMessage } from '../lib/feedback';
import { Button, Screen, space, Text, TextField } from '../ui';

export function OnboardingScreen() {
  const { me, refresh } = useHousehold();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateDisplayName(me.id, name);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: space.sm, paddingTop: space.xxl, paddingBottom: space.lg }}>
        <Text variant="display">What should your partner call you?</Text>
        <Text variant="bodyMuted">This is the name they'll see next to your answers and journal entries.</Text>
      </View>
      <TextField
        label="Your name"
        value={name}
        onChangeText={setName}
        placeholder="Sam"
        autoFocus
        autoComplete="given-name"
        maxLength={40}
        onSubmitEditing={() => name.trim() && save()}
        error={error}
      />
      <Button title="Continue" onPress={save} loading={busy} disabled={!name.trim()} />
    </Screen>
  );
}
