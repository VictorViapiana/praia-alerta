/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Orla principal (faces leste): quiosques na areia, sul → início do crescente.
 * Mar = leste (+lng). Cidade/avenida = oeste. Sem pontos inland.
 */
const ORLA_LINE: Array<[number, number]> = [
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
];

/**
 * Crescente norte (faces sul): mar = sul (−lat); avenida = norte.
 * Separado da orla para não misturar eixos (cunha na cidade).
 */
const CRESCENT_LINE: Array<[number, number]> = [
  [-20.6524, -40.4818],
  [-20.65235, -40.4805],
  [-20.6524, -40.4791],
  [-20.65255, -40.4777],
  [-20.65285, -40.4765],
  [-20.6532, -40.4757],
  [-20.6536, -40.4752],
];

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Só leste. Nunca oeste (= avenida). */
function shiftEast(points: Array<[number, number]>, meters: number): Array<[number, number]> {
  return points.map(([lat, lng]) => [lat, lng + meters * metersLng(lat)] as [number, number]);
}

/** Só sul. Nunca norte (= avenida no crescente). */
function shiftSouth(points: Array<[number, number]>, meters: number): Array<[number, number]> {
  return points.map(([lat, lng]) => [lat - meters * METERS_LAT, lng] as [number, number]);
}

/**
 * Fecha a faixa. Taper curto nas pontas (pontos já na areia) —
 * afina o tampão sem estender inland (que criaria cunha na cidade).
 */
function closedBand(
  seaSide: Array<[number, number]>,
  landSide: Array<[number, number]>,
  blend = 2,
): Array<[number, number]> {
  const n = seaSide.length;
  const sea = seaSide.map((p, i) => {
    const tip = Math.min(i, n - 1 - i);
    if (tip >= blend) return p;
    const t = tip / blend;
    const land = landSide[i];
    return [p[0] * t + land[0] * (1 - t), p[1] * t + land[1] * (1 - t)] as [number, number];
  });
  return [...sea, ...[...landSide].reverse()];
}

/**
 * Metros a partir dos quiosques até a linha da maré na areia.
 * Sempre >= 14 → margem antes da avenida/calçadão.
 */
function shoreFromKiosk(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  // 58 m (vazante) → 14 m (preamar, ainda na areia)
  return 58 - t * 44;
}

export function sunBand(): Array<[number, number]> {
  return closedBand(shiftEast(ORLA_LINE, 50), shiftEast(ORLA_LINE, 4));
}

/**
 * Polígonos da maré: oceano → areia.
 * Orla (leste) + crescente (sul) — eixos separados, sem cunha.
 */
export function tideLayers(ratio: number) {
  const shoreM = shoreFromKiosk(ratio);
  const softM = shoreM + 10;
  const midM = shoreM + 140;
  const deepM = shoreM + 260;

  const main = {
    deep: closedBand(shiftEast(ORLA_LINE, deepM), shiftEast(ORLA_LINE, midM)),
    body: closedBand(shiftEast(ORLA_LINE, midM), shiftEast(ORLA_LINE, softM)),
    soft: closedBand(shiftEast(ORLA_LINE, softM), shiftEast(ORLA_LINE, shoreM)),
  };

  const crescent = {
    deep: closedBand(shiftSouth(CRESCENT_LINE, deepM), shiftSouth(CRESCENT_LINE, midM)),
    body: closedBand(shiftSouth(CRESCENT_LINE, midM), shiftSouth(CRESCENT_LINE, softM)),
    soft: closedBand(shiftSouth(CRESCENT_LINE, softM), shiftSouth(CRESCENT_LINE, shoreM)),
  };

  return { main, crescent };
}

/** @deprecated use tideLayers — mantido para imports legados */
export function tideOceanBand(ratio: number) {
  return tideLayers(ratio).main.deep;
}
export function tideWaterBand(ratio: number) {
  return tideLayers(ratio).main.body;
}
export function tideWetSandBand(ratio: number) {
  return tideLayers(ratio).main.soft;
}
export function tideEdgeLine(ratio: number) {
  return shiftEast(ORLA_LINE, shoreFromKiosk(ratio));
}
export function tideSurfLine(ratio: number = 0.45) {
  return shiftEast(ORLA_LINE, shoreFromKiosk(ratio) + 140);
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
  return "preamar · água na areia alta";
}
