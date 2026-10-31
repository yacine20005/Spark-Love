import { supabase } from '../lib/supabase';
import type { Couple, Profile } from '../lib/types';
import { unwrap } from './unwrap';

export type Household = { me: Profile; couple: Couple | null; partner: Profile | null };

export async function fetchHousehold(userId: string): Promise<Household> {
  const me = unwrap(await supabase.from('profiles').select('*').eq('id', userId).single());
  if (!me.couple_id) return { me, couple: null, partner: null };
  const [couple, partner] = await Promise.all([
    supabase.from('couples').select('*').eq('id', me.couple_id).single().then(unwrap),
    supabase.from('profiles').select('*').eq('couple_id', me.couple_id).neq('id', userId).maybeSingle(),
  ]);
  if (partner.error) throw partner.error;
  return { me, couple, partner: partner.data };
}

export async function updateDisplayName(userId: string, displayName: string) {
  unwrap(await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId));
}

export async function updateTogetherSince(coupleId: string, date: string | null) {
  unwrap(await supabase.from('couples').update({ together_since: date }).eq('id', coupleId));
}

export const createInvite = async () => unwrap(await supabase.rpc('create_invite'));
export const joinCouple = async (code: string) => unwrap(await supabase.rpc('join_couple', { code }));
export const leaveCouple = async () => unwrap(await supabase.rpc('leave_couple'));
export const deleteAccount = async () => unwrap(await supabase.rpc('delete_account'));
