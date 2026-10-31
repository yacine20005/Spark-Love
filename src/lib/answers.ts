import type { Question } from './types';

type Comparable = Pick<Question, 'type' | 'scale_min' | 'scale_max'>;

/**
 * Whether two answers "agree". Free-text answers are never scored; scales agree
 * when within 10% of the range (rounded, min 1 step); everything else must match.
 */
export function isAligned(q: Comparable, a: string, b: string): boolean | null {
  if (q.type === 'text') return null;
  if (q.type === 'scale') {
    const tolerance = Math.max(1, Math.round(((q.scale_max ?? 10) - (q.scale_min ?? 0)) / 10));
    return Math.abs(Number(a) - Number(b)) <= tolerance;
  }
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Percentage of scorable questions where both partners agree, or null if none are scorable. */
export function alignmentScore(pairs: { question: Comparable; mine: string; partner: string }[]): number | null {
  const scored = pairs.map((p) => isAligned(p.question, p.mine, p.partner)).filter((r): r is boolean => r !== null);
  if (scored.length === 0) return null;
  return Math.round((scored.filter(Boolean).length / scored.length) * 100);
}
