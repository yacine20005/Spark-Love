import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import {
  isAuthCallbackUrl,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  normalizeOtpCode,
  parseAuthCallbackUrl,
  resolveWebAuthRedirectUrl,
  stripAuthParamsFromUrl,
} from '../lib/auth';
import { errorMessage } from '../lib/feedback';
import { supabase } from '../lib/supabase';
import { Button, makeStyles, Screen, space, Stripe, Text, TextField, useTheme } from '../ui';

WebBrowser.maybeCompleteAuthSession();

const RESEND_COOLDOWN_SEC = 30;

function getAuthRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return resolveWebAuthRedirectUrl(window.location.href, process.env.EXPO_PUBLIC_BASE_URL);
  }
  return Linking.createURL('auth/callback');
}

function cleanWebAuthUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const cleaned = stripAuthParamsFromUrl(window.location.href);
  if (cleaned !== window.location.href) {
    window.history.replaceState(window.history.state, '', cleaned);
  }
}

export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState<'email' | 'code' | 'resend' | 'google' | 'callback' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const handledKey = useRef<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

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

  function handleCallbackUrl(url: string): Promise<void> {
    const parsed = parseAuthCallbackUrl(url);
    if (parsed.kind === 'none') return Promise.resolve();
    if (parsed.kind === 'error') return Promise.reject(new Error(parsed.message));

    const key =
      parsed.kind === 'pkce'
        ? `pkce:${parsed.code}`
        : parsed.kind === 'implicit'
          ? `implicit:${parsed.accessToken}`
          : `token_hash:${parsed.tokenHash}`;

    if (handledKey.current === key && inFlight.current) return inFlight.current;
    handledKey.current = key;

    let work: Promise<void>;
    if (parsed.kind === 'pkce') {
      work = supabase.auth
        .exchangeCodeForSession(parsed.code, parsed.flowId ? { flowId: parsed.flowId } : undefined)
        .then(({ error: exchangeError }) => {
          if (exchangeError) throw exchangeError;
        });
    } else if (parsed.kind === 'implicit') {
      work = supabase.auth
        .setSession({ access_token: parsed.accessToken, refresh_token: parsed.refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) throw sessionError;
        });
    } else {
      work = supabase.auth
        .verifyOtp({ token_hash: parsed.tokenHash, type: parsed.type })
        .then(({ error: verifyError }) => {
          if (verifyError) throw verifyError;
        });
    }

    inFlight.current = work.catch((err) => {
      if (handledKey.current === key) {
        handledKey.current = null;
        inFlight.current = null;
      }
      throw err;
    });
    return inFlight.current;
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      const initialHref = window.location.href;
      const parsed = parseAuthCallbackUrl(initialHref);
      if (parsed.kind === 'none') return;

      let active = true;
      (async () => {
        // Wait for Supabase's detectSessionInUrl initialization to settle first.
        const { data } = await supabase.auth.getSession();
        if (!active || data.session) return;

        if (parsed.kind === 'error') {
          cleanWebAuthUrl();
          setError(parsed.message);
          return;
        }

        if (parsed.kind === 'pkce') {
          // Supabase already attempted PKCE exchange during init. If we're still signed out,
          // the link expired or was opened in a different browser context (e.g. Safari vs iOS PWA).
          cleanWebAuthUrl();
          setError('That sign-in link expired or opened in a different browser. Enter the code from your email instead, or request a new one.');
          return;
        }

        // Fallback for implicit (#access_token=...) or token_hash links arriving on a PKCE web client.
        await run('callback', async () => {
          try {
            await handleCallbackUrl(initialHref);
          } finally {
            cleanWebAuthUrl();
          }
        });
      })();

      return () => {
        active = false;
      };
    }

    Linking.getInitialURL().then((url) => {
      if (url && isAuthCallbackUrl(url)) {
        run('callback', () => handleCallbackUrl(url));
      }
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isAuthCallbackUrl(url)) {
        run('callback', () => handleCallbackUrl(url));
      }
    });
    return () => sub.remove();
  }, []);

  const requestEmailOtp = (kind: 'email' | 'resend') =>
    run(kind, async () => {
      const normalized = normalizeEmail(email);
      if (!isValidEmail(normalized)) throw new Error('Enter a valid email address.');
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (otpError) throw otpError;
      setEmail(normalized);
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SEC);
    });

  const sendCode = () => requestEmailOtp('email');
  const resendCode = () => requestEmailOtp('resend');

  const verify = () =>
    run('code', async () => {
      const normalizedEmail = normalizeEmail(email);
      const token = normalizeOtpCode(code);
      if (!isValidOtpCode(token)) throw new Error('Enter the 6- or 8-digit code from your email.');
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'email',
      });
      if (verifyError) throw verifyError;
    });

  const google = () =>
    run('google', async () => {
      const redirectTo = getAuthRedirectUrl();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (oauthError) throw oauthError;
      if (Platform.OS === 'web') return; // the browser navigates away and back
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        await handleCallbackUrl(result.url);
      }
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

      {busy === 'callback' && (
        <View style={styles.callbackBanner}>
          <ActivityIndicator size="small" color={colors.sideA} />
          <Text variant="bodyMuted">Completing sign-in…</Text>
        </View>
      )}

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
          <Button
            title="Email me a code"
            onPress={sendCode}
            loading={busy === 'email'}
            disabled={!email.trim() || busy === 'callback'}
          />
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text variant="caption">or</Text>
            <View style={styles.line} />
          </View>
          <Button
            title="Continue with Google"
            icon="logo-google"
            variant="secondary"
            onPress={google}
            loading={busy === 'google'}
            disabled={busy === 'callback'}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Text variant="bodyMuted">
            We sent a sign-in code to <Text variant="label">{normalizeEmail(email)}</Text>. Enter the 6- or 8-digit code from your email — it expires in an hour.
          </Text>
          <TextField
            label="Code"
            value={code}
            onChangeText={(t) => setCode(normalizeOtpCode(t))}
            placeholder="123456"
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={16}
            onSubmitEditing={() => isValidOtpCode(code) && verify()}
            error={error}
            style={styles.code}
          />
          <Button
            title="Sign in"
            onPress={verify}
            loading={busy === 'code'}
            disabled={!isValidOtpCode(code) || busy === 'callback'}
          />
          <Button
            title={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            variant="secondary"
            onPress={resendCode}
            loading={busy === 'resend'}
            disabled={cooldown > 0 || busy === 'callback'}
          />
          <Button
            title="Use a different email"
            variant="ghost"
            onPress={() => {
              setStep('email');
              setCode('');
              setError(null);
              setCooldown(0);
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
  callbackBanner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingBottom: space.sm },
  form: { gap: space.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center' },
}));
