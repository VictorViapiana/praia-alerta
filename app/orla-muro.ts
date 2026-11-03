/**
 * Muro da orla — Praia do Morro (começo da praia → Quiosque 01).
 *
 * CAPTURA DE PONTOS (temporário):
 * 1. Abra o mapa com ?muro=1  (ex.: http://localhost:3000/?muro=1)
 * 2. Toque ao longo da divisão areia × calçadão, sul → Quiosque 01
 * 3. Copie o array do painel amarelo (ou do console) e cole em MURO_SUL_ATE_Q1
 * 4. Depois desligue MURO_CAPTURE = false e remova ?muro=1
 */

/**
 * TEMP — true = captura sempre ligada.
 * Em produção deixe false e use a URL ?muro=1 para ativar só quando for mapear.
 */
export const MURO_CAPTURE = false;

/**
 * Cole aqui os pontos capturados, na ordem: começo da praia → Quiosque 01.
 * Formato: [latitude, longitude]
 *
 * Exemplo (apague e cole o seu):
 *   [-20.661096, -40.495584],
 *   [-20.6605, -40.4951],
 *   [-20.659626, -40.494731], // Quiosque 01 — último ponto
 */
export const MURO_SUL_ATE_Q1: Array<[number, number]> = [
  // ← cole os pontos capturados aqui
];

export const MURO_SUL_NOTE = "Muro da orla no trecho sul — do começo da praia até o Quiosque 01.";
