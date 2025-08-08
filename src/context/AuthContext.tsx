import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // New state for couples
  const [couples, setCouples] = useState<Couple[]>([]);
  const [activeCouple, setActiveCouple] = useState<Couple | null>(null);
  const [loadingCouples, setLoadingCouples] = useState(true);

  const fetchCouples = useCallback(async (currentUser: User) => {
    if (!currentUser) return;

    setLoadingCouples(true);
    try {
      // Call the new, secure RPC function to get couple data
      const { data, error } = await supabase.rpc('get_my_couples');

      if (error) throw error;

      const fetchedCouples: Couple[] = data.map((c: any) => ({
        id: c.couple_id,
        partner: {
          id: c.partner_id,
          email: c.partner_email,
        },
      }));

      setCouples(fetchedCouples);
    } catch (e) {
      console.error("Failed to fetch couples:", e);
      setCouples([]); // Clear couples on error
    } finally {
      setLoadingCouples(false);
    }
  }, []);

  // Effect to get the initial session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        await fetchCouples(session.user);
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCouples(session.user);
      } else {
        // Clear couple data on sign out
        setCouples([]);
        setActiveCouple(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchCouples]);

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
        refreshCouples
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
