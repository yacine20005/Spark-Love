const DAY_MS = 86_400_000;

/** Local calendar date as YYYY-MM-DD (what Postgres `date` columns expect). */
export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a YYYY-MM-DD string typed by a person; rejects impossible and future dates. */
export function parseISODate(input: string, today = new Date()): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  if (toISODate(date) > toISODate(today) || y < 1900) return null;
  return toISODate(date);
}

/** Whole days between a YYYY-MM-DD date and today (local time). */
export function daysSince(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d);
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

/** Index of the local day since the Unix epoch, stable across time zones within a day. */
export function dayIndex(today = new Date()): number {
  return Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / DAY_MS);
}
