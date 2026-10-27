import type { PinKind } from "./page-types";

export type MenuItem = {
  name: string;
  price: string;
  photo: string;
};

export type PerkId = "shower" | "wifi" | "access" | "music";

export type Place = {
  id: string;
  mapKind: PinKind;
  name: string;
  hours: string;
  isSponsor: boolean;
  tag?: string;
  cover?: string;
  menu?: MenuItem[];
  perks?: PerkId[];
  lat: number;
  lng: number;
  x: number;
  y: number;
};

const CAMARAO = "/cardapio/camarao.jpg";
const DRINK = "/cardapio/drink.jpg";
const GELADA = "/cardapio/chopp.jpg";
const BARCA = "/cardapio/porcao.jpg";
const HOT = "/cardapio/peixe.jpg";
const BOWL = "/cardapio/acai.jpg";

const COVERS = [
  "/guarapari/praia-verao.jpg",
  "/guarapari/praia-orla.jpg",
  "/guarapari/marlin-por-do-sol.jpg",
  "/guarapari/praia-sul.jpg",
  "/guarapari/praia-vista.jpg",
];

const FREE_HOURS = "08h – 18h";

// Sequential WGS84 points along the sand of Praia do Morro, south to north.
const KIOSK_SAND: Array<[number, number]> = [
  [-20.659626, -40.494732],
  [-20.65873, -40.493817],
  [-20.658667, -40.493749],
  [-20.658048, -40.492987],
  [-20.65688, -40.491539],
  [-20.656824, -40.49147],
  [-20.656035, -40.49042],
  [-20.655982, -40.490346],
  [-20.65539, -40.489431],
  [-20.655342, -40.489355],
  [-20.654869, -40.488465],
  [-20.654831, -40.488387],
  [-20.654388, -40.487507],
  [-20.653969, -40.486592],
  [-20.653549, -40.485616],
  [-20.653514, -40.485534],
  [-20.653127, -40.48461],
  [-20.653092, -40.484528],
  [-20.652672, -40.483321],
  [-20.652652, -40.483231],
  [-20.65237, -40.481918],
  [-20.652351, -40.481826],
  [-20.65238, -40.478557],
  [-20.652395, -40.478466],
  [-20.652577, -40.477236],
  [-20.652844, -40.476273],
];

function spreadCloseKiosks(points: Array<[number, number]>) {
  const next = points.map(([lat, lng]) => [lat, lng] as [number, number]);
  const pairs = [
    [2, 3],
    [5, 6],
    [7, 8],
    [9, 10],
    [11, 12],
    [15, 16],
    [17, 18],
    [19, 20],
    [21, 22],
    [23, 24],
  ];
  const minSep = 0.00032;
  for (const [a, b] of pairs) {
    const i = a - 1;
    const j = b - 1;
    const dLat = next[j][0] - next[i][0];
    const dLng = next[j][1] - next[i][1];
    const dist = Math.hypot(dLat, dLng);
    if (dist === 0 || dist >= minSep) continue;
    const push = (minSep - dist) / 2;
    const uLat = dLat / dist;
    const uLng = dLng / dist;
    next[i] = [next[i][0] - uLat * push, next[i][1] - uLng * push];
    next[j] = [next[j][0] + uLat * push, next[j][1] + uLng * push];
  }
  return next;
}

const KIOSK_POINTS = spreadCloseKiosks(KIOSK_SAND);

function kiosk(n: number, extra: Partial<Place> = {}): Place {
  const row = n % 2 === 0 ? 748 : 688;
  const [lat, lng] = KIOSK_POINTS[n - 1];
  return {
    id: `q${n}`,
    mapKind: "quiosques",
    hours: FREE_HOURS,
    isSponsor: false,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    x: 210 + (n - 1) * 46,
    y: row,
    ...extra,
    name: `Quiosque ${String(n).padStart(2, "0")}`,
  };
}

const sponsorMenu = (items: MenuItem[]) => items;

export const SHOWERS: { id: string; mapKind: PinKind; name: string; lat: number; lng: number }[] = [
  { id: "sul", mapKind: "duchas", name: "Ducha Sul", lat: -20.657464, lng: -40.492163 },
  { id: "norte", mapKind: "duchas", name: "Ducha Norte", lat: -20.652662, lng: -40.483176 },
];

export const PLACES: Place[] = [
  kiosk(1),
  kiosk(2),
  kiosk(3),
  kiosk(4),
  kiosk(5),
  kiosk(6),
  kiosk(7, {
    hours: "10h – 00h",
    isSponsor: true,
    tag: "Porções de frutos do mar",
    cover: COVERS[1],
    perks: ["shower", "wifi", "music"],
    menu: sponsorMenu([
      { name: "Camarão na brasa", price: "R$ 89", photo: CAMARAO },
      { name: "Gelada da orla", price: "R$ 14", photo: GELADA },
      { name: "Drinque da casa", price: "R$ 28", photo: DRINK },
    ]),
  }),
  kiosk(8),
  kiosk(9),
  kiosk(10),
  kiosk(11),
  kiosk(12, {
    hours: "08h – 22h",
    isSponsor: true,
    tag: "Música ao vivo",
    cover: COVERS[2],
    perks: ["wifi", "music", "access"],
    menu: sponsorMenu([
      { name: "Drinque do Zé", price: "R$ 26", photo: DRINK },
      { name: "Barca da casa", price: "R$ 120", photo: BARCA },
      { name: "Long neck", price: "R$ 12", photo: GELADA },
    ]),
  }),
  kiosk(13),
  kiosk(14),
  kiosk(15),
  kiosk(16),
  kiosk(17),
  kiosk(18, {
    hours: "09h – 20h",
    isSponsor: true,
    tag: "Tigela e petiscos",
    cover: COVERS[0],
    perks: ["wifi", "access", "shower"],
    menu: sponsorMenu([
      { name: "Bowl da casa", price: "R$ 32", photo: BOWL },
      { name: "Hot da areia", price: "R$ 42", photo: HOT },
      { name: "Drinque gelado", price: "R$ 24", photo: DRINK },
    ]),
  }),
  kiosk(19),
  kiosk(20),
  kiosk(21),
  kiosk(22, {
    hours: "08h – 23h",
    isSponsor: true,
    tag: "Pôr do sol com som",
    cover: COVERS[4],
    perks: ["music", "wifi", "shower"],
    menu: sponsorMenu([
      { name: "Camarão do sol", price: "R$ 96", photo: CAMARAO },
      { name: "Combinado", price: "R$ 78", photo: HOT },
      { name: "Brinde gelado", price: "R$ 16", photo: GELADA },
    ]),
  }),
  kiosk(23),
  kiosk(24),
  kiosk(25),
  kiosk(26),
  {
    id: "hotel-mar",
    mapKind: "hoteis",
    name: "Hotel Mar",
    hours: "Recepção 24h",
    isSponsor: false,
    lat: -20.656824,
    lng: -40.49189,
    x: 610,
    y: 1090,
  },
  {
    id: "sorvete",
    mapKind: "sorveterias",
    name: "Sorveteria do Morro",
    hours: "11h – 22h",
    isSponsor: true,
    tag: "Fila que vale",
    cover: COVERS[3],
    perks: ["wifi", "access"],
    menu: [
      { name: "Drinque cremoso", price: "R$ 22", photo: DRINK },
      { name: "Taça da casa", price: "R$ 18", photo: BOWL },
      { name: "Gelada", price: "R$ 12", photo: GELADA },
    ],
    lat: -20.655342,
    lng: -40.489775,
    x: 684,
    y: 1090,
  },
  {
    id: "pousada",
    mapKind: "hoteis",
    name: "Pousada da Orla",
    hours: "Check-in 14h",
    isSponsor: true,
    tag: "Quarto com vista",
    cover: COVERS[1],
    perks: ["wifi", "shower", "access"],
    menu: [
      { name: "Bowl da pousada", price: "R$ 36", photo: BOWL },
      { name: "Combinado", price: "R$ 64", photo: HOT },
      { name: "Boas-vindas", price: "R$ 24", photo: DRINK },
    ],
    lat: -20.653969,
    lng: -40.487012,
    x: 758,
    y: 1090,
  },
  {
    id: "restaurante",
    mapKind: "parceiros",
    name: "Restaurante Beira-Mar",
    hours: "12h – 23h",
    isSponsor: true,
    tag: "Reserva na hora",
    cover: COVERS[2],
    perks: ["access", "wifi", "music"],
    menu: [
      { name: "Camarão na brasa", price: "R$ 98", photo: CAMARAO },
      { name: "Barca do chef", price: "R$ 140", photo: BARCA },
      { name: "Hot roll", price: "R$ 48", photo: HOT },
    ],
    lat: -20.653092,
    lng: -40.484948,
    x: 832,
    y: 1090,
  },
  {
    id: "farmacia",
    mapKind: "parceiros",
    name: "Farmácia da Orla",
    hours: "07h – 22h",
    isSponsor: false,
    lat: -20.652351,
    lng: -40.482246,
    x: 906,
    y: 1090,
  },
];

export type Ambulante = {
  id: string;
  name: string;
  tag: string;
  isSponsor: boolean;
  isOnline: boolean;
  walks: boolean;
  lat: number;
  lng: number;
  hours: string;
  cover: string;
  about: string;
  menu: MenuItem[];
  whatsapp: string;
};

// Mid-sand, seaward of the kiosk line. Only sponsors who are online are drawn.
export const AMBULANTES: Ambulante[] = [
  {
    id: "milho",
    name: "Milho Verde",
    tag: "Espiga na brasa",
    isSponsor: true,
    isOnline: true,
    walks: true,
    lat: -20.656216,
    lng: -40.490112,
    hours: "Na areia agora",
    cover: "/guarapari/praia-verao.jpg",
    about: "Espiga assada na hora, passando pela faixa de areia.",
    whatsapp: "Chamar no WhatsApp",
    menu: [
      { name: "Espiga na brasa", price: "R$ 12", photo: "/guarapari/praia-verao.jpg" },
      { name: "Milho com queijo", price: "R$ 15", photo: "/guarapari/praia-orla.jpg" },
      { name: "Milho com manteiga", price: "R$ 10", photo: "/guarapari/praia-sul.jpg" },
    ],
  },
  {
    id: "picole",
    name: "Picolé da Tarde",
    tag: "Caixa térmica na areia",
    isSponsor: true,
    isOnline: true,
    walks: true,
    lat: -20.653783,
    lng: -40.485382,
    hours: "Na areia agora",
    cover: "/guarapari/praia-orla.jpg",
    about: "Caixa térmica de picolé passando pela praia.",
    whatsapp: "Chamar no WhatsApp",
    menu: [
      { name: "Picolé de frutas", price: "R$ 8", photo: "/guarapari/praia-orla.jpg" },
      { name: "Picolé de chocolate", price: "R$ 8", photo: "/guarapari/praia-verao.jpg" },
      { name: "Picolé de coco", price: "R$ 8", photo: "/guarapari/praia-enseada.jpg" },
    ],
  },
  {
    id: "acai",
    name: "Açaí",
    tag: "Tigela gelada",
    isSponsor: true,
    isOnline: true,
    walks: false,
    lat: -20.652604,
    lng: -40.481684,
    hours: "Na areia agora",
    cover: "/guarapari/praia-vista.jpg",
    about: "Tigela montada na hora, parado na areia.",
    whatsapp: "Chamar no WhatsApp",
    menu: [
      { name: "Tigela 300 ml", price: "R$ 18", photo: BOWL },
      { name: "Tigela 500 ml", price: "R$ 24", photo: BOWL },
      { name: "Açaí com granola", price: "R$ 22", photo: BOWL },
    ],
  },
  {
    id: "caldo",
    name: "Caldo de Cana",
    tag: "Copo na hora",
    isSponsor: true,
    isOnline: true,
    walks: false,
    lat: -20.655103,
    lng: -40.488231,
    hours: "Na areia agora",
    cover: "/guarapari/praia-sul.jpg",
    about: "Cana prensada na hora, copo gelado na areia.",
    whatsapp: "Chamar no WhatsApp",
    menu: [
      { name: "Copo 300 ml", price: "R$ 8", photo: "/guarapari/praia-sul.jpg" },
      { name: "Copo 500 ml", price: "R$ 12", photo: "/guarapari/praia-vista.jpg" },
      { name: "Com limão e gelo", price: "R$ 10", photo: "/guarapari/praia-enseada.jpg" },
    ],
  },
  {
    id: "agua",
    name: "Água de Coco",
    tag: "Fora da areia agora",
    isSponsor: true,
    isOnline: false,
    walks: false,
    lat: -20.653326,
    lng: -40.484294,
    hours: "Fora da areia",
    cover: "/guarapari/praia-enseada.jpg",
    about: "Não está na areia neste momento.",
    whatsapp: "Chamar no WhatsApp",
    menu: [],
  },
  {
    id: "pastel",
    name: "Pastel do Morro",
    tag: "Sem credencial",
    isSponsor: false,
    isOnline: true,
    walks: false,
    lat: -20.657114,
    lng: -40.491305,
    hours: "Sem credencial",
    cover: "/guarapari/praia-orla.jpg",
    about: "Ainda sem credencial na orla.",
    whatsapp: "Chamar no WhatsApp",
    menu: [],
  },
];

export const MARLIN = {
  id: "marlin",
  name: "Marlin Azul",
  detail: "Símbolo da orla",
  lat: -20.652934,
  lng: -40.478706,
};

export const MARLIN_TIPS = [
  {
    title: "O piso escorrega",
    text: "A pedra fica molhada de maresia. Ande devagar e segure a criança pela mão.",
  },
  {
    title: "Não deixe lixo",
    text: "Garrafa, bituca e sacola não ficam na pedra. O que você trouxe, você leva.",
  },
  {
    title: "Não risque o monumento",
    text: "Não escreva nome, não suba no peixe e não danifique a pintura. Foto, sim. Dano, não.",
  },
] as const;

export const MARLIN_SPEAK =
  "O Marlin Azul é patrimônio da Praia do Morro. Atenção: a pedra escorrega, então ande com cuidado. Não deixe lixo. E não risque, não suba e não danifique o monumento. Foto, sim. Dano, não.";

export const ESCUNA_SRC = "/pins/escuna.png?v=2";
export const ESCUNA_WAKE_SRC = "/pins/escuna-onda.png?v=1";
export const CARRINHO_SRC = "/pins/carrinho-festa.png";
export const QUIOSQUE_SRC = "/pins/quiosque-cartoon.png";
export const MARLIN_SRC = "/pins/marlin-cartoon.png";

export type EscunaPasseio = {
  id: string;
  name: string;
  photo: string;
  roteiro: string;
  tag: "Patrocinador";
  whatsapp: string;
};

export const ESCUNA_POINT = {
  id: "escunas",
  name: "Ponto das Escunas",
  lat: -20.66742,
  lng: -40.49805,
};

export const escunasPatrocinadoras: EscunaPasseio[] = [
  {
    id: "pirata",
    name: "Escuna Pirata",
    photo: "/guarapari/praia-enseada.jpg",
    roteiro: "Saída pelo canal, contorno das ilhas e parada para banho.",
    tag: "Patrocinador",
    whatsapp: "Chamar no WhatsApp",
  },
  {
    id: "monte-agha",
    name: "Escuna Monte Aghá",
    photo: "/guarapari/praia-vista.jpg",
    roteiro: "Passeio de fim de tarde pelo canal, com volta ao píer.",
    tag: "Patrocinador",
    whatsapp: "Chamar no WhatsApp",
  },
  {
    id: "canal",
    name: "Escuna do Canal",
    photo: "/guarapari/praia-sul.jpg",
    roteiro: "Travessia curta pelo Canal de Guarapari, ideal para o primeiro passeio.",
    tag: "Patrocinador",
    whatsapp: "Chamar no WhatsApp",
  },
];
