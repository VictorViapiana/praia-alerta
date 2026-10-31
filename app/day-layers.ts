/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Linha dos quiosques na areia (sul → norte).
 * Mar = leste (+lng). Cidade/avenida = oeste (−lng).
 * Nunca deslocar para oeste dos quiosques.
 */
const SAND_LINE: Array<[number, number]> = [
  [-20.6608, -40.4963],
  [-20.6600, -40.4953],
  [-20.6593, -40.4944],
  [-20.6585, -40.4933],
  [-20.6575, -40.4920],
  [-20.6568, -40.4911],
  [-20.6562, -40.4901],
  [-20.6553, -40.4890],
  [-20.6548, -40.4880],
  [-20.6544, -40.4871],
  [-20.6539, -40.4861],
  [-20.6535, -40.4851],
  [-20.6531, -40.4841],
  [-20.6527, -40.4830],
  [-20.6524, -40.4818],
  [-20.65235, -40.4805],
  [-20.6524, -40.4791],
  [-20.65255, -40.4777],
  [-20.65285, -40.4765],
  [-20.6532, -40.4757],
  [-20.6536, -40.4752],
];

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Só eixo leste: + = mar, − = cidade (evitar). */
export function shiftLine(points: Array<[number, number]>, eastM: number): Array<[number, number]> {
  return points.map(([lat, lng]) => [lat, lng + eastM * metersLng(lat)] as [number, number]);
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>): Array<[number, number]> {
  return [...seaSide, ...[...landSide].reverse()];
}

/**
 * Distância a leste dos quiosques até a linha da água na areia.
 * Sempre >= 8 m (nunca avenida).
 * 0 = vazante (perto da rebentação); 1 = preamar (perto dos quiosques).
 */
function reachEast(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  // 55 m (água/beira) → 10 m (areia alta)
  return Math.max(8, 55 - t * 45);
}

export function sunBand(): Array<[number, number]> {
  return closedBand(shiftLine(SAND_LINE, 48), shiftLine(SAND_LINE, 3));
}

/** Faixa no mar (além da rebentação). */
export function tideOceanBand(_ratio?: number): Array<[number, number]> {
  return closedBand(shiftLine(SAND_LINE, 115), shiftLine(SAND_LINE, 55));
}

/** Do mar até a linha da maré — só areia/água. */
export function tideWaterBand(ratio: number): Array<[number, number]> {
  return closedBand(shiftLine(SAND_LINE, 115), shiftLine(SAND_LINE, reachEast(ratio)));
}

export function tideWetSandBand(ratio: number): Array<[number, number]> {
  const reach = reachEast(ratio);
  return closedBand(shiftLine(SAND_LINE, reach), shiftLine(SAND_LINE, Math.max(5, reach - 10)));
}

export function tideEdgeLine(ratio: number): Array<[number, number]> {
  return shiftLine(SAND_LINE, reachEast(ratio));
}

export function tideSurfLine(): Array<[number, number]> {
  return shiftLine(SAND_LINE, 55);
}

export function tideRatio(level: number, rangeMin: number, rangeMax: number) {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return 0.45;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return 0.45;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}

export function tideReachLabel(ratio: number) {
  if (ratio < 0.28) return "vazante · água na beira";
  if (ratio < 0.55) return "maré média · molhando a areia";
  if (ratio < 0.78) return "enchente · subindo na areia";
  return "preamar · água perto dos quiosques";
}
