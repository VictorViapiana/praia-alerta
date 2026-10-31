/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Limite seco (beira do calçadão), além da ponta sul → além da Pescaria.
 * Extremos passam da areia para a tampa do polígono ficar fora da praia.
 * Mar = leste (+lng).
 */
const DRY_LIMIT: Array<[number, number]> = [
  // bem além da ponta sul (tampa fora da areia / quadra)
  [-20.6672, -40.5021],
  [-20.6666, -40.5016],
  [-20.666, -40.5011],
  [-20.6654, -40.5006],
  [-20.6648, -40.5001],
  [-20.6642, -40.4996],
  [-20.6636, -40.4991],
  [-20.663, -40.4986],
  [-20.6624, -40.4981],
  [-20.6618, -40.49755],
  [-20.6612, -40.497],
  [-20.6606, -40.4964],
  [-20.66, -40.49575],
  [-20.6594, -40.4951],
  [-20.6588, -40.4944],
  [-20.6582, -40.49365],
  [-20.6576, -40.49285],
  [-20.65705, -40.492],
  [-20.6565, -40.4912],
  [-20.656, -40.4904],
  [-20.65555, -40.48965],
  [-20.6551, -40.4889],
  [-20.6547, -40.48815],
  [-20.6543, -40.4874],
  [-20.65395, -40.4866],
  [-20.6536, -40.48575],
  [-20.6533, -40.4849],
  [-20.65305, -40.484],
  [-20.65285, -40.4831],
  [-20.6527, -40.4822],
  [-20.65258, -40.4813],
  [-20.6525, -40.4804],
  [-20.65248, -40.4795],
  [-20.6525, -40.47865],
  [-20.6526, -40.47785],
  [-20.65278, -40.4771],
  [-20.65305, -40.4764],
  [-20.6534, -40.4758],
  [-20.6538, -40.4753],
  [-20.65425, -40.4749],
  [-20.65475, -40.47455],
  [-20.6553, -40.4743],
  [-20.6559, -40.47415],
  [-20.6565, -40.4741],
  [-20.6571, -40.47415],
  [-20.65765, -40.4743],
  [-20.65815, -40.47455],
  [-20.6586, -40.4749],
  // bem além da Pescaria
  [-20.65905, -40.4753],
  [-20.6595, -40.47575],
  [-20.6599, -40.47625],
];

const METERS_LAT = 1 / 111_320;
/** Longe o bastante para a borda do mar sair da tela ao ver a areia. */
const OCEAN_M = 420;
const SURF_M = 100;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/**
 * Empurra para o mar (leste). No crescente norte (Morro) soma um pouco de sul,
 * com teto baixo para não subir na avenida.
 */
export function shiftSeaward(points: Array<[number, number]>, meters: number): Array<[number, number]> {
  return points.map(([lat, lng]) => {
    const northBend = lng > -40.4785 ? Math.min(0.55, (lng + 40.4785) / 0.008) : 0;
    const eastPart = meters * (1 - northBend * 0.22);
    const southPart = meters * northBend * 0.4;
    return [
      lat - southPart * METERS_LAT,
      lng + eastPart * metersLng(lat),
    ] as [number, number];
  });
}

/**
 * Fecha a faixa afinando nas pontas (lado do mar encontra o reach).
 * Assim a tampa tem comprimento ~0 — some o corte diagonal na areia.
 * Os primeiros ~8 pts ficam além da areia útil (extensão sul/norte).
 */
function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>): Array<[number, number]> {
  const n = seaSide.length;
  const blend = 8;
  const sea = seaSide.map((p, i) => {
    const tip = Math.min(i, n - 1 - i);
    if (tip >= blend) return p;
    const t = tip / blend; // 0 na ponta → 1
    const land = landSide[i];
    return [p[0] * t + land[0] * (1 - t), p[1] * t + land[1] * (1 - t)] as [number, number];
  });
  return [...sea, ...[...landSide].reverse()];
}

/**
 * Metros do calçadão até a linha da água na areia.
 * 0 = vazante (rebentação); 1 = preamar (sobe na areia, sem avenida).
 */
function reachFromDry(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return SURF_M - t * (SURF_M - 20);
}

export function sunBand(): Array<[number, number]> {
  return closedBand(shiftSeaward(DRY_LIMIT, 75), shiftSeaward(DRY_LIMIT, 3));
}

/** Faixa escura no mar — ancora visual “vem da água”. */
export function tideOceanBand(_ratio?: number): Array<[number, number]> {
  return closedBand(shiftSeaward(DRY_LIMIT, OCEAN_M), shiftSeaward(DRY_LIMIT, SURF_M));
}

/** Água: do mar até a linha da maré — praia inteira. */
export function tideWaterBand(ratio: number): Array<[number, number]> {
  return closedBand(shiftSeaward(DRY_LIMIT, OCEAN_M), shiftSeaward(DRY_LIMIT, reachFromDry(ratio)));
}

/** Areia molhada logo acima da linha da água. */
export function tideWetSandBand(ratio: number): Array<[number, number]> {
  const reachM = reachFromDry(ratio);
  return closedBand(shiftSeaward(DRY_LIMIT, reachM), shiftSeaward(DRY_LIMIT, Math.max(12, reachM - 14)));
}

export function tideEdgeLine(ratio: number): Array<[number, number]> {
  return shiftSeaward(DRY_LIMIT, reachFromDry(ratio));
}

/** Rebentação — origem visual da maré (sempre na água). */
export function tideSurfLine(): Array<[number, number]> {
  return shiftSeaward(DRY_LIMIT, SURF_M);
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
  return "preamar · água perto do calçadão";
}
