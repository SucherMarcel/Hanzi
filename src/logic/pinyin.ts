// Pinyin helpers: tone of a syllable, splitting text into colourable parts, search folding.

export type Tone = 1 | 2 | 3 | 4 | 5;

const TONE_MARKS: Record<string, Tone> = {
  '̄': 1, // macron  ā
  '́': 2, // acute   á
  '̌': 3, // caron   ǎ
  '̀': 4, // grave   à
};

/** Tone of one syllable from its tone mark; 5 = neutral (no mark). */
export function toneOf(syllable: string): Tone {
  for (const ch of syllable.normalize('NFD')) {
    const t = TONE_MARKS[ch];
    if (t) return t;
  }
  return 5;
}

/** Remove tone marks (keeps ü): "xiè xie" → "xie xie". */
export function stripTones(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀́̄̌]/g, '')
    .normalize('NFC');
}

export interface PinyinPart {
  text: string;
  /** Tone for syllables; undefined for spaces and punctuation. */
  tone?: Tone;
}

const SYLLABLE = /[a-zA-ZüÜÀ-ɏ̀-ͯ]+/g;

/** Split pinyin text (syllables separated by spaces) into syllables and the text between them. */
export function splitPinyin(text: string): PinyinPart[] {
  const parts: PinyinPart[] = [];
  let last = 0;
  for (const m of text.matchAll(SYLLABLE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: text.slice(last, i) });
    parts.push({ text: m[0], tone: toneOf(m[0]) });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** Lower-case, tone-free, space-free form for searching: "Xiè xie" → "xiexie"; "v" also matches "ü". */
export function foldPinyin(text: string): string {
  return stripTones(text).toLowerCase().replace(/ü/g, 'v').replace(/[^a-z]/g, '');
}
