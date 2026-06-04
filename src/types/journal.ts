export type JournalEntryType = 'sync' | 'memory' | 'note';

export interface JournalEntry {
  id: string;
  couple_id: string;
  user_id: string;
  entry_type: JournalEntryType;
  title: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}
