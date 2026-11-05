import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let speakToken = 0;
let preferredVoice: string | undefined;
let voicesReady: Promise<void> | null = null;
let audioArmed = false;

function cleanSpeech(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadVoices() {
  if (!voicesReady) {
    voicesReady = Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const pt = voices.filter((v) => v.language?.toLowerCase().startsWith("pt"));
        const score = (v: Speech.Voice) => {
          const name = (v.name || "").toLowerCase();
          const lang = (v.language || "").toLowerCase();
          let value = lang === "pt-br" ? 6 : lang.startsWith("pt") ? 1 : 0;
          if (/natural|neural|premium|enhanced|siri/.test(name)) value += 40;
          if (/luciana|maria|fernanda|francisca|joana|helena/.test(name)) value += 12;
          return value;
        };
        preferredVoice = [...pt].sort((a, b) => score(b) - score(a))[0]?.identifier;
      })
      .catch(() => {
        preferredVoice = undefined;
      });
  }
  return voicesReady;
}

/** iOS: sem isso o AVSpeech fica mudo com o botão silencioso ligado. */
async function armAudioSession() {
  if (audioArmed) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioArmed = true;
  } catch {
    /* ignore — tenta falar mesmo assim */
  }
}

void loadVoices();
void armAudioSession();

export function stopSpeaking() {
  speakToken += 1;
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
}

/**
 * Voz do Guará — expo-speech + sessão de áudio iOS.
 * Evita: stop()+speak no mesmo tick; silêncio com Ring/Silent.
 */
export function speakGuara(text: string, onDone?: () => void) {
  const clean = cleanSpeech(text);
  stopSpeaking();
  if (!clean) {
    onDone?.();
    return;
  }
  const token = speakToken;

  void (async () => {
    await armAudioSession();
    await loadVoices();
    await new Promise((r) => setTimeout(r, 120));
    if (token !== speakToken) {
      onDone?.();
      return;
    }
    try {
      Speech.speak(clean, {
        language: "pt-BR",
        voice: preferredVoice,
        rate: 0.94,
        pitch: 1.04,
        onDone: () => {
          if (token === speakToken) onDone?.();
        },
        onStopped: () => {
          if (token === speakToken) onDone?.();
        },
        onError: () => {
          if (token !== speakToken) {
            onDone?.();
            return;
          }
          try {
            Speech.speak(clean, {
              language: "pt-BR",
              rate: 0.94,
              onDone,
              onStopped: onDone,
              onError: onDone,
            });
          } catch {
            onDone?.();
          }
        },
      });
    } catch {
      onDone?.();
    }
  })();
}
