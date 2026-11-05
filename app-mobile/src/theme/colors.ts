export const colors = {
  oceanDeep: "#0b2a48",
  ocean: "#1d649c",
  oceanSoft: "#38bdf8",
  sand: "#f5e6c8",
  woodRail: "#a67c52",
  woodPost: "#6d4c35",
  sos: "#dc2626",
  sosDeep: "#4a0b0b",
  ink: "#0f172a",
  mist: "rgba(255,255,255,0.92)",
  glass: "rgba(15,23,42,0.55)",
  glassLight: "rgba(255,255,255,0.14)",
  success: "#16a34a",
  warning: "#f59e0b",
} as const;

export const map = {
  /** Centro da Praia do Morro — Guarapari/ES */
  center: { latitude: -20.6558, longitude: -40.4888 },
  /** ~zoom 16 — orla com pins já legíveis (web ORLA_ZOOM=16). delta=360/2^16. */
  initialDelta: { latitudeDelta: 0.0055, longitudeDelta: 0.0038 },
  closeDelta: { latitudeDelta: 0.0032, longitudeDelta: 0.0022 },
  muroMinZoomApprox: 16,
} as const;
