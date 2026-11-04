import * as Speech from "expo-speech";

export function speakGuara(text: string, onDone?: () => void) {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: "pt-BR",
      rate: 0.94,
      onDone,
      onStopped: onDone,
      onError: onDone,
    });
  } catch {
    onDone?.();
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
}
