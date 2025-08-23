import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/auth';

// The code generation logic is now handled by a Supabase RPC function.

// Partner Service
export class PartnerService {

  /**
   * Calls an RPC function to generate a unique linking code and create a pending couple entry.
   */
  static async generateLinkingCode(): Promise<string> {
    const { data, error } = await supabase.rpc('create_couple_and_get_linking_code');

    if (error) {
      // Provide a more user-friendly error message
      if (error.message.includes('User is already in a couple')) {
        throw new Error('You are already part of a linked couple.');
      }
      console.error('Error generating linking code:', error);
      throw new Error('Failed to generate a linking code. Please try again.');
    }
    return data;
  }

  /**
   * Links the current user to a partner using a linking code via an RPC function.
   * @param linkingCode The 6-character code from the partner.
   */
  static async linkWithCode(linkingCode: string): Promise<void> {
    const { error } = await supabase.rpc('link_partner', {
      linking_code_to_join: linkingCode,
    });

    if (error) {
      // Extract a cleaner error message for the user
      const message = error.message.includes('RAISE EXCEPTION')
        ? error.message.split('RAISE EXCEPTION: ')[1].trim()
        : 'An unknown error occurred.';
      console.error('Error linking with code:', error);
      throw new Error(message);
    }
    // If we reach here, the RPC was successful.
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
