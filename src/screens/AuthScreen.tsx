import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { errorMessage } from '../lib/feedback';
import { supabase } from '../lib/supabase';
import { Button, makeStyles, Screen, space, Stripe, Text, TextField, useTheme } from '../ui';

WebBrowser.maybeCompleteAuthSession();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState<'email' | 'code' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const sendCode = () =>
    run('email', async () => {
      if (!EMAIL.test(email.trim())) throw new Error('Enter a valid email address.');
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setStep('code');
    });

  const verify = () =>
    run('code', async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) throw error;
    });

  const google = () =>
    run('google', async () => {
      const redirectTo = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (error) throw error;
      if (Platform.OS === 'web') return; // the browser navigates away and back
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;
      const authCode = new URL(result.url).searchParams.get('code');
      if (!authCode) throw new Error('Google sign-in was cancelled.');
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) throw exchangeError;
    });

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Stripe style={styles.stripe} />
        <Text variant="display" style={styles.wordmark}>
          Spark{'\n'}Love
        </Text>
        <View style={styles.sides}>
          <Text variant="tag" color={colors.sideA}>Side A · you</Text>
          <Text variant="tag" color={colors.sideB}>Side B · them</Text>
        </View>
        <Text variant="bodyMuted" style={{ maxWidth: 320 }}>
          Answer on your own, then flip the tape and hear theirs. Daily questions, quizzes, swipes and a journal only the two of you can open.
        </Text>
      </View>

      {step === 'email' ? (
        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            onSubmitEditing={sendCode}
            returnKeyType="send"
            error={error}
          />
          <Button title="Email me a code" onPress={sendCode} loading={busy === 'email'} disabled={!email.trim()} />
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text variant="caption">or</Text>
            <View style={styles.line} />
          </View>
          <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={google} loading={busy === 'google'} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text variant="bodyMuted">
            We sent a 6-digit code to <Text variant="label">{email.trim()}</Text>. It expires in an hour.
          </Text>
          <TextField
            label="Code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            onSubmitEditing={verify}
            error={error}
            style={styles.code}
          />
          <Button title="Sign in" onPress={verify} loading={busy === 'code'} disabled={code.length !== 6} />
          <Button
            title="Use a different email"
            variant="ghost"
            onPress={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  hero: { gap: space.md - 4, paddingTop: space.xl, paddingBottom: space.lg },
  stripe: { width: 96 },
  wordmark: { fontSize: 76, lineHeight: 70, paddingTop: 6, letterSpacing: -0.5 },
  sides: { flexDirection: 'row', gap: space.md },
  form: { gap: space.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
}));
