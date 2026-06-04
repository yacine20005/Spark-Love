import { supabase } from '../lib/supabase';
import { JournalEntry, JournalEntryType } from '../types/journal';

export class JournalService {
  /**
   * Fetches all journal entries for a couple, including the author's profile details.
   */
  static async getJournalEntries(coupleId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, profiles:user_id(first_name, last_name)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Creates a new journal entry.
   */
  static async createJournalEntry(
    coupleId: string,
    userId: string,
    entryType: JournalEntryType,
    title: string | null,
    content: string,
    imageUrl: string | null
  ): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        entry_type: entryType,
        title,
        content,
        image_url: imageUrl,
      })
      .select('*, profiles:user_id(first_name, last_name)')
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
    return data;
  }
}
