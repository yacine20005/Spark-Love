import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Represents a user's public profile
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

// Represents a couple link, including the partner's info
export interface Couple {
  id: string; // The ID of the couple entry
  partner: Profile & { email?: string };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // New state for couple management
  couples: Couple[];
  activeCouple: Couple | null; // null means solo mode
  loadingCouples: boolean;
  setActiveCouple: (couple: Couple | null) => void;
  refreshCouples: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Supabase/PostgREST error code for "row not found"
const POSTGREST_NOT_FOUND_ERROR = 'PGRST116';

const activeCoupleKey = (userId: string) => `sparklove_active_couple_${userId}`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // New state for couples
  const [couples, setCouples] = useState<Couple[]>([]);
  const [activeCouple, setActiveCoupleState] = useState<Couple | null>(null);
  const [loadingCouples, setLoadingCouples] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code === POSTGREST_NOT_FOUND_ERROR) {
        // Profile does not exist, so create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: currentUser.id })
          .select('id, first_name, last_name')
          .single();

        if (insertError) throw insertError;
        data = newProfile;
      } else if (error) {
        throw error;
      }

      setProfile(data);
    } catch (e) {
      console.error("Failed to fetch or create profile:", e);
    }
  }, []);

  const persistActiveCouple = useCallback(async (userId: string, couple: Couple | null) => {
    try {
      if (couple) {
        await AsyncStorage.setItem(activeCoupleKey(userId), couple.id);
      } else {
        await AsyncStorage.removeItem(activeCoupleKey(userId));
      }
    } catch (e) {
      console.warn("Failed to persist activeCouple preference:", e);
    }
  }, []);

  const restoreActiveCouple = useCallback(async (userId: string, availableCouples: Couple[]) => {
    try {
      const storedId = await AsyncStorage.getItem(activeCoupleKey(userId));
      if (storedId) {
        const found = availableCouples.find(c => c.id === storedId) || null;
        if (found) {
          setActiveCoupleState(found);
          return;
        }
        await AsyncStorage.removeItem(activeCoupleKey(userId));
      }
      setActiveCoupleState(null);
    } catch (e) {
      console.warn("Failed to restore activeCouple preference:", e);
      setActiveCoupleState(null);
    }
  }, []);

  const fetchCouples = useCallback(async (currentUser: User) => {
    if (!currentUser) return;

    setLoadingCouples(true);
    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .not('user2_id', 'is', null);

      if (coupleError) throw coupleError;

      const partnerIds = (coupleData || []).map(c => c.user1_id === currentUser.id ? c.user2_id : c.user1_id);

      if (partnerIds.length === 0) {
        setCouples([]);
        setLoadingCouples(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', partnerIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map(p => [p.id, p]));

      const fetchedCouples: Couple[] = (coupleData || []).map((c: any) => {
        const partnerId = c.user1_id === currentUser.id ? c.user2_id : c.user1_id;
        const partnerProfile = profilesMap.get(partnerId);
        return {
          id: c.id,
          partner: {
            id: partnerId,
            first_name: partnerProfile?.first_name || null,
            last_name: partnerProfile?.last_name || null,
            email: 'Email not loaded', // We need to fetch this separately if needed
          },
        };
      });

      setCouples(fetchedCouples);
      await restoreActiveCouple(currentUser.id, fetchedCouples);
    } catch (e) {
      console.error("Failed to fetch couples:", e);
      setCouples([]);
      setActiveCoupleState(null);
    } finally {
      setLoadingCouples(false);
    }
  }, [restoreActiveCouple]);

  const setActiveCouple = useCallback((couple: Couple | null) => {
    setActiveCoupleState(couple);
    if (user) {
      void persistActiveCouple(user.id, couple);
    }
  }, [persistActiveCouple, user]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
        await fetchCouples(session.user);
      }
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const prevUserId = user?.id;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
          await fetchCouples(session.user);
        } else {
          setProfile(null);
          setCouples([]);
          setActiveCoupleState(null);
          if (prevUserId) {
            try { await AsyncStorage.removeItem(activeCoupleKey(prevUserId)); } catch (e) { console.warn("Failed to delete activeCouple preference on sign out:", e); }
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchCouples, fetchProfile, user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshCouples = async () => {
    if (user) {
      await fetchCouples(user);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        couples,
        activeCouple,
        loadingCouples,
        setActiveCouple,
        refreshCouples,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
