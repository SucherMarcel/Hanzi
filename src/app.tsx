import { Flashcards } from './screens/Flashcards';
import { useApp } from './state';

export function App() {
  const { ready, error } = useApp();
  return (
    <div class="app">
      <header class="app-header">
        <span class="logo" lang="zh-CN">汉</span>
        <span class="title">Hanzi</span>
        <span class="status">Saved on this device</span>
      </header>
      {error && <div class="banner error">{error}</div>}
      <main>{ready ? <Flashcards /> : <div class="loading">Loading…</div>}</main>
    </div>
  );
}
