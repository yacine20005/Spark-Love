/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  createSafeWebStorage,
  isAuthCallbackUrl,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  normalizeOtpCode,
  parseAuthCallbackUrl,
  resolveWebAuthRedirectUrl,
  stripAuthParamsFromUrl,
} from './auth';

describe('email and OTP normalization', () => {
  test('normalizes and validates email addresses', () => {
    expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
    expect(isValidEmail('  Alice@Example.COM ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  test('accepts both 6-digit and 8-digit OTP codes and strips formatting', () => {
    expect(normalizeOtpCode('123 456')).toBe('123456');
    expect(normalizeOtpCode('1234-5678')).toBe('12345678');
    expect(normalizeOtpCode('1234567890')).toBe('12345678');

    expect(isValidOtpCode('12345')).toBe(false);
    expect(isValidOtpCode('123456')).toBe(true);
    expect(isValidOtpCode('1234567')).toBe(true);
    expect(isValidOtpCode('12345678')).toBe(true);
    expect(isValidOtpCode('123456789')).toBe(false);
    expect(isValidOtpCode('12345a')).toBe(false);
  });
});

describe('parseAuthCallbackUrl', () => {
  test('parses PKCE callback code and optional sb_flow_id', () => {
    expect(parseAuthCallbackUrl('sparklove://auth/callback?code=abc-123&sb_flow_id=flow_1')).toEqual({
      kind: 'pkce',
      code: 'abc-123',
      flowId: 'flow_1',
    });
    expect(parseAuthCallbackUrl('https://example.com/spark-love/?code=xyz')).toEqual({
      kind: 'pkce',
      code: 'xyz',
    });
  });

  test('parses implicit grant tokens from hash fragment', () => {
    expect(
      parseAuthCallbackUrl('sparklove://auth/callback#access_token=at_1&refresh_token=rt_2&token_type=bearer'),
    ).toEqual({
      kind: 'implicit',
      accessToken: 'at_1',
      refreshToken: 'rt_2',
    });
  });

  test('parses token_hash email verification callbacks', () => {
    expect(parseAuthCallbackUrl('https://example.com/?token_hash=th_999&type=magiclink')).toEqual({
      kind: 'token_hash',
      tokenHash: 'th_999',
      type: 'magiclink',
    });
    expect(parseAuthCallbackUrl('https://example.com/?token_hash=th_999&type=unknown')).toEqual({
      kind: 'none',
    });
  });

  test('maps known callback errors to actionable messages', () => {
    const expired = parseAuthCallbackUrl(
      'https://example.com/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    );
    expect(expired.kind).toBe('error');
    if (expired.kind === 'error') {
      expect(expired.code).toBe('otp_expired');
      expect(expired.message).toContain('expired');
    }

    const cancelled = parseAuthCallbackUrl('sparklove://auth/callback?error=access_denied');
    expect(cancelled).toEqual({
      kind: 'error',
      message: 'Sign-in was cancelled. Try again when you are ready.',
    });
  });

  test('returns none for regular app URLs', () => {
    expect(parseAuthCallbackUrl('https://example.com/spark-love/')).toEqual({ kind: 'none' });
    expect(isAuthCallbackUrl('sparklove://home')).toBe(false);
    expect(isAuthCallbackUrl('sparklove://auth/callback?code=1')).toBe(true);
  });
});

describe('resolveWebAuthRedirectUrl', () => {
  test('preserves root and subpath deployments without 404 callback segments', () => {
    expect(resolveWebAuthRedirectUrl('http://localhost:8081')).toBe('http://localhost:8081/');
    expect(resolveWebAuthRedirectUrl('http://localhost:8081/auth/callback?code=123')).toBe('http://localhost:8081/');
    expect(resolveWebAuthRedirectUrl('https://user.github.io/Spark-Love')).toBe('https://user.github.io/Spark-Love/');
    expect(resolveWebAuthRedirectUrl('https://user.github.io/Spark-Love/')).toBe('https://user.github.io/Spark-Love/');
    expect(resolveWebAuthRedirectUrl('https://user.github.io/Spark-Love/index.html#access_token=abc')).toBe(
      'https://user.github.io/Spark-Love/',
    );
    expect(resolveWebAuthRedirectUrl('https://user.github.io/Spark-Love/auth/callback?error=access_denied')).toBe(
      'https://user.github.io/Spark-Love/',
    );
  });

  test('uses explicit EXPO_PUBLIC_BASE_URL when configured', () => {
    expect(
      resolveWebAuthRedirectUrl('https://yacine20005.github.io/Spark-Love/nested/screen', '/Spark-Love'),
    ).toBe('https://yacine20005.github.io/Spark-Love/');
    expect(
      resolveWebAuthRedirectUrl('https://yacine20005.github.io/Spark-Love/auth/callback', '/Spark-Love/'),
    ).toBe('https://yacine20005.github.io/Spark-Love/');
    expect(resolveWebAuthRedirectUrl('https://sparklove.app/nested', '/')).toBe('https://sparklove.app/');
    expect(resolveWebAuthRedirectUrl('https://yacine20005.github.io/Spark-Love/', '')).toBe(
      'https://yacine20005.github.io/Spark-Love/',
    );
  });
});

describe('stripAuthParamsFromUrl', () => {
  test('removes auth query and hash params while preserving unrelated query params', () => {
    expect(
      stripAuthParamsFromUrl('https://example.com/spark-love/?invite=ABC123&code=secret&sb_flow_id=f1'),
    ).toBe('https://example.com/spark-love/?invite=ABC123');

    expect(
      stripAuthParamsFromUrl('https://example.com/spark-love/#access_token=a&refresh_token=b&type=magiclink'),
    ).toBe('https://example.com/spark-love/');

    expect(
      stripAuthParamsFromUrl('https://example.com/spark-love/?error=access_denied&error_code=otp_expired'),
    ).toBe('https://example.com/spark-love/');
  });
});

describe('createSafeWebStorage', () => {
  test('delegates to underlying Storage when available', () => {
    const backing = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => void backing.set(k, v),
      removeItem: (k: string) => void backing.delete(k),
    } as Storage;

    const storage = createSafeWebStorage(() => fakeStorage);
    storage.setItem('sb-token', 'v1');
    expect(storage.getItem('sb-token')).toBe('v1');
    storage.removeItem('sb-token');
    expect(storage.getItem('sb-token')).toBeNull();
  });

  test('falls back to in-memory storage when Storage is missing or throws', () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    } as unknown as Storage;

    const fallback = createSafeWebStorage(() => throwingStorage);
    fallback.setItem('k', 'val');
    expect(fallback.getItem('k')).toBe('val');
    fallback.removeItem('k');
    expect(fallback.getItem('k')).toBeNull();

    const noWindow = createSafeWebStorage(() => null);
    noWindow.setItem('k2', 'val2');
    expect(noWindow.getItem('k2')).toBe('val2');
  });
});
