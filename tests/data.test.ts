// Checks the word list file for mistakes that are easy to make when editing it by hand.
import { describe, expect, it } from 'vitest';
import hsk1 from '../data/hsk1.json';
import { splitPinyin, stripTones } from '../src/logic/pinyin';
import type { Word } from '../src/types';

const words = hsk1.words as Word[];
const hanziCount = (s: string) => [...s].filter((c) => /\p{Script=Han}/u.test(c)).length;
/** Syllables, counting erhua like "diǎnr" as one syllable that covers two characters. */
function syllableChars(pinyin: string): number {
  return splitPinyin(pinyin)
    .filter((p) => p.tone)
    .reduce((n, p) => n + (/[^e]r$/i.test(p.text) && stripTones(p.text).toLowerCase() !== 'er' ? 2 : 1), 0);
}

describe('data/hsk1.json', () => {
  it('has unique IDs and words', () => {
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    expect(new Set(words.map((w) => w.hanzi)).size).toBe(words.length);
  });
  it('has every field filled in', () => {
    for (const w of words) {
      expect([w.id, w.hanzi, w.pinyin, w.meaning, w.topic, w.example.hanzi, w.example.pinyin, w.example.english].every(Boolean), w.hanzi).toBe(true);
    }
  });
  it('has one pinyin syllable per character', () => {
    for (const w of words) {
      expect(syllableChars(w.pinyin), `${w.hanzi} ${w.pinyin}`).toBe(hanziCount(w.hanzi));
      expect(syllableChars(w.example.pinyin), `${w.example.hanzi} ${w.example.pinyin}`).toBe(hanziCount(w.example.hanzi));
    }
  });
  it('uses the word in its example', () => {
    for (const w of words) expect(w.example.hanzi, w.hanzi).toContain(w.hanzi);
  });
});
