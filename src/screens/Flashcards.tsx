import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { buildQueue, gradeCurrent, isDone, startSession, type Session, type SessionFilter } from '../logic/session';
import { countByLevel, statsOf } from '../logic/stats';
import { useApp } from '../state';
import { LEVELS, type Result } from '../types';
import { Counts, LEVEL_NAMES, LevelBadge, Pinyin, SpeakerButton, Switch } from '../ui/parts';
import { speak } from '../ui/speech';

export function Flashcards() {
  const { words, wordById, stats, settings, record, setSetting } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [flipped, setFlipped] = useState(false);
  const counts = useMemo(() => countByLevel(words.map((w) => w.id), stats), [words, stats]);

  const start = (filter: SessionFilter) => {
    setSession(startSession(buildQueue(words, stats, filter), filter));
    setFlipped(false);
  };

  // Start a mixed session as soon as the app opens.
  useEffect(() => {
    if (!session) start('all');
  }, []);

  const currentId = session?.queue[0];
  const word = currentId ? wordById.get(currentId) : undefined;
  const wordStats = currentId ? statsOf(stats, currentId) : undefined;

  const flip = () => {
    if (!word) return;
    if (!flipped && settings.autoPlayAudio) speak(word.hanzi);
    setFlipped(!flipped);
  };

  const grade = (result: Result) => {
    if (!session || !word || !flipped) return;
    record(word.id, result, 'flashcard');
    setSession(gradeCurrent(session, result));
    setFlipped(false);
  };

  // Keyboard: Space = flip, 1 = Again, 2 = Got it. Kept in a ref so the listener is added once.
  const keys = useRef({ flip, grade });
  keys.current = { flip, grade };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        keys.current.flip();
      } else if (e.key === '1') keys.current.grade('wrong');
      else if (e.key === '2') keys.current.grade('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const done = session ? isDone(session) : false;
  const remaining = session ? new Set(session.queue).size : 0;

  return (
    <div class="flashcards">
      <nav class="levels" aria-label="Words per level — tap to study one level">
        <button class={`level-chip mix ${session?.filter === 'all' ? 'active' : ''}`} onClick={() => start('all')}>
          <span class="n">{Math.min(words.length, 20)}</span>
          <span class="name">Mix</span>
        </button>
        {LEVELS.map((lv) => (
          <button
            key={lv}
            class={`level-chip lv-${lv} ${session?.filter === lv ? 'active' : ''}`}
            disabled={counts[lv] === 0}
            onClick={() => start(lv)}
          >
            <span class="n">{counts[lv]}</span>
            <span class="name">{LEVEL_NAMES[lv]}</span>
          </button>
        ))}
      </nav>

      <div class="toolbar">
        <Switch
          checked={settings.showPinyinOnFront}
          onChange={(v) => setSetting('showPinyinOnFront', v)}
          label="Pinyin on front"
        />
        {session && !done && (
          <span class="progress-text">
            {session.total - remaining + 1} / {session.total}
          </span>
        )}
      </div>

      {session && session.total > 0 && (
        <div class="progress" aria-hidden="true">
          <div style={{ width: `${(100 * (session.total - remaining)) / session.total}%` }} />
        </div>
      )}

      {word && wordStats && !done && (
        <>
          <div
            class={`card ${flipped ? 'flipped' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Card back' : 'Card front — tap to flip'}
            onClick={flip}
          >
            <div class="card-top">
              <LevelBadge level={wordStats.level} />
              <Counts stats={wordStats} />
            </div>
            <div class="card-main">
              <div class="hanzi" lang="zh-CN">{word.hanzi}</div>
              {(settings.showPinyinOnFront || flipped) && <Pinyin text={word.pinyin} class="big" />}
              {flipped && (
                <div class="back">
                  <div class="meaning">{word.meaning}</div>
                  <div class="example">
                    <div class="ex-hanzi" lang="zh-CN">
                      {word.example.hanzi}
                      <SpeakerButton text={word.example.hanzi} label="Play example" />
                    </div>
                    <Pinyin text={word.example.pinyin} />
                    <div class="ex-en">{word.example.english}</div>
                  </div>
                </div>
              )}
            </div>
            <div class="card-bottom">
              <SpeakerButton text={word.hanzi} label="Play word" />
              {!flipped && <span class="hint">Tap to flip</span>}
              <span class="topic">{word.topic}</span>
            </div>
          </div>

          <div class="actions">
            {flipped ? (
              <>
                <button class="btn again" onClick={() => grade('wrong')}>
                  Again <kbd>1</kbd>
                </button>
                <button class="btn gotit" onClick={() => grade('right')}>
                  Got it <kbd>2</kbd>
                </button>
              </>
            ) : (
              <button class="btn show" onClick={flip}>
                Show answer <kbd>Space</kbd>
              </button>
            )}
          </div>
        </>
      )}

      {session && done && (
        <div class="card summary">
          {session.total === 0 ? (
            <p>No words here yet.</p>
          ) : (
            <>
              <h2>Session done</h2>
              <p class="summary-line">
                {session.total} words · <span class="right">✓ {session.right}</span> · <span class="wrong">✗ {session.wrong}</span>
              </p>
              <p class="muted">Every answer is saved on this device.</p>
            </>
          )}
          <button class="btn gotit" onClick={() => start('all')}>
            Study 20 more
          </button>
        </div>
      )}
    </div>
  );
}
