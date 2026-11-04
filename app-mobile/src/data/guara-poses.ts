import type { ImageSourcePropType } from "react-native";

/** Poses do Guará — assets locais do app nativo. */
export const GUARA_POSE = {
  busca: require("../assets/guara/poses/busca.webp"),
  emergencia: require("../assets/guara/poses/emergencia.webp"),
  clima: require("../assets/guara/poses/clima.webp"),
  avisos: require("../assets/guara/poses/avisos.webp"),
  mare: require("../assets/guara/poses/mare.webp"),
  chuva: require("../assets/guara/poses/chuva.webp"),
  noite: require("../assets/guara/poses/noite.webp"),
  festa: require("../assets/guara/poses/festa.webp"),
  crianca: require("../assets/guara/poses/crianca.webp"),
  bust: require("../assets/guara/guara.png"),
  full: require("../assets/guara/guara-inteiro.png"),
} as const satisfies Record<string, ImageSourcePropType>;

export type GuaraPoseId = keyof typeof GUARA_POSE;

/** Escolhe a pose do card de Clima pelo código Open-Meteo + noite. */
export function weatherGuaraPose(code: number, night = false): Exclude<GuaraPoseId, "bust" | "full"> {
  if (night) return "noite";
  if (code >= 51 || code === 45 || code === 48) return "chuva";
  if (code <= 3) return "clima";
  return "clima";
}

/** Maré: salva-vidas se onda alta; senão surf. */
export function mareGuaraPose(waveM: number): Exclude<GuaraPoseId, "bust" | "full"> {
  if (waveM >= 1.3) return "emergencia";
  return "mare";
}
