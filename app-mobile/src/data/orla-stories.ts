export type StoryId = "marlin" | "fotos" | "bandeiras";

export const MARLIN_PHOTOS = [
  {
    src: require("../assets/guarapari/marlin-rochas.png"),
    title: "Nas pedras",
    caption: "O Marlin Azul no costão, com o céu aberto sobre a Praia do Morro.",
  },
  {
    src: require("../assets/guarapari/marlin-por-do-sol.jpg"),
    title: "Pôr do sol",
    caption: "O fim da tarde, quando a orla e o morro acendem atrás da estátua.",
  },
  {
    src: require("../assets/guarapari/marlin-aerea.png"),
    title: "A areia",
    caption: "A praia aos pés do peixe: guarda-sóis, raso e o calçadão logo atrás.",
  },
  {
    src: require("../assets/guarapari/marlin-agua.png"),
    title: "O mar",
    caption: "A água sobe nas pedras. É daqui que se entende o tamanho da orla.",
  },
] as const;

export const BEACH_PHOTOS = [
  {
    src: require("../assets/guarapari/praia-sul.jpg"),
    title: "A curva",
    caption: "A areia abre em direção ao Morro da Pescaria.",
    credit: "Mariusm98 · CC BY-SA 4.0",
  },
  {
    src: require("../assets/guarapari/praia-verao.jpg"),
    title: "Verão",
    caption: "Guarda-sóis, raso e a cidade atrás.",
    credit: "Diego Baravelli · CC BY-SA 4.0",
  },
  {
    src: require("../assets/guarapari/praia-vista.jpg"),
    title: "Fim de tarde",
    caption: "A luz baixa, a espuma na areia e o morro fechando a baía.",
    credit: "HVL · CC BY 3.0",
  },
  {
    src: require("../assets/guarapari/praia-orla.jpg"),
    title: "A orla",
    caption: "Calçadão, areia larga e o mar calmo.",
    credit: "Fabiojrsouza · CC BY-SA 4.0",
  },
  {
    src: require("../assets/guarapari/praia-enseada.jpg"),
    title: "A enseada",
    caption: "As pedras do costão e o morro no horizonte.",
    credit: "edudesena · CC BY-SA 3.0",
  },
] as const;

export const MARLIN_CARES = [
  {
    title: "O piso escorrega",
    text: "A pedra é lisa e fica molhada de maresia. Ande devagar. Segure a criança pela mão.",
  },
  {
    title: "Não deixe lixo",
    text: "Garrafa, bituca e sacola não ficam na pedra. O que você trouxe, você leva.",
  },
  {
    title: "Não risque e não danifique",
    text: "O Marlin é patrimônio. Foto, sim. Dano, não.",
  },
] as const;

export const FLAGS = [
  {
    id: "verde",
    name: "Verde",
    meaning: "Banho liberado",
    detail: "Mar calmo e posto em operação. Ainda assim, fique onde o salva-vidas enxerga.",
    cloth: "#22c55e",
    now: false,
  },
  {
    id: "amarela",
    name: "Amarela",
    meaning: "Atenção",
    detail: "Mar moderado. Crianças e quem nada pouco ficam no raso, entre as bandeiras.",
    cloth: "#facc15",
    now: true,
  },
  {
    id: "vermelha",
    name: "Vermelha",
    meaning: "Banho proibido",
    detail: "Corrente, ressaca ou risco alto. A areia continua aberta. A água, não.",
    cloth: "#ef4444",
    now: false,
  },
  {
    id: "vigiada",
    name: "Vermelha e amarela",
    meaning: "Área vigiada",
    detail: "O posto protege o trecho entre estas bandeiras. Não nade fora delas.",
    cloth: "#f59e0b",
    now: false,
  },
  {
    id: "roxa",
    name: "Roxa",
    meaning: "Animais marinhos",
    detail: "Águas-vivas, caravelas ou ouriços. Evite o raso e avise o posto se alguém se queimar.",
    cloth: "#a855f7",
    now: false,
  },
  {
    id: "preta",
    name: "Preta",
    meaning: "Praia imprópria",
    detail: "Poluição ou risco sanitário. Sem banho, mesmo com o mar bonito.",
    cloth: "#18181b",
    now: false,
  },
] as const;

export const ALERT_CARDS = [
  {
    tone: "amber" as const,
    title: "Bandeira amarela",
    text: "Mar agitado em alguns trechos. Crianças no raso, entre as bandeiras do posto.",
  },
  {
    tone: "violet" as const,
    title: "Raios ao longe",
    text: "Se ouvir trovão, saia da água e evite postes e guarda-sóis de metal.",
  },
  {
    tone: "sky" as const,
    title: "Correnteza no costão",
    text: "No lado das pedras a água puxa. Prefira o trecho vigiado do posto.",
  },
] as const;
