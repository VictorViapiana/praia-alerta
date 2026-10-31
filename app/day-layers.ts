/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Linha dos quiosques na areia (sul → norte).
 * Mar = leste (+lng); calçadão/cidade = oeste (−lng).
 */
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

/** Empurra a linha para o mar (leste +) ou para o calçadão (oeste −). */
export function shiftLine(points: Array<[number, number]>, eastM: number, northM = 0): Array<[number, number]> {
  return points.map(([lat, lng]) => [
    lat + northM * METERS_LAT,
    lng + eastM * metersLng(lat),
  ]);
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>): Array<[number, number]> {
  return [...seaSide, ...[...landSide].reverse()];
}

/** Sol: só a areia (entre beira-mar e os quiosques) — sem subir na avenida. */
export function sunBand(): Array<[number, number]> {
  const sea = shiftLine(SAND_LINE, 48);
  const land = shiftLine(SAND_LINE, 4);
  return closedBand(sea, land);
}

/**
 * Maré = água molhando a areia (entre o mar e a linha da maré).
 * Nunca passa dos quiosques em direção à cidade.
 *
 * ratio 0 = vazante → água longe, quase só beira
 * ratio 1 = preamar → sobe na areia até perto dos quiosques
 */
export function tideWaterBand(ratio: number): Array<[number, number]> {
  const t = Math.min(1, Math.max(0, ratio));
  // Borda no mar (fixa)
  const ocean = shiftLine(SAND_LINE, 88);
  // Até onde a água sobe na areia (nunca inland dos quiosques: eastM >= 6)
  const reachEast = 62 - t * 52; // 62 m (vazante) → 10 m (preamar)
  const reach = shiftLine(SAND_LINE, Math.max(6, reachEast));
  return closedBand(ocean, reach);
}

/** Faixa de areia molhada logo acima da linha da água (véu suave). */
export function tideWetSandBand(ratio: number): Array<[number, number]> {
  const t = Math.min(1, Math.max(0, ratio));
  const reachEast = Math.max(6, 62 - t * 52);
  const water = shiftLine(SAND_LINE, reachEast);
  // 8–14 m de areia molhada “acima” da água, ainda no lado do mar dos quiosques
  const wet = shiftLine(SAND_LINE, Math.max(4, reachEast - (8 + t * 6)));
  return closedBand(water, wet);
}

/** Linha da espuma / limite da água na areia. */
export function tideEdgeLine(ratio: number): Array<[number, number]> {
  const t = Math.min(1, Math.max(0, ratio));
  const reachEast = Math.max(6, 62 - t * 52);
  return shiftLine(SAND_LINE, reachEast);
}

export function tideRatio(level: number, rangeMin: number, rangeMax: number) {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return 0.45;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return 0.45;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}

export function tideReachLabel(ratio: number) {
  if (ratio < 0.28) return "vazante · água longe na beira";
  if (ratio < 0.55) return "maré média · molhando a areia";
  if (ratio < 0.78) return "enchente · subindo na areia";
  return "preamar · água perto dos quiosques";
}
