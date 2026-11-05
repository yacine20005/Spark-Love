import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setBooting(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setHousehold(null);
        setBooting(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        setHousehold(await fetchHousehold(userId));
        setBooting(false);
        return;
      } catch {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
      }
    }
    setBooting(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
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
