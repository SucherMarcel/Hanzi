# Hanzi — plan and data format (Phase 1)

## Decisions

| Topic | Decision |
|---|---|
| Word list | New HSK 3.0 syllabus (Nov 2025): level 1 = 294 entries (~300 words counting variants), plus the 7 old HSK 1 words it dropped. HSK 2 (~200 more) later as a second file. |
| Hosting | GitHub Pages from this repo (public), deployed automatically on every push. |
| Sync (Phase 6) | Supabase, login with email + 6-digit code. |
| Quiz answers | Count in ✓/✗ at half weight; only flashcards change level and due date. |
| Tech | Vite + TypeScript + Preact (small, fast UI library), `vite-plugin-pwa` for offline/install, Vitest for tests. |
| Storage on device | IndexedDB (the browser's built-in database), with "persistent storage" requested so the browser doesn't clear it. Saved after every answer. |
| Audio | The device's built-in Mandarin (zh-CN) voice via the browser's speech API — free and works offline. |
| Fonts | Noto Serif SC for hanzi, system sans-serif for UI; fonts are cached for offline use. |

## Code layout

```
data/            hsk1.json (word list, plain JSON, easy to edit)
src/logic/       levels, scheduling, session building, merge — plain functions + tests
src/storage/     IndexedDB, backup export/import, (later) sync
src/screens/     Flashcards, Quiz, Tones, Words, Progress, Settings
src/ui/          shared pieces: tone-coloured pinyin, level label, speaker button
```

## Data format

Key idea: **the answer history is the source of truth.** Levels, counts, streaks and due
dates are never stored — they're recalculated from the history. Merging two devices is
then just "combine both histories, drop duplicates by ID, recalculate". Nothing can be lost.

### 1. Word (in `data/hsk1.json`, read-only)
```json
{
  "id": "h1-0001",
  "hanzi": "谢谢",
  "pinyin": "xiè xie",
  "meaning": "to thank; thanks",
  "topic": "Basics",
  "hsk": 1,
  "example": { "hanzi": "谢谢你！", "pinyin": "Xiè xie nǐ!", "english": "Thank you!" }
}
```
IDs are fixed once assigned and never reused, so fixing a typo in a word keeps its history.

### 2. Custom word (stored on device, synced)
Same fields as above, plus:
```json
{ "id": "c-6f1c2e0a-…", "createdAt": "2026-10-26T19:40:00.000Z",
  "updatedAt": "2026-10-26T19:40:00.000Z", "deleted": false }
```
`deleted: true` instead of really deleting, so a deletion also reaches the other device.
If both devices edit the same custom word, the newest `updatedAt` wins.

### 3. Answer (one record per answer, append-only, synced)
```json
{
  "id": "a-0b8e…",            // random unique ID
  "wordId": "h1-0001",
  "result": "right",          // "right" | "wrong"
  "mode": "flashcard",        // "flashcard" | "quiz-h2e" | "quiz-e2h" | "quiz-h2p"
  "at": "2026-10-26T19:41:12.345Z",
  "device": "d-phone-3f2a…"   // random ID created once per device
}
```

### 4. Tone-trainer answer (separate log, synced; doesn't touch word stats)
```json
{ "id": "t-…", "char": "马", "syllable": "ma", "tone": 3, "picked": 2,
  "at": "2026-10-26T19:45:00.000Z", "device": "d-phone-3f2a…" }
```

### 5. Setting (one record per setting, synced, newest wins)
```json
{ "key": "showPinyinOnFront", "value": true,
  "updatedAt": "2026-10-26T19:30:00.000Z", "device": "d-phone-3f2a…" }
```
Planned keys: `showPinyinOnFront`, `newWordsPerDay` (10), `autoPlayAudio`, `theme`
(`system`/`light`/`dark`), `quizMode`.

### 6. Backup file (Export/Import)
```json
{ "format": "hanzi-backup", "version": 1, "exportedAt": "…", "device": "…",
  "answers": [ … ], "toneAnswers": [ … ], "customWords": [ … ], "settings": [ … ] }
```
Importing **merges** with what's on the device (same rules as sync). It never replaces it.

`version` lets future formats upgrade old backups automatically.

## Calculation rules (from flashcard answers, in time order)

- **New**: no flashcard answers yet.
- **Struggling**: last answer wrong, **or** under 50% right overall.
- **Mastered**: 5+ right in a row **and** at least 80% right overall.
- **Familiar**: 3+ right in a row (but not Mastered).
- **Learning**: 1–2 right in a row.

The rules are checked in that order, so e.g. 6 in a row at 75% overall counts as Familiar.

Next due date (calculated by day, at midnight local time):

| Level after answer | Next due |
|---|---|
| Struggling | again later this session, and tomorrow |
| Learning | +1 day |
| Familiar | streak 3 → +3 days, streak 4+ → +7 days |
| Mastered | streak 5 → +14 days, 6 → +21, 7+ → +30 |

I picked fixed steps instead of random ranges so both devices always calculate the same date.

**Counts shown on cards** (✓ 7 · ✗ 2): flashcard answers count as 1, quiz answers as ½
(shown like "✓ 7½").

**Daily session**: Struggling words that are due → other due words (most overdue first) → up to
`newWordsPerDay` new words (counting new words already started today). Wrong answers go back
into the queue 3–5 cards later.

**Day streak**: consecutive local days with at least one answer, on any device.

**30-day chart**: replays the history up to the end of each day.

## Sync (Phase 6, prepared now)

Supabase tables `answers`, `tone_answers`, `custom_words`, `settings`, each with a `user_id`
column. Row-level security makes every row readable and writable only by its owner. Each
device uploads records it hasn't sent yet and downloads anything new since its last sync.
On first login the device's existing progress is uploaded and merged; an empty account can
never overwrite it. "Delete account" removes all rows and the login.

Free tier: 500 MB database (years of answers fit into a few MB), 50,000 monthly users, and
login emails limited to about 2 per hour with the built-in sender (fine for one person; you stay logged in). Free
projects pause after 7 days without use; restoring one is one click in the dashboard.

## Known limits

- **Voice**: depends on the device. iPhone/Mac and Android normally have a Chinese voice.
  Windows may need the "Chinese (Simplified)" speech pack, which is free in Settings → Time &
  language → Speech.
- **iPhone storage**: Safari can clear website data for sites you haven't opened in weeks.
  The installed home-screen app is much safer. Export a backup now and then until sync exists.
