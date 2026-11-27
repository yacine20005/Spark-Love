import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { createInvite, joinCouple } from '../api/couple';
import { useHousehold } from '../context/session';
import { errorMessage } from '../lib/feedback';
import { Button, Card, fonts, makeStyles, radius, space, Text, TextField } from '../ui';

const canWebShare = Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** Create/share an invite code, or join with your partner's. */
export function LinkPanel({ onLinked }: { onLinked?: () => void }) {
  const styles = useStyles();
  const { couple, refresh } = useHousehold();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const myCode = couple?.invite_code ?? null;

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(id);
  }, [copied]);

  async function create() {
    setBusy('create');
    setError(null);
    try {
      await createInvite();
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function join() {
    setBusy('join');
    setError(null);
    try {
      await joinCouple(code);
      await refresh();
      onLinked?.();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  }

  async function copyCode() {
    if (!myCode) return;
    try {
      await Clipboard.setStringAsync(myCode);
      setCopied(true);
    } catch {
      try {
        await navigator.clipboard?.writeText(myCode);
        setCopied(true);
      } catch {
        setError('Could not copy automatically. Select and copy the code above.');
      }
    }
  }

  async function share() {
    if (!myCode) return;
    const message = `Join me on Spark Love. My invite code is ${myCode}`;
    if (Platform.OS === 'web') {
      if (canWebShare) {
        try {
          await navigator.share({ title: 'Spark Love', text: message });
          return;
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') return;
        }
      }
      await copyCode();
    } else {
      await Share.share({ message });
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <Card style={{ gap: space.md }}>
        <View style={{ gap: space.xs }}>
          <Text variant="heading">Invite your partner</Text>
          <Text variant="bodyMuted">
            {myCode
              ? 'Send them this code. Once they enter it, your space opens up for both of you.'
              : 'Create a code and send it to your partner.'}
          </Text>
        </View>
        {myCode ? (
          <>
            <View style={styles.codeBox} accessibilityLabel={`Your invite code ${myCode.split('').join(' ')}`}>
              <Text style={styles.code} selectable>
                {myCode}
              </Text>
            </View>
            <Button
              title={
                Platform.OS === 'web' && !canWebShare
                  ? copied
                    ? 'Copied'
                    : 'Copy code'
                  : copied
                    ? 'Copied'
                    : 'Share code'
              }
              icon={
                copied
                  ? 'checkmark'
                  : Platform.OS === 'web' && !canWebShare
                    ? 'copy-outline'
                    : 'share-outline'
              }
              onPress={share}
            />
            <Text variant="caption" center>
              Waiting for your partner to join…
            </Text>
          </>
        ) : (
          <Button title="Create my code" onPress={create} loading={busy === 'create'} />
        )}
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="heading">Got a code?</Text>
        <TextField
          label="Partner's code"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="ABC234"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          error={error}
        />
        <Button title="Link us" variant="secondary" onPress={join} loading={busy === 'join'} disabled={code.length !== 6} />
      </Card>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  codeBox: {
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  code: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: 10, color: colors.text },
}));
