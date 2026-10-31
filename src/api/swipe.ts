import { supabase } from '../lib/supabase';
import type { SwipeKind } from '../lib/types';
import { unwrap } from './unwrap';

/** Items of a kind that I haven't swiped yet, in deck order. */
export async function fetchDeck(kind: SwipeKind) {
  const [items, mine] = await Promise.all([
    supabase.from('swipe_items').select('*').eq('kind', kind).order('sort_order').then(unwrap),
    supabase.from('swipes').select('item_id').then(unwrap),
  ]);
  const seen = new Set(mine.map((s) => s.item_id));
  return items.filter((i) => !seen.has(i.id));
}

export const swipe = async (itemId: string, liked: boolean) =>
  unwrap(await supabase.rpc('swipe', { p_item_id: itemId, p_liked: liked }));

export const fetchMatches = async () => unwrap(await supabase.rpc('swipe_matches'));

export async function resetDeck(kind: SwipeKind) {
  const ids = unwrap(await supabase.from('swipe_items').select('id').eq('kind', kind)).map((i) => i.id);
  unwrap(await supabase.from('swipes').delete().in('item_id', ids));
}
