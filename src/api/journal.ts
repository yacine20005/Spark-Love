import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalKind } from '../lib/types';
import { unwrap } from './unwrap';

export type EntryWithPhoto = JournalEntry & { photoUrl: string | null };

const BUCKET = 'journal';

export async function fetchJournal(limit = 50): Promise<EntryWithPhoto[]> {
  const entries = unwrap(
    await supabase.from('journal_entries').select('*').order('created_at', { ascending: false }).limit(limit),
  );
  const paths = entries.flatMap((e) => (e.image_path ? [e.image_path] : []));
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => d.path && d.signedUrl && (urls[d.path] = d.signedUrl));
  }
  return entries.map((e) => ({ ...e, photoUrl: e.image_path ? (urls[e.image_path] ?? null) : null }));
}

type NewEntry = { kind: JournalKind; title?: string | null; body: string; photo?: { base64: string; mimeType: string } | null };

export async function addEntry(coupleId: string, userId: string, entry: NewEntry) {
  let image_path: string | null = null;
  if (entry.photo) {
    const ext = entry.photo.mimeType.split('/')[1] ?? 'jpg';
    image_path = `${coupleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(image_path, decode(entry.photo.base64), { contentType: entry.photo.mimeType });
    if (error) throw error;
  }
  unwrap(
    await supabase.from('journal_entries').insert({
      couple_id: coupleId,
      user_id: userId,
      kind: entry.kind,
      title: entry.title?.trim() || null,
      body: entry.body.trim(),
      image_path,
    }),
  );
}

export async function deleteEntry(entry: JournalEntry) {
  unwrap(await supabase.from('journal_entries').delete().eq('id', entry.id));
  if (entry.image_path) await supabase.storage.from(BUCKET).remove([entry.image_path]);
}

/** Today's spark answers (mine and my partner's) for the given prompt. */
export async function fetchTodaySparks(prompt: string, since: Date) {
  return unwrap(
    await supabase
      .from('journal_entries')
      .select('*')
      .eq('kind', 'spark')
      .eq('title', prompt)
      .gte('created_at', since.toISOString()),
  );
}
