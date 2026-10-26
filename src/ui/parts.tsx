// Small shared UI pieces.

import { splitPinyin } from '../logic/pinyin';
import { formatCount, type WordStats } from '../logic/stats';
import type { Level } from '../types';
import { speak } from './speech';

/** Pinyin with every syllable coloured by its tone. */
export function Pinyin({ text, class: cls = '' }: { text: string; class?: string }) {
  return (
    <span class={`pinyin ${cls}`} lang="zh-Latn-pinyin">
      {splitPinyin(text).map((p, i) => (p.tone ? <span key={i} class={`t${p.tone}`}>{p.text}</span> : p.text))}
    </span>
  );
}

export const LEVEL_NAMES: Record<Level, string> = {
  new: 'New',
  struggling: 'Struggling',
  learning: 'Learning',
  familiar: 'Familiar',
  mastered: 'Mastered',
};

export function LevelBadge({ level }: { level: Level }) {
  return <span class={`badge lv-${level}`}>{LEVEL_NAMES[level]}</span>;
}

export function Counts({ stats }: { stats: WordStats }) {
  return (
    <span class="counts" title="Times right · times wrong">
      <span class="right">✓ {formatCount(stats.right)}</span> · <span class="wrong">✗ {formatCount(stats.wrong)}</span>
    </span>
  );
}

export function SpeakerButton({ text, label = 'Play' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      class="speaker"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z" />
        <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    </button>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label class="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
      <span class="track" aria-hidden="true"><span class="thumb" /></span>
      <span>{label}</span>
    </label>
  );
}
