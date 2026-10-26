# Hanzi

A personal Mandarin vocabulary app: flashcards with memory levels, spaced repetition, and
progress saved on your device (sync between phone and PC comes in Phase 6). It is an
installable web app (PWA) that works offline.

Live app (after setup below): **https://suchermarcel.github.io/Hanzi/**

## Status

| Phase | What | Status |
|---|---|---|
| 1 | Plan and data format ([docs/PLAN.md](docs/PLAN.md)) | done |
| 2 | Flashcards, memory levels, saving on the device | done |
| 3 | Spaced repetition and daily session | next |
| 4 | Quiz, tone trainer, word list | |
| 5 | Progress screen, settings, backup export/import | |
| 6 | Phone and PC sync | |

## Putting the app online (one-time)

1. On GitHub, open the repo → **Settings** → **Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
2. Merge the work branch into `main` (via a pull request). Every push to `main` then tests
   the app and publishes it automatically. Watch it under the **Actions** tab; after a
   minute or two the app is live at the address above.

## Installing it

- **iPhone (Safari):** open the address → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the address → menu ⋮ → **Install app** (or *Add to Home screen*).
- **PC (Chrome or Edge):** open the address → click the install icon at the right end of the
  address bar (or menu → *Install Hanzi*).

Open it once while online; after that it works offline. Updates install themselves the next
time you open the app online.

**Audio** uses your device's Mandarin voice. If you hear nothing on Windows, add the free
voice: Settings → Time & language → Language & region → Add a language → *Chinese
(Simplified, China)* with *Text-to-speech* ticked.

## Adding or fixing words

Words live in [`data/hsk1.json`](data/hsk1.json), one word per line:

```json
{"id": "h1-0001", "hanzi": "我", "pinyin": "wǒ", "meaning": "I; me", "topic": "Basics", "hsk": 1, "example": {"hanzi": "我是学生。", "pinyin": "Wǒ shì xué sheng.", "english": "I am a student."}}
```

- Pinyin has a space between syllables, with tone marks; no mark = neutral tone.
- Never change or reuse an `id`: your history is linked to it. New words get new IDs.
- The automatic tests check the file (one syllable per character, no duplicate IDs).

The list is the **HSK 3.0 level 1** syllabus (November 2025): 294 entries (variants like
爸爸/爸 are one entry), plus 7 words from the old HSK 1 list that the new list dropped
(北京, 饭馆, 后面, 火车站, 没, 前面, 小姐), so nothing from the old list is lost. Every
syllable was checked against the CC-CEDICT dictionary. 一 and 不 are written with their
spoken tone changes (yí ge, bú shì), as on the official HSK site.

## For developers

```sh
npm install
npm run dev      # local dev server
npm test         # level, scheduling and data tests
npm run build    # production build in dist/
```

Code layout: `data/` word lists · `src/logic/` levels, scheduling, sessions (plain functions,
tested in `tests/`) · `src/storage/` IndexedDB · `src/screens/` and `src/ui/` the interface.
