import type { EmailOtpType, SupportedStorage } from '@supabase/supabase-js';

export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

const AUTH_QUERY_KEYS = [
  'code',
  'sb_flow_id',
  'token_hash',
  'type',
  'error',
  'error_code',
  'error_description',
] as const;

const AUTH_HASH_KEYS = [
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'provider_token',
  'provider_refresh_token',
  'type',
  'error',
  'error_code',
  'error_description',
] as const;

export type AuthCallbackResult =
  | { kind: 'none' }
  | { kind: 'error'; message: string; code?: string }
  | { kind: 'pkce'; code: string; flowId?: string }
  | { kind: 'implicit'; accessToken: string; refreshToken: string }
  | { kind: 'token_hash'; tokenHash: string; type: EmailOtpType };

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(normalizeEmail(raw));
}

/** Keeps digits only and caps at OTP_MAX_LENGTH (supports 6- and 8-digit Supabase OTPs). */
export function normalizeOtpCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH);
}

export function isValidOtpCode(code: string): boolean {
  return code.length >= OTP_MIN_LENGTH && code.length <= OTP_MAX_LENGTH && /^\d+$/.test(code);
}

function extractParam(url: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = url.match(new RegExp(`[?&#]${escaped}=([^&#]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  } catch {
    return match[1];
  }
}

export function friendlyAuthCallbackError(errorCode: string | null, errorDescription: string | null, error: string | null): string {
  const code = (errorCode ?? error ?? '').toLowerCase();
  const desc = errorDescription?.trim() || '';

  if (code === 'otp_expired' || /expired/i.test(desc)) {
    return 'That sign-in link has expired. Enter a fresh code or request a new email.';
  }
  if (code === 'access_denied' || /denied|cancel/i.test(desc)) {
    return 'Sign-in was cancelled. Try again when you are ready.';
  }
  return desc || error || 'Could not complete sign-in. Please try again.';
}

export function parseAuthCallbackUrl(url: string): AuthCallbackResult {
  if (!url) return { kind: 'none' };

  const errorCode = extractParam(url, 'error_code');
  const errorDesc = extractParam(url, 'error_description');
  const error = extractParam(url, 'error');
  if (error || errorDesc || errorCode) {
    return {
      kind: 'error',
      message: friendlyAuthCallbackError(errorCode, errorDesc, error),
      ...(errorCode ? { code: errorCode } : {}),
    };
  }

  const code = extractParam(url, 'code');
  if (code) {
    const flowId = extractParam(url, 'sb_flow_id') ?? undefined;
    return flowId ? { kind: 'pkce', code, flowId } : { kind: 'pkce', code };
  }

  const accessToken = extractParam(url, 'access_token');
  const refreshToken = extractParam(url, 'refresh_token');
  if (accessToken && refreshToken) {
    return { kind: 'implicit', accessToken, refreshToken };
  }

  const tokenHash = extractParam(url, 'token_hash');
  const rawType = extractParam(url, 'type');
  if (tokenHash && rawType && VALID_EMAIL_OTP_TYPES.has(rawType as EmailOtpType)) {
    return { kind: 'token_hash', tokenHash, type: rawType as EmailOtpType };
  }

  return { kind: 'none' };
}

export function isAuthCallbackUrl(url: string): boolean {
  return parseAuthCallbackUrl(url).kind !== 'none';
}

/**
 * Returns the app's base URL on web so OAuth and magic links redirect back to the
 * deployed root or subpath (e.g. `https://yacine20005.github.io/Spark-Love/` or `http://localhost:8081/`)
 * without hitting a 404 on static hosts like GitHub Pages.
 */
export function resolveWebAuthRedirectUrl(href: string, baseUrl?: string): string {
  const parsed = new URL(href);
  const trimmedBase = baseUrl?.trim();

  if (trimmedBase) {
    const clean = trimmedBase.replace(/^\/+|\/+$/g, '');
    const pathname = clean ? `/${clean}/` : '/';
    return `${parsed.origin}${pathname}`;
  }

  let pathname = parsed.pathname;
  pathname = pathname.replace(/\/index\.html$/i, '/');
  pathname = pathname.replace(/\/auth\/callback\/?$/i, '/');
  if (!pathname.endsWith('/')) pathname = `${pathname}/`;

  return `${parsed.origin}${pathname}`;
}

/** Removes Supabase auth parameters from a web URL while preserving non-auth params. */
export function stripAuthParamsFromUrl(href: string): string {
  const parsed = new URL(href);

  for (const key of AUTH_QUERY_KEYS) {
    parsed.searchParams.delete(key);
  }

  if (parsed.hash.length > 1) {
    const rawHash = parsed.hash.slice(1);
    const hashParams = new URLSearchParams(rawHash);
    let touched = false;
    for (const key of AUTH_HASH_KEYS) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        touched = true;
      }
    }
    if (touched) {
      const nextHash = hashParams.toString();
      parsed.hash = nextHash ? `#${nextHash}` : '';
    }
  }

  return parsed.toString();
}

/**
 * Safe web storage adapter backed by `window.localStorage` with an in-memory fallback
 * when running outside a browser (static export/tests) or when storage is blocked
 * (e.g. restricted Safari private mode). Uses raw keys identical to AsyncStorage on web.
 */
export function createSafeWebStorage(
  getStorage: () => Storage | null = () => (typeof window !== 'undefined' ? window.localStorage : null),
): SupportedStorage {
  const memory = new Map<string, string>();

  function resolveStorage(): Storage | null {
    try {
      return getStorage();
    } catch {
      return null;
    }
  }

  return {
    getItem(key: string): string | null {
      const storage = resolveStorage();
      if (storage) {
        try {
          return storage.getItem(key);
        } catch {
          return memory.get(key) ?? null;
        }
      }
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      const storage = resolveStorage();
      if (storage) {
        try {
          storage.setItem(key, value);
          return;
        } catch {
          // fall through to in-memory fallback
        }
      }
      memory.set(key, value);
    },
    removeItem(key: string): void {
      const storage = resolveStorage();
      if (storage) {
        try {
          storage.removeItem(key);
        } catch {
          // ignore storage removal errors
        }
      }
      memory.delete(key);
    },
  };
}
