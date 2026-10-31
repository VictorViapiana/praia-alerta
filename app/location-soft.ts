/** Soft prompt de localização / orientação — espelha o fluxo de notificações. */

export const LOCATION_SOFT_KEY = "pa_location_soft_prompt_v1";
/** Alias pedido pelo produto (mesmo valor). */
export const LOCATION_PROMPT_SHOWN_KEY = "locationPromptShown";

export type LocationSoftChoice = "unset" | "accepted" | "declined";

function readKey(key: string): LocationSoftChoice {
  if (typeof window === "undefined") return "unset";
  try {
    const raw = localStorage.getItem(key);
    if (raw === "accepted" || raw === "declined") return raw;
    if (raw === "1" || raw === "true") return "accepted";
    if (raw === "0" || raw === "false") return "declined";
  } catch {
    /* private mode */
  }
  return "unset";
}

export function readLocationSoftChoice(): LocationSoftChoice {
  const primary = readKey(LOCATION_SOFT_KEY);
  if (primary !== "unset") return primary;
  return readKey(LOCATION_PROMPT_SHOWN_KEY);
}

export const LOCATION_SOFT_EVENT = "pa:location-soft";

export function writeLocationSoftChoice(choice: Exclude<LocationSoftChoice, "unset">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCATION_SOFT_KEY, choice);
    localStorage.setItem(LOCATION_PROMPT_SHOWN_KEY, choice);
  } catch {
    /* private mode */
  }
  try {
    window.dispatchEvent(new CustomEvent(LOCATION_SOFT_EVENT, { detail: choice }));
  } catch {
    /* ignore */
  }
}

/** Limpa só o "declined" para o modal poder reaparecer (ex.: toque em Minha localização). */
export function reopenLocationSoftPrompt() {
  if (typeof window === "undefined") return;
  try {
    const cur = readLocationSoftChoice();
    if (cur === "accepted") return;
    localStorage.removeItem(LOCATION_SOFT_KEY);
    localStorage.removeItem(LOCATION_PROMPT_SHOWN_KEY);
  } catch {
    /* private mode */
  }
}

export function locationSoftAccepted() {
  return readLocationSoftChoice() === "accepted";
}
