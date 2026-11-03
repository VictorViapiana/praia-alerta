/**
 * Grade de metal do calçadão — trecho sul da Praia do Morro.
 * Só do começo da praia até o Quiosque 01, colada na divisão areia × calçadão.
 *
 * Âncora: Quiosque 01 (−20.659626, −40.494732). Não passa do Q1.
 */

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function shift(lat: number, lng: number, northM: number, eastM: number): [number, number] {
  return [lat + northM * METERS_LAT, lng + eastM * metersLng(lat)];
}

/**
 * Divisão areia × calçadão, sul → Quiosque 01.
 * Pontos densos na borda do verde/pavimento — sem cortar areia nem água.
 */
export const MURO_SUL_ATE_Q1: Array<[number, number]> = [
  [-20.661096, -40.495584], // começo da praia (acesso sul)
  [-20.660896, -40.495423],
  [-20.66072, -40.495262],
  [-20.660544, -40.495128],
  [-20.660368, -40.495021],
  [-20.660193, -40.494913],
  [-20.660017, -40.494833],
  [-20.659867, -40.494769],
  [-20.659741, -40.494736],
  [-20.659626, -40.494731], // Quiosque 01 — para aqui
];

export const MURO_SUL_NOTE = "Grade do calçadão no trecho sul — do começo da praia até o Quiosque 01.";

/** Desloca a polyline na perpendicular (metros; + = esquerda no sentido do traçado). */
export function offsetPolyline(points: Array<[number, number]>, meters: number): Array<[number, number]> {
  if (points.length < 2) return points.map((p) => [p[0], p[1]] as [number, number]);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dLat = (next[0] - prev[0]) * 111_320;
    const dLng = (next[1] - prev[1]) / metersLng(points[i][0]);
    const len = Math.hypot(dLat, dLng) || 1;
    const nNorth = (-dLng / len) * meters;
    const nEast = (dLat / len) * meters;
    out.push(shift(points[i][0], points[i][1], nNorth, nEast));
  }
  return out;
}

/** Postes ao longo do muro (~a cada `stepM` metros). */
export function muroPosts(points: Array<[number, number]>, stepM = 5.5): Array<[number, number]> {
  if (points.length < 2) return [];
  const posts: Array<[number, number]> = [[points[0][0], points[0][1]]];
  let carried = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot((b[0] - a[0]) * 111_320, (b[1] - a[1]) / metersLng(a[0]));
    let t = stepM - carried;
    while (t < seg - 0.4) {
      const u = t / seg;
      posts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      t += stepM;
    }
    carried = seg - (t - stepM);
  }
  const last = points[points.length - 1];
  posts.push([last[0], last[1]]);
  return posts;
}

/** Trilhos: 3 barras escuras + corrimão claro no topo (offsets em m). */
export const MURO_RAIL_OFFSETS_M = [-0.38, -0.12, 0.12, 0.38] as const;
