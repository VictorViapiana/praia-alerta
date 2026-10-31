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
  [-20.6602, -40.49515], // oeste: na areia, a leste de Muquiçaba
  [-20.6595, -40.49455],
  [-20.6588, -40.49375],
  [-20.6580, -40.49275],
  [-20.6571, -40.49165],
  [-20.6565, -40.49075],
  [-20.6559, -40.4898],
  [-20.6551, -40.4888],
  [-20.6546, -40.48785],
  [-20.6542, -40.48695],
  [-20.6538, -40.48595],
  [-20.6534, -40.48495],
  [-20.6530, -40.48395],
  [-20.6527, -40.48295],
  [-20.6524, -40.48175],
  [-20.65235, -40.4805],
  [-20.6524, -40.47925],
  [-20.65255, -40.4780],
  [-20.65285, -40.47685],
  [-20.65315, -40.47605],
  [-20.6534, -40.47555], // leste: antes do verde da Pescaria
];

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 48;
const HIGH_TIDE_M = 14;
const FEATHER_M = 11;

const SAND_LAND_M = 3;
const SAND_SEA_M = 34;

/**
 * Costa OESTE (Muquiçaba) — água fica a LESTE desta linha.
 * Norte→sul: acompanha a península urbana sem cobrir telhados/ruas.
 */
const MUQUICABA_WATERLINE: Array<[number, number]> = [
  [-20.6598, -40.4952],
  [-20.6610, -40.49505],
  [-20.6622, -40.49485],
  [-20.6634, -40.49455],
  [-20.6646, -40.4942],
  [-20.6658, -40.4937],
  [-20.6668, -40.4931],
  [-20.6676, -40.4924],
  [-20.6683, -40.4915],
  [-20.6688, -40.4904],
];

/**
 * Costa LESTE (Morro da Pescaria) — água fica a OESTE desta linha.
 * Norte→sul: contorna a base do morro verde, sem subir na mata.
 */
const PESCARIA_WATERLINE: Array<[number, number]> = [
  [-20.6535, -40.4757],
  [-20.6543, -40.47575],
  [-20.6552, -40.47585],
  [-20.6561, -40.4760],
  [-20.6570, -40.47625],
  [-20.6580, -40.4766],
  [-20.6591, -40.4771],
  [-20.6603, -40.47775],
  [-20.6615, -40.47855],
  [-20.6628, -40.4795],
  [-20.6641, -40.48065],
  [-20.6654, -40.4820],
  [-20.6666, -40.48355],
  [-20.6676, -40.4853],
  [-20.6684, -40.4872],
  [-20.6689, -40.4892],
];

/** Arco sul no oceano aberto (só água). */
const OCEAN_SOUTH_ARC: Array<[number, number]> = [
  [-20.6689, -40.4900],
  [-20.6691, -40.4907],
  [-20.6690, -40.4915],
  [-20.6688, -40.4922],
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
 * CLIP terrestre: empurra o ponto para dentro da água da baía.
 * Oeste → a leste da costa de Muquiçaba (+ margem).
 * Leste → a oeste da base do Morro da Pescaria (− margem).
 */
function clipToBayWater(lat: number, lng: number, marginM = 12): [number, number] {
  const mLng = metersLng(lat);
  const margin = marginM * mLng;
  const westLimit = waterlineLngAt(MUQUICABA_WATERLINE, lat) + margin; // mais leste = água
  const eastLimit = waterlineLngAt(PESCARIA_WATERLINE, lat) - margin; // mais oeste = água
  let next = lng;
  if (next < westLimit) next = westLimit;
  if (next > eastLimit) next = eastLimit;
  // Norte demais (avenida): empurra um pouco ao sul se acima da dry wall local
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
    return clipToBayWater(lat, lng, 14);
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return clipToBayWater(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t, 14);
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
  const shoreClipped = shore.map(([lat, lng]) => clipToBayWater(lat, lng, 14));

  // Costa leste: da ponta da areia → waterline Pescaria (empurrada 14 m para a água)
  const eastCoast = PESCA_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng, 14));

  // Costa oeste: waterline Muquiçaba invertida (sul→norte) até a ponta da areia
  const westCoast = [...MUQUI_DENSE]
    .reverse()
    .map(([lat, lng]) => clipToBayWater(lat, lng, 14));

  const south = SOUTH_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng, 10));

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
