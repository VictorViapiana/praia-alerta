/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/** Janela do Sol na areia: ativo só entre 05:30 e 17:30 (America/Sao_Paulo). */
export const SUN_ON_HOUR = 5.5;
export const SUN_OFF_HOUR = 17.5;

/**
 * Parede seca (quiosques / calçadão) — limite máximo inland.
 * Pontas já afastadas de Muquiçaba (oeste) e do Morro da Pescaria (leste).
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.65985, -40.49435], // oeste: areia, longe de Muquiçaba
  [-20.6592, -40.4938],
  [-20.6585, -40.49305],
  [-20.6577, -40.4921],
  [-20.65695, -40.49115],
  [-20.65635, -40.49035],
  [-20.65575, -40.4895],
  [-20.65495, -40.4886],
  [-20.6545, -40.4877],
  [-20.6541, -40.48685],
  [-20.6537, -40.48585],
  [-20.6533, -40.48485],
  [-20.6529, -40.48385],
  [-20.6526, -40.48285],
  [-20.65238, -40.48165],
  [-20.65232, -40.48045],
  [-20.65238, -40.4792],
  [-20.65255, -40.47795],
  [-20.65285, -40.47675],
  [-20.6532, -40.47555],
  [-20.65355, -40.47455], // leste: areia antes do costão / bancos norte
];

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 48;
const HIGH_TIDE_M = 14;
const FEATHER_M = 11;

const SAND_LAND_M = 3;
const SAND_SEA_M = 34;

/**
 * Costa OESTE (Muquiçaba) — água fica a LESTE desta linha.
 * Strictamente dentro da baía: contorno da terra, zero telhado/rua.
 * Quadra de areia ~-40.4944 — waterline fica a leste disso.
 */
const MUQUICABA_WATERLINE: Array<[number, number]> = [
  [-20.6595, -40.49395],
  [-20.6606, -40.4938],
  [-20.6618, -40.49355],
  [-20.6630, -40.4932],
  [-20.6642, -40.49275],
  [-20.6654, -40.4922],
  [-20.6664, -40.49155],
  [-20.6672, -40.49085],
  [-20.6679, -40.49005],
  [-20.66845, -40.48915],
];

/**
 * Costa LESTE (Morro da Pescaria) — água fica a OESTE desta linha.
 * Fecha o buraco: encosta na areia/costa que antecede o morro.
 * BANCOS_NORTE ~-40.4736 · píer ~-40.4743 · golfinho ~-40.47415.
 * Sem subir no verde do parque (~-40.4718).
 */
const PESCARIA_WATERLINE: Array<[number, number]> = [
  [-20.65355, -40.47455],
  [-20.6540, -40.47395],
  [-20.65445, -40.47358], // areia dos bancos norte — fecha o NE
  [-20.6548, -40.47362],
  [-20.65515, -40.4739], // curva para a costa do costão
  [-20.65555, -40.4742],
  [-20.65601, -40.47435], // água na base do píer (sem cobrir o monumento)
  [-20.6562, -40.47442], // oeste do golfinho
  [-20.65685, -40.47455],
  [-20.65765, -40.47485],
  [-20.6585, -40.4753],
  [-20.65945, -40.47595],
  [-20.6605, -40.4767],
  [-20.66165, -40.4776],
  [-20.6629, -40.47865],
  [-20.66415, -40.4799],
  [-20.66535, -40.4814],
  [-20.6665, -40.4831],
  [-20.6675, -40.4851],
  [-20.66825, -40.48725],
  [-20.66885, -40.4892],
];

/** Arco sul no oceano aberto (só água). */
const OCEAN_SOUTH_ARC: Array<[number, number]> = [
  [-20.66885, -40.48955],
  [-20.66905, -40.49035],
  [-20.66905, -40.49115],
  [-20.66885, -40.49185],
  [-20.6685, -40.49245],
];

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

export function localHourSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

export function isSunActive(now = new Date()) {
  const h = localHourSaoPaulo(now);
  return h >= SUN_ON_HOUR && h < SUN_OFF_HOUR;
}

function densify(anchors: Array<[number, number]>, perSeg = 6): Array<[number, number]> {
  if (anchors.length < 2) return anchors.slice();
  const out: Array<[number, number]> = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [aLat, aLng] = anchors[i];
    const [bLat, bLng] = anchors[i + 1];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      out.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]);
    }
  }
  out.push(anchors[anchors.length - 1]);
  return out;
}

function seawardNE(prev: [number, number], next: [number, number], lat: number): [number, number] {
  const tN = (next[0] - prev[0]) / METERS_LAT;
  const tE = (next[1] - prev[1]) / metersLng(lat);
  let nE = tN;
  let nN = -tE;
  const len = Math.hypot(nN, nE);
  if (len < 1e-6) return [-0.55, 0.84];
  return [nN / len, nE / len];
}

/** Interpola lng da waterline na latitude (linha N→S). */
function waterlineLngAt(line: Array<[number, number]>, lat: number) {
  if (lat >= line[0][0]) return line[0][1];
  if (lat <= line[line.length - 1][0]) return line[line.length - 1][1];
  for (let i = 0; i < line.length - 1; i++) {
    const [aLat, aLng] = line[i];
    const [bLat, bLng] = line[i + 1];
    if (lat <= aLat && lat >= bLat) {
      const t = (aLat - lat) / (aLat - bLat + 1e-12);
      return aLng + (bLng - aLng) * t;
    }
  }
  return line[0][1];
}

/**
 * CLIP terrestre assimétrico:
 * - Oeste (Muquiçaba): empurra para DENTRO da água (longe de telhados/ruas).
 * - Leste (Pescaria): margem ~0 — azul encosta na costa, sem buraco no mar.
 */
function clipToBayWater(
  lat: number,
  lng: number,
  westMarginM = 28,
  eastMarginM = 1,
): [number, number] {
  const mLng = metersLng(lat);
  const westLimit = waterlineLngAt(MUQUICABA_WATERLINE, lat) + westMarginM * mLng;
  const eastLimit = waterlineLngAt(PESCARIA_WATERLINE, lat) - eastMarginM * mLng;
  let next = lng;
  if (next < westLimit) next = westLimit;
  if (next > eastLimit) next = eastLimit;
  return [lat, next];
}

function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    if (nE < 0.22) {
      nE = 0.45;
      nN = Math.min(nN, -0.82);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    lng = Math.max(lng, p[1] + 6 * metersLng(p[0]));
    if (p[1] > -40.482) {
      lat = Math.min(lat, p[0] - 6 * METERS_LAT);
    }
    return clipToBayWater(lat, lng);
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return clipToBayWater(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t);
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>) {
  return [...seaSide, ...[...landSide].reverse()];
}

const DRY_DENSE = densify(DRY_WALL, 6);
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

const MUQUI_DENSE = densify(MUQUICABA_WATERLINE, 4);
const PESCA_DENSE = densify(PESCARIA_WATERLINE, 4);
const SOUTH_DENSE = densify(OCEAN_SOUTH_ARC, 3);

/**
 * Polígono orgânico da baía = areia dinâmica (API) + costas clipadas.
 * Leste: desce pela waterline da Pescaria (água, nunca verde).
 * Sul: arco no oceano.
 * Oeste: sobe pela waterline de Muquiçaba (água, nunca telhados).
 */
function bayWaterPolygon(shore: Array<[number, number]>): Array<[number, number]> {
  const shoreClipped = shore.map(([lat, lng]) => clipToBayWater(lat, lng));

  // Leste: encosta EXATAMENTE na costa/areia da Pescaria (sem buraco)
  const eastCoast = PESCA_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng, 28, 0));

  // Oeste: contorno da água — fora de Muquiçaba/telhados/ruas
  const westCoast = [...MUQUI_DENSE]
    .reverse()
    .map(([lat, lng]) => clipToBayWater(lat, lng, 28, 0));

  const south = SOUTH_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng, 24, 0));

  return [...shoreClipped, ...eastCoast, ...south, ...westCoast];
}

export function sunHeatFactor(now = new Date()) {
  if (!isSunActive(now)) return 0;
  const hour = localHourSaoPaulo(now);
  const peak = 13;
  return Math.max(0.25, Math.min(1, 1 - Math.abs(hour - peak) / 7));
}

export function sunAzimuthDeg(now = new Date()) {
  const hour = localHourSaoPaulo(now);
  return (
    80 +
    ((Math.min(SUN_OFF_HOUR, Math.max(SUN_ON_HOUR, hour)) - SUN_ON_HOUR) / (SUN_OFF_HOUR - SUN_ON_HOUR)) * 200
  );
}

export function sunSandRings(): {
  wash: Array<[number, number]>;
  mid: Array<[number, number]>;
  core: Array<[number, number]>;
} {
  const land0 = projectFromDry(DRY_DENSE, SAND_LAND_M);
  const land1 = projectFromDry(DRY_DENSE, SAND_LAND_M + 5);
  const land2 = projectFromDry(DRY_DENSE, SAND_LAND_M + 10);
  const sea0 = projectFromDry(DRY_DENSE, SAND_SEA_M);
  const sea1 = projectFromDry(DRY_DENSE, SAND_SEA_M - 8);
  const sea2 = projectFromDry(DRY_DENSE, SAND_SEA_M - 16);
  return {
    wash: closedBand(sea0, land0),
    mid: closedBand(sea1, land1),
    core: closedBand(sea2, land2),
  };
}

export function sunSandBand(): Array<[number, number]> {
  return sunSandRings().wash;
}
export function sunSandCore(): Array<[number, number]> {
  return sunSandRings().core;
}
export function sunBand() {
  return sunSandBand();
}

/**
 * Maré: borda Noroeste (areia) = lerp EXCLUSIVO da ratio da API ao vivo.
 * Corpo = água da baía clipada nas costas de Muquiçaba e Pescaria.
 */
export function tideLayers(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  const shore = lerpShore(SHORE_LOW, SHORE_HIGH, t);
  const softNear = lerpShore(
    projectFromDry(DRY_DENSE, LOW_TIDE_M + FEATHER_M * 0.45),
    projectFromDry(DRY_DENSE, HIGH_TIDE_M + FEATHER_M * 0.45),
    t,
  );
  const softFar = lerpShore(
    projectFromDry(DRY_DENSE, LOW_TIDE_M + FEATHER_M),
    projectFromDry(DRY_DENSE, HIGH_TIDE_M + FEATHER_M),
    t,
  );
  return {
    body: bayWaterPolygon(shore),
    soft: closedBand(softFar, shore),
    softInner: closedBand(softNear, shore),
  };
}

export function tideOceanBand(ratio: number) {
  return tideLayers(ratio).body;
}
export function tideWaterBand(ratio: number) {
  return tideLayers(ratio).body;
}
export function tideWetSandBand(ratio: number) {
  return tideLayers(ratio).soft;
}
export function tideEdgeLine(ratio: number) {
  return lerpShore(SHORE_LOW, SHORE_HIGH, Math.min(1, Math.max(0, ratio)));
}
export function tideSurfLine(ratio: number = 0.45) {
  return tideEdgeLine(ratio);
}

/** Ratio AO VIVO da API — null se dado inválido (sem mock). */
export function tideRatio(level: number, rangeMin: number, rangeMax: number): number | null {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return null;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return null;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}

export function tideReachLabel(ratio: number) {
  if (ratio < 0.28) return "vazante · água na beira";
  if (ratio < 0.55) return "maré média · molhando a areia";
  if (ratio < 0.78) return "enchente · subindo na areia";
  return "preamar · água na areia alta";
}
