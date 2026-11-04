import type { PinKind } from "./page-types";

export type MapFilter = "neutro" | PinKind;

export type FeatureId = "mare" | "clima" | "crianca" | "alertas" | "rampa";

export type FeatureDef = {
  id: FeatureId;
  title: string;
  subtitle: string;
  accent: string;
};

export const FEATURES: FeatureDef[] = [
  { id: "mare", title: "Maré Agora", subtitle: "nível e ondas", accent: "#22d3ee" },
  { id: "clima", title: "Clima", subtitle: "7 dias", accent: "#facc15" },
  { id: "crianca", title: "Criança Perdida", subtitle: "Perdi ou achei", accent: "#fb923c" },
  { id: "alertas", title: "Alertas", subtitle: "2 ativos", accent: "#c084fc" },
];

export const MAP_FILTERS: { id: MapFilter; label: string; emoji: string; hint: string }[] = [
  { id: "neutro", label: "Vista", emoji: "◌", hint: "Vista da orla, sem comércio em destaque." },
  { id: "quiosques", label: "Quiosques", emoji: "🍹", hint: "Quiosques na areia." },
  { id: "ambulantes", label: "Ambulantes", emoji: "🧺", hint: "Ambulantes credenciados online." },
  { id: "duchas", label: "Duchas", emoji: "🚿", hint: "Duchas no calçadão." },
  { id: "hoteis", label: "Hotéis", emoji: "🏨", hint: "Hotéis na avenida." },
  { id: "sorveterias", label: "Sorvetes", emoji: "🍦", hint: "Sorveterias na avenida." },
  { id: "parceiros", label: "Parceiros", emoji: "🤝", hint: "Restaurante e farmácia." },
];

export const GUARA_SPEECH = "Oi, sou o Guará! Como posso te ajudar na Praia do Morro hoje?";

export const PIN_COLORS: Record<PinKind | "landmark" | "academia", string> = {
  quiosques: "#0ea5e9",
  duchas: "#38bdf8",
  hoteis: "#6366f1",
  sorveterias: "#ec4899",
  parceiros: "#14b8a6",
  ambulantes: "#f97316",
  landmark: "#f59e0b",
  academia: "#ef4444",
};
