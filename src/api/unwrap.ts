import type { PostgrestError } from '@supabase/supabase-js';

/** Returns data or throws the Supabase error so callers can use try/catch. */
export function unwrap<T>({ data, error }: { data: T; error: PostgrestError | null }): NonNullable<T> {
  if (error) throw error;
  return data as NonNullable<T>;
}
