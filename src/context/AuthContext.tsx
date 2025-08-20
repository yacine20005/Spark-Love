import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile, Couple, AuthContextType } from '../types/auth';
import { AuthService } from "../api/authService";
import { ProfileService } from "../api/profileService";
import { PartnerService } from "../api/partnerService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const setActiveCouple = useCallback((couple: Couple | null) => {
    setActiveCoupleState(couple);
    if (user) {
      void persistActiveCouple(user.id, couple);
    }
  }, [persistActiveCouple, user]);

  const refreshAllData = useCallback(async (currentUser: User) => {
    if (!currentUser) return;

    setLoadingCouples(true);
    const profileData = await ProfileService.getProfile(currentUser);
    setProfile(profileData);

    const couplesData = await PartnerService.getHydratedCouples(currentUser);
    setCouples(couplesData);
    await restoreActiveCouple(currentUser.id, couplesData);
    setLoadingCouples(false);

  }, [restoreActiveCouple]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await refreshAllData(currentUser);
      }
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const prevUserId = user?.id;
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);

        if (currentUser) {
          await refreshAllData(currentUser);
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
  }, [refreshAllData, user?.id]);

  const signOut = async () => {
    await AuthService.signOut();
  };

  const refreshCouples = async () => {
    if (user) {
      setLoadingCouples(true);
      const couplesData = await PartnerService.getHydratedCouples(user);
      setCouples(couplesData);
      await restoreActiveCouple(user.id, couplesData);
      setLoadingCouples(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await ProfileService.getProfile(user);
      setProfile(profileData);
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
