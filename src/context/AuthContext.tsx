import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Represents a couple link, including the partner's info
export interface Couple {
  id: string; // The ID of the couple entry
  partner: {
    id: string;
    email?: string;
    // We can add more profile details here later
  };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // New state for couple management
  couples: Couple[];
  activeCouple: Couple | null; // null means solo mode
  loadingCouples: boolean;
  setActiveCouple: (couple: Couple | null) => void;
  refreshCouples: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const activeCoupleKey = (userId: string) => `sparklove_active_couple_${userId}`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
        // Stored couple not found anymore, cleanup
        await AsyncStorage.removeItem(activeCoupleKey(userId));
      }
      // Default to Solo mode if nothing stored or invalid
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
      // Direct query on couples table (no RPC, no join with auth.users)
      const { data, error } = await supabase
        .from('couples')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .not('user2_id', 'is', null);

      if (error) throw error;

      const fetchedCouples: Couple[] = (data || []).map((c: any) => ({
        id: c.id,
        partner: {
          id: c.user1_id === currentUser.id ? c.user2_id : c.user1_id,
          // email not available without RPC or join; set as empty string
        },
      }));

      setCouples(fetchedCouples);

      // Restore selection based on SecureStore
      await restoreActiveCouple(currentUser.id, fetchedCouples);
    } catch (e) {
      console.error("Failed to fetch couples:", e);
      setCouples([]); // Clear couples on error
      // Even if couples failed, keep Solo mode
      setActiveCoupleState(null);
    } finally {
      setLoadingCouples(false);
    }
  }, [restoreActiveCouple]);

  // Wrap setter to persist selection
  const setActiveCouple = useCallback((couple: Couple | null) => {
    setActiveCoupleState(couple);
    if (user) {
      // Fire and forget persist
      void persistActiveCouple(user.id, couple);
    }
  }, [persistActiveCouple, user]);

  // Effect to get the initial session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        await fetchCouples(session.user);
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Capture previous user id for cleanup when signing out
        const prevUserId = user?.id;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchCouples(session.user);
        } else {
          // Clear couple data on sign out and remove persisted selection
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
  }, [fetchCouples, user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshCouples = async () => {
    if (user) {
      await fetchCouples(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut,
        couples,
        activeCouple,
        loadingCouples,
        setActiveCouple,
        refreshCouples,
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
