import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/auth';

// Simple 6-char uppercase alphanumeric generator (server-side)
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};


// Partner Service
export class PartnerService {

  /**
   * Generates a unique linking code and creates a pending couple entry.
   * @param userId The ID of the user creating the code.
   */
  static async generateLinkingCode(userId: string): Promise<string> {
    let code = generateCode();
    let exists = true;
    let attempts = 0;

    // Try up to 10 times to generate a unique code to avoid infinite loops
    while (exists && attempts < 10) {
      const { data } = await supabase.from('couples').select('id').eq('linking_code', code).single();
      exists = !!data;
      if (exists) {
        code = generateCode();
      }
      attempts++;
    }

    if (exists) {
      throw new Error('Could not generate a unique code. Please try again.');
    }

    // Insert a pending couple row
    const { data, error } = await supabase
      .from('couples')
      .insert({ user1_id: userId, linking_code: code })
      .select('linking_code')
      .single();

    if (error) throw error;
    return data.linking_code as string;
  }

  /**
   * Links the current user to a partner using a linking code.
   * This is done in a single atomic update operation to comply with RLS policies.
   * @param linkingCode The 6-character code from the partner.
   * @param userId The ID of the user joining.
   */
  static async linkWithCode(linkingCode: string, userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('couples')
      .update({
        user2_id: userId,
        linking_code: null, // Nullify the code so it cannot be reused
      })
      .eq('linking_code', linkingCode) // Find the row by its code
      .is('user2_id', null)           // Ensure it's an open invitation
      .neq('user1_id', userId)         // Prevent linking to oneself
      .select(); // No .single() - we expect an array

    // Handle potential database errors (e.g., RLS violation)
    if (error) {
      throw error;
    }

    // If the returned array is empty, it means no row was updated.
    // This happens if the code was invalid, expired, or belonged to the user themselves.
    if (!data || data.length === 0) {
      throw new Error('Invalid or expired linking code.');
    }
    // If we reach here, the update was successful.
  }


  static async getHydratedCouples(currentUser: User): Promise<Couple[]> {
    if (!currentUser) return [];

    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .not('user2_id', 'is', null);

      if (coupleError) throw coupleError;

      const partnerIds = (coupleData || []).map(c => c.user1_id === currentUser.id ? c.user2_id : c.user1_id);

      if (partnerIds.length === 0) {
        return [];
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
            email: 'null', // The email is stored in the auth table in supabase
          },
        };
      });

      return fetchedCouples;
    } catch (e) {
      console.error("Failed to fetch couples:", e);
      return [];
    }
  }
}