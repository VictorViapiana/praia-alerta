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

export type LandmarkTone =
  | "pier"
  | "park"
  | "banheiro"
  | "esporte"
  | "praca"
  | "acesso"
  | "abrigo"
  | "playground"
  | "salva"
  | "golfinho";

export type LandmarkTip = {
  kind: "alerta" | "convivencia";
  title: string;
  text: string;
};

export type OrlaLandmark = {
  id: string;
  name: string;
  short: string;
  detail: string;
  lat: number;
  lng: number;
  tone: LandmarkTone;
  cover: string;
  tips: readonly LandmarkTip[];
  speak: string;
  search: string;
};

function banheiro(
  id: string,
  short: string,
  name: string,
  lat: number,
  lng: number,
): OrlaLandmark {
  return {
    id,
    name,
    short,
    detail: "Banheiro público da orla",
    lat,
    lng,
    tone: "banheiro",
    cover: "/guarapari/praia-orla.jpg",
    tips: [
      {
        kind: "alerta",
        title: "Fila e pressa",
        text: "Molhado e com pressa? Cuidado no piso. Segure a criança e não corra no corredor.",
      },
      {
        kind: "convivencia",
        title: "Deixe como achou",
        text: "Não jogue papel fora da lixeira, não escreva na parede e liberte o box assim que terminar.",
      },
      {
        kind: "convivencia",
        title: "Respeito na fila",
        text: "Prioridade para criança, idoso e quem precisa. Sem empurrão e sem gritaria.",
      },
    ],
    speak: `${name}: piso molhado, sem correria. Use a lixeira, respeite a fila e deixe o lugar limpo para o próximo.`,
    search: `${name} banheiro banheiros publico wc sanitário orla praia do morro ${short}`,
  };
}

/** Pier de pesca: centro do deque, não o largo da estátua (coords Google Maps). */
export const PIER_PESCARIA: OrlaLandmark = {
  id: "pier-pescaria",
  name: "Pier · Morro da Pescaria",
  short: "Pier",
  detail: "Ponto de pesca no costão",
  lat: -20.656011,
  lng: -40.474337,
  tone: "pier",
  cover: "/guarapari/praia-enseada.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Pedra molhada",
      text: "O píer e as pedras escorregam com a maresia. Ande devagar e firme o passo.",
    },
    {
      kind: "alerta",
      title: "Olho na onda",
      text: "O mar bate no costão. Não vire as costas para a água e não se encoste na beira.",
    },
    {
      kind: "convivencia",
      title: "Leve o que trouxe",
      text: "Linha, isca e lixo voltam com você. O ponto de pesca é da orla — deixe limpo.",
    },
  ],
  speak:
    "O píer do Morro da Pescaria é o ponto de pesca no costão, no fim da praia. A pedra escorrega, olhe a onda e não deixe lixo. Foto e pesca com cuidado.",
  search: "pier píer ponto de pesca morro da pescaria costão pesca anzol",
};

/** Parque Natural Municipal Morro da Pescaria (coords Google Maps). */
export const PARQUE_PESCARIA: OrlaLandmark = {
  id: "parque-pescaria",
  name: "Parque Morro da Pescaria",
  short: "Parque",
  detail: "Parque Natural Municipal",
  lat: -20.657067,
  lng: -40.471832,
  tone: "park",
  cover: "/guarapari/praia-vista.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Trilha e mata",
      text: "É parque natural: fique nas trilhas, não corte planta e não faça fogo.",
    },
    {
      kind: "alerta",
      title: "Leve água",
      text: "Há pouco comércio no alto. Leve água, chapéu e saia antes do escurecer.",
    },
    {
      kind: "convivencia",
      title: "Silêncio na fauna",
      text: "Não alimente animais e não leve nada da mata. Observe e fotografe só.",
    },
  ],
  speak:
    "O Parque Natural Municipal Morro da Pescaria fecha a baía no norte da Praia do Morro. Trilha, mata e vista do mar. Fique no caminho, leve água e respeite a fauna.",
  search: "parque natural municipal morro da pescaria mata trilha reserva floresta",
};

export const PRACA_PAZ: OrlaLandmark = {
  id: "praca-paz",
  name: "Praça da Paz",
  short: "Praça",
  detail: "Praça na Av. Beira Mar",
  lat: -20.651888,
  lng: -40.479302,
  tone: "praca",
  cover: "/guarapari/praia-orla.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Atenção no cruzamento",
      text: "Fica na Beira Mar com movimento de carro. Cruze na faixa e segure a criança.",
    },
    {
      kind: "convivencia",
      title: "Espaço de todos",
      text: "Som alto, churrasco improvisado e lixo no banco estragam a praça. Use a lixeira.",
    },
    {
      kind: "convivencia",
      title: "Noite com cuidado",
      text: "Depois do escurecer, prefira o calçadão iluminado e evite ficar isolado.",
    },
  ],
  speak:
    "A Praça da Paz fica na Beira Mar, perto do Marlin. Cruze na faixa, não deixe lixo e à noite prefira o calçadão iluminado.",
  search: "praça da paz praca paz beira mar marlin",
};

export const ARENA_03: OrlaLandmark = {
  id: "arena-03",
  name: "Quadra 03",
  short: "Quadra",
  detail: "Quadra de areia na orla",
  lat: -20.655741,
  lng: -40.490022,
  tone: "esporte",
  cover: "/guarapari/praia-verao.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Bola na areia",
      text: "Jogo forte perto de criança e guarda-sol. Avise antes de sacar e olhe quem está atrás.",
    },
    {
      kind: "convivencia",
      title: "Respeite o tempo",
      text: "A quadra é coletiva: combine o tempo, não monopolize e deixe o próximo time entrar.",
    },
    {
      kind: "convivencia",
      title: "Sem briga",
      text: "Discussão de ponto não vira gritaria. O clima da orla vem antes do placar.",
    },
  ],
  speak:
    "Quadra 03, na areia da orla. Olhe as crianças ao redor, divida o tempo de jogo e mantenha o respeito.",
  search: "quadra 03 arena 03 arena03 quadra areia vôlei futevôlei esporte",
};

export const QUADRA_AREIA: OrlaLandmark = {
  id: "quadra-areia",
  name: "Quadra de Areia",
  short: "Quadra",
  detail: "Quadra no trecho sul",
  lat: -20.659309,
  lng: -40.494386,
  tone: "esporte",
  cover: "/guarapari/praia-sul.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Sol e esforço",
      text: "No meio-dia a areia queima. Hidrate, use protetor e faça pausa entre os sets.",
    },
    {
      kind: "convivencia",
      title: "Espaço compartilhado",
      text: "Não espalhe coolers na quadra. Guarde o material na beira e liberte a marca.",
    },
    {
      kind: "convivencia",
      title: "Som e respeito",
      text: "Caixa de som no talo atrapalha o jogo e o banho. Volume baixo, bom senso alto.",
    },
  ],
  speak:
    "Quadra de areia no sul da praia. Hidrate no calor, não ocupe a marca com cooler e mantenha o som baixo.",
  search: "quadra de areia quadra sul esporte vôlei futevôlei",
};

function bancos(
  id: string,
  short: string,
  name: string,
  detail: string,
  lat: number,
  lng: number,
  search: string,
): OrlaLandmark {
  return {
    id,
    name,
    short,
    detail,
    lat,
    lng,
    tone: "abrigo",
    cover: "/guarapari/praia-orla.jpg",
    tips: [
      {
        kind: "alerta",
        title: "Telhado e sol",
        text: "A cobertura esquenta e o piso em volta queima. Não suba no telhado e não deixe criança sozinha.",
      },
      {
        kind: "convivencia",
        title: "Sombra é de todos",
        text: "Toalha e bolsa não reservam o banco o dia inteiro. Sentou, usou, liberou para o próximo.",
      },
      {
        kind: "convivencia",
        title: "Sem lixo na areia",
        text: "Comida, bituca e sacola não ficam debaixo da cobertura. O que trouxe, leva.",
      },
    ],
    speak: `${name}. A sombra é compartilhada: não reserve o banco o dia todo, não suba na cobertura e não deixe lixo.`,
    search,
  };
}

/** Três gazebos enfileirados na areia, ao lado do Marlin. */
export const BANCOS_MARLIN = bancos(
  "bancos-marlin",
  "Bancos",
  "Bancos cobertos · Marlin",
  "Conjunto de 3 bancos na areia",
  -20.652309,
  -40.479111,
  "banco bancos coberto cobertos gazebo sombra marlin areia conjunto tres",
);

/** Três bancos cobertos no fim da praia, no Morro da Pescaria. */
export const BANCOS_NORTE = bancos(
  "bancos-norte",
  "Bancos",
  "Bancos cobertos · Norte",
  "Conjunto de 3 bancos no fim da praia",
  -20.654421,
  -40.473615,
  "banco bancos coberto cobertos gazebo sombra norte pescaria conjunto tres",
);

export const PLAYGROUND: OrlaLandmark = {
  id: "playground",
  name: "Playground",
  short: "Play",
  detail: "Parquinho na areia",
  lat: -20.653436,
  lng: -40.485284,
  tone: "playground",
  cover: "/guarapari/praia-verao.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Ferro quente",
      text: "No sol o brinquedo queima. Confira com a mão antes de a criança sentar ou escorregar.",
    },
    {
      kind: "alerta",
      title: "Olho na criança",
      text: "Areia e brinquedo juntos. Não deixe sozinha e não deixe correr para o mar daqui.",
    },
    {
      kind: "convivencia",
      title: "Fila no brinquedo",
      text: "Um de cada vez no escorrega e no balanço. Espere a vez e ajude quem é menor.",
    },
  ],
  speak:
    "Playground na areia. O ferro esquenta no sol, fique com a criança e respeite a fila do brinquedo.",
  search: "playground play parquinho brinquedo crianca escorrega balanco areia",
};

export const SALVA_VIDAS: OrlaLandmark = {
  id: "salva-vidas",
  name: "Salva-vidas",
  short: "Salva-vidas",
  detail: "Posto de salva-vidas",
  lat: -20.653246,
  lng: -40.485064,
  tone: "salva",
  cover: "/guarapari/praia-orla.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Bandeira manda",
      text: "Amarela é cuidado, vermelha é sem banho. O posto vale mais do que o mar parecer calmo.",
    },
    {
      kind: "alerta",
      title: "Corredor livre",
      text: "Não pare cadeira, guarda-sol ou carrinho na frente do posto. A saída para o resgate tem que estar livre.",
    },
    {
      kind: "convivencia",
      title: "Posto não é quiosque",
      text: "Não peça gelo, tomada ou guarda-volume. Em emergência, chame alto e aponte o ponto.",
    },
  ],
  speak:
    "Posto de salva-vidas. Respeite a bandeira, deixe o corredor livre e chame o posto só para emergência.",
  search: "salva vidas salva-vidas posto guarda bombeiro resgate bandeira",
};

/** Estátua do Golfinho no largo do costão, ao lado do píer (coords Google Maps). */
export const GOLFINHO: OrlaLandmark = {
  id: "golfinho",
  name: "Estátua do Golfinho",
  short: "Golfinho",
  detail: "Monumento no Morro da Pescaria",
  lat: -20.656174,
  lng: -40.47415,
  tone: "golfinho",
  cover: "/guarapari/praia-enseada.jpg",
  tips: [
    {
      kind: "alerta",
      title: "Pedra escorrega",
      text: "O piso do costão fica molhado de maresia. Segure a criança e não corra em volta da estátua.",
    },
    {
      kind: "alerta",
      title: "Não suba",
      text: "A estátua não é brinquedo. Não sente, não escale e não apoie o peso no golfinho.",
    },
    {
      kind: "convivencia",
      title: "Foto sem dano",
      text: "Não escreva, não risque e não deixe lixo no monumento. O golfinho é da orla.",
    },
  ],
  speak:
    "A estátua do golfinho fica no costão do Morro da Pescaria, ao lado do píer. A pedra escorrega. Não suba, não risque e não deixe lixo.",
  search: "golfinho estatua estátua do golfinho monumento pescaria costão",
};

export const BANHEIRO_II = banheiro("banheiro-ii", "Banheiro II", "Banheiro II · Praia do Morro", -20.65634, -40.490857);
export const BANHEIRO_III = banheiro("banheiro-iii", "Banheiro III", "Banheiro III · Praia do Morro", -20.654513, -40.487769);
export const BANHEIRO_V = banheiro("banheiro-v", "Banheiro V", "Banheiro V · Praia do Morro", -20.652247, -40.480678);
export const BANHEIRO_VI = banheiro("banheiro-vi", "Banheiro VI", "Banheiro VI · Praia do Morro", -20.652737, -40.476609);

/** Marcos da orla com dicas de convivência e alerta do Guará (coords Google Maps). */
export const ORLA_LANDMARKS: OrlaLandmark[] = [
  BANHEIRO_II,
  BANHEIRO_III,
  BANHEIRO_V,
  BANHEIRO_VI,
  ARENA_03,
  QUADRA_AREIA,
  BANCOS_MARLIN,
  BANCOS_NORTE,
  PLAYGROUND,
  SALVA_VIDAS,
  PRACA_PAZ,
  PIER_PESCARIA,
  GOLFINHO,
  PARQUE_PESCARIA,
];

export function landmarkById(id: string | null | undefined) {
  if (!id) return null;
  return ORLA_LANDMARKS.find((item) => item.id === id) ?? null;
}

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
