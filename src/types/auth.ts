import { Session, User } from '@supabase/supabase-js';

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

export interface AuthContextType {
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
