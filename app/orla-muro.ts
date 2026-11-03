/**
 * Muro baixo de pedra/concreto do calçadão — trecho sul da Praia do Morro.
 *
 * Do começo da praia (acesso sul), passando pelo Quiosque 01, até a ducha
 * do muro (−20.658498, −40.493471). Segue a borda inland da areia
 * (parede seca / calçadão).
 */

/** Linha do muro: sul → Quiosque 01 → ducha do muro (lat,lng). */
export const MURO_SUL_ATE_Q1: Array<[number, number]> = [
  [-20.66115, -40.49520], // começo da praia / acesso sul
  [-20.66070, -40.49475],
  [-20.66025, -40.49430],
  [-20.65990, -40.49395],
  [-20.65970, -40.49370], // junto ao Quiosque 01
  [-20.65940, -40.49345],
  [-20.65905, -40.49320],
  [-20.65875, -40.49330],
  [-20.65850, -40.49347], // ducha do muro
];

export const MURO_SUL_NOTE =
  "Muro baixo do calçadão no trecho sul — do começo da praia até o Quiosque 01 e a ducha do muro.";
