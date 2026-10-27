let player: HTMLAudioElement | null = null;
let audioBlocked = false;
let queue: string[] = [];
let endListener: (() => void) | null = null;

function cleanSpeech(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunks(text: string) {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > 180) {
    const slice = rest.slice(0, 180);
    const cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(", "), slice.lastIndexOf(" "));
    const at = cut > 40 ? cut + 1 : 180;
    parts.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const portuguese = voices.filter((voice) => voice.lang.toLowerCase().startsWith("pt"));
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let value = voice.lang.toLowerCase() === "pt-br" ? 6 : 1;
    if (/natural|neural|premium|online/.test(name)) value += 40;
    if (/google/.test(name)) value += 24;
    if (/francisca|maria|luciana|helo[ií]sa|fernanda|vit[oó]ria/.test(name)) value += 12;
    if (/desktop/.test(name)) value -= 8;
    return value;
  };
  return [...portuguese].sort((a, b) => score(b) - score(a))[0];
}

function finish() {
  const done = endListener;
  endListener = null;
  queue = [];
  done?.();
}

function speakSynth(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) {
    finish();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  const voice = pickVoice(synth.getVoices());
  if (voice) utterance.voice = voice;
  const natural = voice ? /natural|neural|google|premium/i.test(voice.name) : false;
  utterance.rate = natural ? 1 : 0.94;
  utterance.pitch = natural ? 1 : 1.04;
  utterance.onend = finish;
  utterance.onerror = finish;
  const start = () => {
    try {
      synth.resume();
      synth.speak(utterance);
    } catch {
      finish();
    }
  };
  if (synth.speaking || synth.pending) {
    synth.cancel();
    window.setTimeout(start, 60);
  } else {
    start();
  }
}

function playQueue() {
  const next = queue.shift();
  if (!next) {
    finish();
    return;
  }
  if (audioBlocked) {
    speakSynth([next, ...queue].join(" "));
    queue = [];
    return;
  }
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=pt-BR&q=${encodeURIComponent(next)}`;
  const audio = new Audio(url);
  player = audio;
  audio.onended = () => {
    player = null;
    playQueue();
  };
  audio.onerror = () => {
    player = null;
    audioBlocked = true;
    speakSynth([next, ...queue].join(" "));
    queue = [];
  };
  void audio.play().catch(() => {
    player = null;
    audioBlocked = true;
    speakSynth([next, ...queue].join(" "));
    queue = [];
  });
}

export function stopSpeaking() {
  player?.pause();
  player = null;
  queue = [];
  endListener = null;
  window.speechSynthesis?.cancel();
}

export function speakGuara(text: string, onEnd?: () => void) {
  const clean = cleanSpeech(text);
  stopSpeaking();
  if (!clean) {
    onEnd?.();
    return;
  }
  endListener = onEnd ?? null;
  queue = chunks(clean);
  window.speechSynthesis?.getVoices();
  playQueue();
}
