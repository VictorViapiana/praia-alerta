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

/** Paridade web `CARES` em app/orla.tsx — textos completos + índice. */
export const MARLIN_CARES = [
  {
    index: "01",
    icon: "alert" as const,
    title: "O piso escorrega",
    text: "A pedra é lisa e fica molhada de maresia e de respingo. Ande devagar, com o pé inteiro no chão. Não corra. Segure a criança pela mão. Um escorregão aqui machuca.",
  },
  {
    index: "02",
    icon: "trash" as const,
    title: "Não deixe lixo",
    text: "Garrafa, bituca, casca e sacola não ficam na pedra nem na fresta. O que você trouxe, você leva. Nada de deixar resto para o mar recolher.",
  },
  {
    index: "03",
    icon: "ban" as const,
    title: "Não risque e não danifique",
    text: "O Marlin é patrimônio da cidade. Não escreva nome, não grave data, não arranque pedaço, não suba no peixe e não apoie nada que risque a pintura. Foto, sim. Dano, não.",
  },
] as const;

export const MARLIN_STATS = [
  ["1992", "O recorde"],
  ["636 kg", "O peixe"],
  ["8 m", "A escultura"],
] as const;

export const MARLIN_INTRO =
  "O peixe azul nas pedras é o cartão-postal da orla. Ele olha o Atlântico. Atrás dele, no fim da tarde, o sol desce no morro.";

export const MARLIN_HISTORY = [
  "Em 1992, Paulo Amorim pescou um marlim-azul de 636 quilos, recorde mundial, na costa do Espírito Santo. A escultura da Praia do Morro foi feita para guardar esse feito: cerca de 8 metros, em fibra de vidro, pelo artista Giuliano Filippi.",
  "Em 2020, a Lei municipal 4.407 declarou a estátua patrimônio cultural e afetivo de Guarapari. Ela não é enfeite de passagem. É um bem da cidade, no costão, separado dos quiosques e das lojas.",
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
