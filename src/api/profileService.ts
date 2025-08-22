import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export class ProfileService {
  static async getProfile(user: User) {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return null;
      }

      return data;
    } catch (e) {
      console.error("Failed to fetch profile with unknown error:", e);
      return null;
    }
  }
}
