import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/auth';

// Partner Service
export class PartnerService {
  // Create a new couple and get a linking code
  static async createCoupleAndGetCode() {
    const { data, error } = await supabase.rpc('create_couple_and_get_code');
    if (error) {
      console.error('Error creating couple:', error);
      throw error;
    }
    return data;
  }

  // Link to a partner using their code
  static async linkPartner(linkingCode: string) {
    const { data, error } = await supabase.rpc('link_partner', {
      p_linking_code: linkingCode,
    });
    if (error) {
      console.error('Error linking partner:', error);
      throw error;
    }
    return data;
  }

  // Get all couples for the current user
  static async getMyCouples() {
    const { data, error } = await supabase.rpc('get_my_couples');
    if (error) {
      console.error('Error fetching couples:', error);
      throw error;
    }
    return data;
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
            email: 'Email not loaded', // We need to fetch this separately if needed
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