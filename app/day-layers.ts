/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/** Linha dos quiosques na areia (sul → norte) — base da faixa da orla. */
const SAND_LINE: Array<[number, number]> = [
  [-20.6598, -40.495],
  [-20.6587, -40.4938],
  [-20.6575, -40.4923],
  [-20.6562, -40.4907],
  [-20.6552, -40.4892],
  [-20.6544, -40.4876],
  [-20.6536, -40.4857],
  [-20.653, -40.4842],
  [-20.6526, -40.4826],
  [-20.6524, -40.4804],
  [-20.65245, -40.4785],
  [-20.6527, -40.4768],
  [-20.6531, -40.4756],
];

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Empurra a linha para o mar (leste) ou para o calçadão (oeste). */
function shiftLine(points: Array<[number, number]>, eastM: number, northM = 0): Array<[number, number]> {
  return points.map(([lat, lng]) => [
    lat + northM * METERS_LAT,
    lng + eastM * metersLng(lat),
  ]);
}

function band(seaM: number, landM: number): Array<[number, number]> {
  const sea = shiftLine(SAND_LINE, seaM);
  const land = shiftLine(SAND_LINE, -landM).reverse();
  return [...sea, ...land];
}

/** Faixa quente na areia (sol) — cobre areia + beira do calçadão, sem engolir a avenida. */
export function sunBand(): Array<[number, number]> {
  return band(55, 70);
}

/**
 * Faixa da maré: cresce em direção ao calçadão conforme o nível.
 * ratio 0 = vazante (só beira); 1 = preamar (sobe na areia).
 */
export function tideBand(ratio: number): Array<[number, number]> {
  const t = Math.min(1, Math.max(0, ratio));
  const seaM = 18 + t * 14;
  const landM = 28 + t * 55;
  return band(seaM, landM);
}

export function tideRatio(level: number, rangeMin: number, rangeMax: number) {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return 0.45;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return 0.45;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}
