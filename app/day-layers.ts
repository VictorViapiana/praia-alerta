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
 * Parede seca (quiosques / calçadão) — borda inland da areia.
 * Usada só para a borda N dinâmica e para o Sol.
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6597, -40.49345], // oeste: areia, longe da cidade
  [-20.65905, -40.49295],
  [-20.6584, -40.4922],
  [-20.6576, -40.49135],
  [-20.6569, -40.49045],
  [-20.6563, -40.48965],
  [-20.6557, -40.48885],
  [-20.65495, -40.48795],
  [-20.6545, -40.4871],
  [-20.6541, -40.48625],
  [-20.6537, -40.4853],
  [-20.6533, -40.48435],
  [-20.65295, -40.4834],
  [-20.65265, -40.4824],
  [-20.6524, -40.48125],
  [-20.65232, -40.4801],
  [-20.65238, -40.47895],
  [-20.65255, -40.4778],
  [-20.6529, -40.4767],
  [-20.6533, -40.47575],
  [-20.6537, -40.47505],
];

/** Metros seaward na areia: vazante → preamar. */
const LOW_TIDE_M = 48;
const HIGH_TIDE_M = 12;
const FEATHER_M = 11;

/**
 * Faixa térmica do Sol — só areia SECA (entre quiosques e a linha molhada).
 * 34 m vazava na espuma; ~26 m cobre a areia quente sem entrar na água.
 */
const SAND_LAND_M = 4;
const SAND_SEA_M = 26;

/**
 * Costa LESTE (Pescaria) N→S — água a OESTE.
 * Não curva tanto a oeste no sul (senão cruza o Atalaia).
 */
const BAY_EAST: Array<[number, number]> = [
  [-20.6537, -40.4749],
  [-20.6542, -40.47445],
  [-20.65465, -40.4742],
  [-20.65515, -40.4741],
  [-20.6557, -40.4743],
  [-20.65615, -40.4745],
  [-20.65655, -40.47465],
  [-20.6572, -40.47495],
  [-20.65795, -40.4753],
  [-20.65875, -40.47585],
  [-20.6596, -40.4765],
  [-20.66055, -40.4773],
  [-20.6615, -40.47815],
  [-20.6625, -40.4790],
  [-20.6635, -40.4797],
  [-20.6645, -40.4803],
  [-20.6655, -40.48085],
  [-20.6665, -40.4814],
  [-20.6674, -40.4821],
  [-20.6682, -40.4830],
  [-20.6689, -40.4842],
];

/** Arco sul — oceano aberto, a LESTE do Morro do Atalaia (nunca cidade). */
const BAY_SOUTH: Array<[number, number]> = [
  [-20.66895, -40.4844],
  [-20.66915, -40.4852],
  [-20.6692, -40.4860],
  [-20.6691, -40.4867],
  [-20.66885, -40.4873],
];

/**
 * Costa OESTE N→S — água a LESTE.
 * Contorna o Morro do Atalaia / Benedito Almeida / Edisio Cirne:
 * fica na água a LESTE da península rochosa (~-40.485), nunca em cima dela.
 */
const BAY_WEST: Array<[number, number]> = [
  [-20.6593, -40.49315],
  [-20.6602, -40.4924],
  [-20.6610, -40.4913],
  [-20.6618, -40.4900],
  [-20.6626, -40.4886],
  [-20.6634, -40.4873],
  [-20.6642, -40.4862],
  [-20.6651, -40.4853], // leste do Atalaia — só água
  [-20.6660, -40.4849],
  [-20.6670, -40.4848],
  [-20.6679, -40.4851],
  [-20.6686, -40.4860],
  [-20.66885, -40.4870],
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

function coastLngAt(line: Array<[number, number]>, lat: number) {
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

/** Clip: azul só entre as costas oeste/leste (água). */
function clipToBayWater(lat: number, lng: number): [number, number] {
  const westLimit = coastLngAt(BAY_WEST, lat);
  const eastLimit = coastLngAt(BAY_EAST, lat);
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

const EAST_DENSE = densify(BAY_EAST, 5);
const SOUTH_DENSE = densify(BAY_SOUTH, 3);
const WEST_DENSE = densify(BAY_WEST, 5);

/**
 * Corpo = toda a água da baía até a areia (borda N = preamar / perto da areia).
 * Laterais fixas na linha d'água. Sem buraco no mar, sem cidade/morro.
 */
function bayWaterPolygon(shoreNearSand: Array<[number, number]>): Array<[number, number]> {
  const north = shoreNearSand.map(([lat, lng]) => clipToBayWater(lat, lng));
  const east = EAST_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const south = SOUTH_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const west = [...WEST_DENSE].reverse().map(([lat, lng]) => clipToBayWater(lat, lng));
  return [...north, ...east, ...south, ...west];
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

/** Projeta na areia sem clip da baía (o clip puxava vértices pra água). */
function projectOnSand(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    // Empurra SE (mar) sem deixar o normal virar pra oeste (cidade).
    if (nE < 0.28) {
      nE = 0.5;
      nN = Math.min(nN, -0.8);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    // Extremos da orla (ponte oeste / Atalaia leste): recua pra não cair na água.
    const tip =
      i < dry.length * 0.08 || i > dry.length * 0.92
        ? 0.72
        : i < dry.length * 0.16 || i > dry.length * 0.84
          ? 0.88
          : 1;
    const m = Math.max(0, meters * tip);
    const lat = p[0] + nN * m * METERS_LAT;
    let lng = p[1] + nE * m * metersLng(p[0]);
    // Nunca inland do dry wall; leve empurrão seaward.
    lng = Math.max(lng, p[1] + 3 * metersLng(p[0]));
    return [lat, lng] as [number, number];
  });
}

function chaikin(line: Array<[number, number]>, rounds = 2): Array<[number, number]> {
  let cur = line;
  for (let r = 0; r < rounds; r++) {
    if (cur.length < 2) return cur;
    const next: Array<[number, number]> = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const [aLat, aLng] = cur[i];
      const [bLat, bLng] = cur[i + 1];
      next.push([aLat * 0.75 + bLat * 0.25, aLng * 0.75 + bLng * 0.25]);
      next.push([aLat * 0.25 + bLat * 0.75, aLng * 0.25 + bLng * 0.75]);
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

const SAND_DRY = densify(DRY_WALL, 10);

export function sunSandRings(): {
  wash: Array<[number, number]>;
  mid: Array<[number, number]>;
  core: Array<[number, number]>;
  glow: Array<[number, number]>;
} {
  // Anéis concêntricos na areia seca — glow externo bem fraco, core interno quente.
  const landGlow = chaikin(projectOnSand(SAND_DRY, SAND_LAND_M - 1));
  const land0 = chaikin(projectOnSand(SAND_DRY, SAND_LAND_M + 1));
  const land1 = chaikin(projectOnSand(SAND_DRY, SAND_LAND_M + 4));
  const land2 = chaikin(projectOnSand(SAND_DRY, SAND_LAND_M + 7));
  const seaGlow = chaikin(projectOnSand(SAND_DRY, SAND_SEA_M));
  const sea0 = chaikin(projectOnSand(SAND_DRY, SAND_SEA_M - 3));
  const sea1 = chaikin(projectOnSand(SAND_DRY, SAND_SEA_M - 7));
  const sea2 = chaikin(projectOnSand(SAND_DRY, SAND_SEA_M - 11));
  return {
    glow: closedBand(seaGlow, landGlow),
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
 * Maré:
 * - body: SEMPRE até a areia (SHORE_HIGH) + laterais na linha d'água → sem buraco na baía.
 * - soft: faixa dinâmica (API) entre vazante e preamar na areia.
 */
export function tideLayers(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  const shoreDynamic = lerpShore(SHORE_LOW, SHORE_HIGH, t);
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
    body: bayWaterPolygon(SHORE_HIGH),
    soft: closedBand(softFar, shoreDynamic).map(([lat, lng]) => clipToBayWater(lat, lng)),
    softInner: closedBand(softNear, shoreDynamic).map(([lat, lng]) => clipToBayWater(lat, lng)),
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
