export const HOME_TOUR_KEY = "hasSeenGuaraTutorial_v3";
export const MAP_TOUR_KEY = "hasSeenGuaraMapTutorial_v3";

export type TourStep = {
  text: string;
  target: string | null;
  guara: "large" | "small";
};

export const HOME_STEPS: TourStep[] = [
  {
    text: "Olá! Eu sou o Guará, o seu guia aqui na Praia do Morro! 🏖️ Deixe-me dar 2 avisos muito importantes antes de você aproveitar.",
    target: null,
    guara: "large",
  },
  {
    text: "Este é o botão de Criança Perdida. 👶 Ele avisa todos os quiosques e guarda-vidas da orla instantaneamente. Use APENAS se uma criança se perder de verdade!",
    target: "crianca",
    guara: "small",
  },
  {
    text: "E aqui embaixo fica o botão de Emergência. 🚨 Deslizar este botão aciona a Polícia e o Resgate. Trotes e alarmes falsos são crime, então use com total responsabilidade, ok?",
    target: "sos",
    guara: "small",
  },
  {
    text: "Tudo certo! Pode contar comigo. Toque em qualquer lugar da tela para começar.",
    target: null,
    guara: "small",
  },
];

export const MAP_STEPS: TourStep[] = [
  {
    text: "Chegamos na orla! Eu te mostro o mapa em poucos toques, para você achar gente e registrar a praia.",
    target: null,
    guara: "large",
  },
  {
    text: "Escreva aqui o nome de um quiosque, de um ambulante ou a palavra escuna. Eu levo o mapa até o ponto.",
    target: "map-search",
    guara: "small",
  },
  {
    text: "Se preferir, filtre. Quiosques, ambulantes, duchas, hotéis e sorvetes. Toque de novo no mesmo filtro para voltar à vista geral.",
    target: "map-filters",
    guara: "small",
  },
  {
    text: "Este botão abre a câmera com a moldura Eu amo Guarapari. A foto fica com você.",
    target: "map-camera",
    guara: "small",
  },
  {
    text: "Este círculo branco centraliza o mapa em você: calçadão embaixo dos pés, areia na frente.",
    target: "map-location",
    guara: "small",
  },
  {
    text: "Aproxima com dois dedos. Os quiosques e os carrinhos nascem na areia. Toque no carrinho para ver o cardápio e chamar no WhatsApp.",
    target: null,
    guara: "small",
  },
  {
    text: "É isso. A orla é sua. Bom passeio na Praia do Morro!",
    target: null,
    guara: "large",
  },
];
