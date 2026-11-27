import { supabase } from '../lib/supabase';
import { fetchTrending } from '../lib/tmdb';
import type { DeckPage, SwipeItem, SwipeKind } from '../lib/types';
import { unwrap } from './unwrap';

const MAX_AUTO_ADVANCE_PAGES = 5;

async function fetchSeenExternalIds(kind: 'movie' | 'tv'): Promise<Set<string>> {
  const rows = unwrap(
    await supabase
      .from('swipes')
      .select('swipe_items!inner(external_id)')
      .eq('swipe_items.kind', kind)
      .not('swipe_items.external_id', 'is', null),
  );

  const seen = new Set<string>();
  for (const row of rows) {
    const linked = row.swipe_items;
    if (Array.isArray(linked)) {
      for (const entry of linked) {
        if (entry?.external_id) seen.add(entry.external_id);
      }
    } else if (linked?.external_id) {
      seen.add(linked.external_id);
    }
  }
  return seen;
}

/** Items of a kind that I haven't swiped yet, with optional pagination for TMDB feeds. */
export async function fetchDeckPage(kind: SwipeKind, page = 1): Promise<DeckPage> {
  if (kind === 'date') {
    const [items, mine] = await Promise.all([
      supabase.from('swipe_items').select('*').eq('kind', 'date').order('sort_order').then(unwrap),
      supabase.from('swipes').select('item_id').then(unwrap),
    ]);
    const seen = new Set(mine.map((s) => s.item_id));
    return { items: items.filter((i) => !seen.has(i.id)), nextPage: null };
  }

  const seen = await fetchSeenExternalIds(kind);
  let currentPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  let totalPages = currentPage;
  const items: SwipeItem[] = [];
  const batchSeen = new Set<string>();

  for (let attempt = 0; attempt < MAX_AUTO_ADVANCE_PAGES; attempt++) {
    const result = await fetchTrending(kind, currentPage);
    totalPages = result.totalPages;

    for (const item of result.items) {
      const key = item.external_id ?? item.id;
      if (seen.has(key) || batchSeen.has(key)) continue;
      batchSeen.add(key);
      items.push(item);
    }

    if (items.length > 0 || currentPage >= totalPages) {
      break;
    }

    if (attempt < MAX_AUTO_ADVANCE_PAGES - 1) {
      currentPage += 1;
    }
  }

  return {
    items,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
  };
}

/** Items of a kind that I haven't swiped yet, in deck order. */
export async function fetchDeck(kind: SwipeKind): Promise<SwipeItem[]> {
  return fetchDeckPage(kind, 1).then((p) => p.items);
}

export async function swipe(item: SwipeItem, liked: boolean): Promise<boolean> {
  if (item.external_id) {
    return unwrap(
      await supabase.rpc('swipe_external', {
        p_external_id: item.external_id,
        p_kind: item.kind,
        p_title: item.title,
        p_description: item.description,
        p_tags: item.tags,
        p_icon: item.icon,
        p_image_url: item.image_url,
        p_liked: liked,
      }),
    );
  }
  return unwrap(await supabase.rpc('swipe', { p_item_id: item.id, p_liked: liked }));
}

export const fetchMatches = async (): Promise<SwipeItem[]> =>
  unwrap(await supabase.rpc('swipe_matches'));

export async function resetDeck(kind: SwipeKind): Promise<void> {
  const { error } = await supabase.rpc('reset_swipes', { p_kind: kind });
  if (error) throw error;
}
