/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { alignmentScore, isAligned } from './answers';
import { daysSince, parseISODate, toISODate } from './dates';
import { sparkForDate, SPARK_PROMPTS } from './spark';

const scale = { type: 'scale', scale_min: 0, scale_max: 10 } as const;
const choice = { type: 'multiple_choice', scale_min: null, scale_max: null } as const;
const text = { type: 'text', scale_min: null, scale_max: null } as const;

describe('isAligned', () => {
  test('scales agree within one step on 0-10', () => {
    expect(isAligned(scale, '7', '8')).toBe(true);
    expect(isAligned(scale, '7', '9')).toBe(false);
  });
  test('choices compare case-insensitively', () => {
    expect(isAligned(choice, 'Texts', ' texts')).toBe(true);
    expect(isAligned(choice, 'Texts', 'Calls')).toBe(false);
  });
  test('text answers are not scored', () => {
    expect(isAligned(text, 'a', 'a')).toBeNull();
  });
});

test('alignmentScore ignores text and rounds', () => {
  expect(
    alignmentScore([
      { question: choice, mine: 'a', partner: 'a' },
      { question: choice, mine: 'a', partner: 'b' },
      { question: scale, mine: '3', partner: '3' },
      { question: text, mine: 'x', partner: 'y' },
    ]),
  ).toBe(67);
  expect(alignmentScore([{ question: text, mine: 'x', partner: 'y' }])).toBeNull();
});

describe('dates', () => {
  const today = new Date(2026, 9, 31);
  test('parseISODate accepts real past dates only', () => {
    expect(parseISODate('2024-02-14', today)).toBe('2024-02-14');
    expect(parseISODate('2024-02-30', today)).toBeNull();
    expect(parseISODate('2027-01-01', today)).toBeNull();
    expect(parseISODate('14/02/2024', today)).toBeNull();
  });
  test('daysSince counts calendar days', () => {
    expect(daysSince('2026-10-30', today)).toBe(1);
    expect(daysSince(toISODate(today), today)).toBe(0);
    expect(daysSince('2025-10-31', today)).toBe(365);
  });
});

test('sparkForDate is stable within a day and rotates daily', () => {
  const morning = new Date(2026, 9, 31, 8);
  const night = new Date(2026, 9, 31, 23);
  const next = new Date(2026, 10, 1, 8);
  expect(sparkForDate(morning)).toBe(sparkForDate(night));
  expect(sparkForDate(next)).not.toBe(sparkForDate(morning));
  expect(SPARK_PROMPTS).toContain(sparkForDate(morning));
});
