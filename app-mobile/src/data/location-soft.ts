import { storageGet, storageRemove, storageSet } from "../utils/storage";

export const LOCATION_SOFT_KEY = "pa_location_soft_prompt_v1";
export const LOCATION_PROMPT_SHOWN_KEY = "locationPromptShown";

export type LocationSoftChoice = "unset" | "accepted" | "declined";

async function readKey(key: string): Promise<LocationSoftChoice> {
  const raw = await storageGet(key);
  if (raw === "accepted" || raw === "declined") return raw;
  if (raw === "1" || raw === "true") return "accepted";
  if (raw === "0" || raw === "false") return "declined";
  return "unset";
}

export async function readLocationSoftChoice(): Promise<LocationSoftChoice> {
  const primary = await readKey(LOCATION_SOFT_KEY);
  if (primary !== "unset") return primary;
  return readKey(LOCATION_PROMPT_SHOWN_KEY);
}

export async function writeLocationSoftChoice(choice: Exclude<LocationSoftChoice, "unset">) {
  await storageSet(LOCATION_SOFT_KEY, choice);
  await storageSet(LOCATION_PROMPT_SHOWN_KEY, choice);
}

export async function reopenLocationSoftPrompt() {
  const cur = await readLocationSoftChoice();
  if (cur === "accepted") return;
  await storageRemove(LOCATION_SOFT_KEY);
  await storageRemove(LOCATION_PROMPT_SHOWN_KEY);
}

export async function locationSoftAccepted() {
  return (await readLocationSoftChoice()) === "accepted";
}
