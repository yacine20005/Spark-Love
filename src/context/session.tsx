import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { fetchHousehold, type Household } from '../api/couple';
import { supabase } from '../lib/supabase';

type SessionState = {
  session: Session | null;
  household: Household | null;
  /** True until the first auth + profile load has finished. */
  booting: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [booting, setBooting] = useState(true);
  const userId = session?.user.id;
  const activeUserIdRef = useRef<string | undefined>(undefined);
  activeUserIdRef.current = userId;

  useEffect(() => {
    let mounted = true;

    const applySession = (next: Session | null) => {
      if (!mounted) return;
      setSession(next);
      setHousehold((prev) => {
        if (!next) return null;
        return prev && prev.me.id !== next.user.id ? null : prev;
      });
      if (!next) setBooting(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => applySession(null));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const nextHousehold = await fetchHousehold(userId);
        if (activeUserIdRef.current !== userId) return;
        setHousehold(nextHousehold);
        setBooting(false);
        return;
      } catch {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
      }
    }

    // If profile fetch failed repeatedly, check whether the session itself was revoked or deleted
    // so the app never gets stranded on the boot loader.
    if (activeUserIdRef.current === userId) {
      try {
        const { data, error } = await supabase.auth.getUser();
        const invalidSession =
          !data.user ||
          (error != null && (error.status === 401 || error.status === 403 || error.status === 404));
        if (invalidSession) {
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch {
        // Offline or transient network failure; keep the session and retry when back online.
      }
      setBooting(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onOnline = () => void refresh();
      window.addEventListener('online', onOnline);
      return () => {
        sub.remove();
        window.removeEventListener('online', onOnline);
      };
    }
    return () => sub.remove();
  }, [refresh]);

  // shortcut: poll while an invite is pending so the inviter sees the partner join;
  // Supabase Realtime on `profiles` would remove the 5s delay.
  const pending = !!household?.couple && !household.partner;
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [pending, refresh]);

  return <SessionContext.Provider value={{ session, household, booting, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** For screens that only render once the user is signed in with a profile. */
export function useHousehold() {
  const { household, refresh } = useSession();
  if (!household) throw new Error('useHousehold used before the profile loaded');
  return { ...household, refresh, linked: !!household.partner };
}
