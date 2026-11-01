/** Poses do Guará — sheet do cliente + estilos gerados para o app. */

export const GUARA_POSE = {
  /** Lupa — busca vazia / sem resultado */
  busca: "/guara/busca.webp",
  /** Salva-vidas — emergência / maré crítica */
  emergencia: "/guara/emergencia.webp",
  /** Coco e chapéu — clima bom / ensolarado */
  clima: "/guara/clima.webp",
  /** Relógios / dispositivo — soft prompt de avisos */
  avisos: "/guara/avisos.webp",
  /** Surf — card de maré */
  mare: "/guara/mare.webp",
  /** Guarda-chuva — chuva / tempestade */
  chuva: "/guara/chuva.webp",
  /** Lanterna — clima noturno */
  noite: "/guara/noite.webp",
  /** Festa — missão / celebração */
  festa: "/guara/festa.webp",
  /** Chapéu de criança — criança perdida */
  crianca: "/guara/crianca.webp",
  bust: "/guara.png?v=3",
  full: "/guara-inteiro.png?v=1",
} as const;

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
