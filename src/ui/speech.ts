// Mandarin text-to-speech using the device's built-in voices (works offline on most devices).

let voice: SpeechSynthesisVoice | null = null;

// Android voices may use "cmn" (Mandarin) instead of "zh", e.g. "cmn-Hans-CN".
const isMandarin = (v: SpeechSynthesisVoice) =>
  /^(zh|cmn)[-_](Hans|CN)/i.test(v.lang) || /普通话|Mandarin/i.test(v.name);

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const zh = voices.filter(isMandarin);
  // Prefer natural-sounding voices when the device has them.
  const preferred = /Xiaoxiao|Tingting|Yunxi|Natural|Google/i;
  return zh.find((v) => preferred.test(v.name)) ?? zh.find((v) => v.localService) ?? zh[0] ?? null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  voice = pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    voice = pickVoice();
  });
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function hasMandarinVoice(): boolean {
  return voice !== null;
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  if (voice) u.voice = voice;
  u.rate = 0.8;
  synth.speak(u);
}
