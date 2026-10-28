import { fold, type TideNow, type WeatherNow } from "./coast";
import {
  AMBULANTES,
  ARENA_03,
  BANHEIRO_V,
  ESCUNA_POINT,
  MARLIN,
  PARQUE_PESCARIA,
  PIER_PESCARIA,
  PLACES,
  PRACA_PAZ,
  QUADRA_AREIA,
  SHOWERS,
} from "./places";
import type { PinKind } from "./page-types";

export type MapFilter = "neutro" | PinKind;

export type GuaraGuide = {
  answer: string;
  filter?: MapFilter;
  query?: string;
  fly?: { lat: number; lng: number };
  openId?: string | null;
  sheet?: string | null;
  basemap?: "satellite" | "clean";
  locate?: boolean;
  route?: { id?: string; lat: number; lng: number; name: string };
};

export type GuaraPrompt = {
  emoji: string;
  label: string;
  ask: string;
};

export const HOME_PROMPTS: GuaraPrompt[] = [
  { emoji: "🍹", label: "Quiosques", ask: "Onde ficam os quiosques?" },
  { emoji: "🌊", label: "Maré e ondas", ask: "Como está a maré?" },
  { emoji: "🚩", label: "Alertas", ask: "Tem alerta agora?" },
  { emoji: "🧺", label: "Na areia", ask: "Quem está na areia agora?" },
  { emoji: "⛵", label: "Escunas", ask: "Como é o passeio de escuna?" },
  { emoji: "☀️", label: "Clima", ask: "Como está o clima?" },
];

export const MAP_PROMPTS: GuaraPrompt[] = [
  { emoji: "🍹", label: "Quiosques", ask: "Mostra os quiosques" },
  { emoji: "🧺", label: "Ambulantes", ask: "Mostra os ambulantes" },
  { emoji: "🚿", label: "Duchas", ask: "Onde tem ducha?" },
  { emoji: "⛵", label: "Escunas", ask: "Leva até as escunas" },
  { emoji: "🍦", label: "Sorvete", ask: "Onde tem sorvete?" },
  { emoji: "📍", label: "Eu", ask: "Onde estou?" },
  { emoji: "🏨", label: "Hotéis", ask: "Mostra os hotéis" },
  { emoji: "🐟", label: "Marlin", ask: "Cadê o Marlin?" },
  { emoji: "🎣", label: "Pier", ask: "Onde fica o pier da pescaria?" },
  { emoji: "🌳", label: "Parque", ask: "Leva ao Parque do Morro" },
  { emoji: "🚻", label: "Banheiro", ask: "Onde tem banheiro?" },
  { emoji: "🏐", label: "Arena", ask: "Cadê a arena de areia?" },
];

export type GuaraLive = {
  tide: TideNow | null;
  weather: WeatherNow | null;
};

function meters(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function tideAnswer(tide: TideNow | null) {
  if (!tide) return "A carta de maré ainda não chegou. Abre Maré agora na home para ver o nível e as ondas.";
  const high = tide.nextHigh
    ? ` A preamar chega às ${tide.nextHigh.label}, com ${meters(tide.nextHigh.level)} m.`
    : "";
  return `Maré ${tide.trend.toLowerCase()}, ${meters(tide.level)} m. Ondas de ${meters(tide.wave)} m.${high} ${tide.note}`;
}

function weatherAnswer(weather: WeatherNow | null) {
  if (!weather) return "O clima da Praia do Morro ainda está carregando. Em instantes eu te digo a temperatura e o vento.";
  return `${Math.round(weather.temp)}° e ${weather.summary.toLowerCase()}. Sensação de ${Math.round(weather.feels)}°. Vento de ${Math.round(weather.wind)} km/h vindo de ${weather.windDir}.`;
}

const ALERTS =
  "Bandeira amarela na Praia do Morro: mar picado, banho só entre as bandeiras. Há registro de águas-vivas na Areia Preta. O salva-vidas fica até 18h.";

function spot(id: string) {
  return PLACES.find((item) => item.id === id) ?? AMBULANTES.find((item) => item.id === id) ?? null;
}

function showSpot(id: string, answer: string, filter: MapFilter, openSheet: boolean, withRoute = true): GuaraGuide {
  const item = spot(id);
  if (!item) return { answer };
  return {
    answer,
    filter,
    query: "",
    fly: { lat: item.lat, lng: item.lng },
    openId: item.id,
    sheet: openSheet ? item.id : null,
    route: withRoute ? { id: item.id, lat: item.lat, lng: item.lng, name: item.name } : undefined,
  };
}

function has(text: string, ...words: string[]) {
  return words.some((word) => text.includes(fold(word)));
}

export function answerGuara(raw: string, live: GuaraLive = { tide: null, weather: null }): GuaraGuide {
  const text = fold(raw);

  const kioskNumber = text.match(/quiosque\s*0*(\d{1,2})/) ?? text.match(/\bq\s*0*(\d{1,2})\b/);
  if (kioskNumber) {
    const number = Number(kioskNumber[1]);
    const place = PLACES.find((item) => item.id === `q${number}`);
    if (!place) {
      return { answer: "Na Praia do Morro os quiosques vão do 01 ao 26, só com o número. Me diz qual deles." };
    }
    const sponsor = place.isSponsor ? " Este é um dos quiosques com cardápio." : " Este aparece só com o número, na areia.";
    return showSpot(place.id, `O ${place.name} está na faixa de areia, de frente para o calçadão.${sponsor}`, "quiosques", place.isSponsor);
  }

  if (has(text, "crianca perdida", "crianca se perdeu", "perdi uma crianca")) {
    return { answer: "Criança perdida fica na home, no card com o rosto. Ele avisa a orla. Usa só se uma criança se perder de verdade." };
  }
  if (has(text, "emergencia", "socorro", "resgate", "policia")) {
    return { answer: "No mapa, o círculo vermelho à esquerda, no alto, é a emergência. Segura até o anel fechar. Na home, desliza o botão de baixo. Os dois disparam o mesmo alerta." };
  }
  if (has(text, "camera", "foto", "eu amo guarapari")) {
    return { answer: "A câmera fica à direita, acima da busca, no botão com o coração. A foto sai com a moldura Eu amo Guarapari." };
  }
  if (has(text, "onde estou", "minha localizacao", "me acha", "centraliza")) {
    return { answer: "Vou centralizar o mapa em você: calçadão embaixo dos pés, areia na frente.", locate: true };
  }
  if (has(text, "mapa limpo", "estilo limpo", "sem satelite")) {
    return { answer: "Troquei para o mapa limpo: areia, água e ruas, sem a foto de satélite.", basemap: "clean" };
  }
  if (has(text, "satelite", "foto aerea")) {
    return { answer: "Voltei para o satélite, com a orla mais suave.", basemap: "satellite" };
  }
  if (has(text, "vista geral", "mostra tudo", "limpa o mapa", "tira o filtro")) {
    return { answer: "Vista geral de novo. Os pinos voltam quando você aproximar ou escolher um filtro.", filter: "neutro", query: "", openId: null, sheet: null };
  }

  if (has(text, "marlin")) {
    return {
      answer: "O Marlin Azul é o símbolo da orla, no canto norte da praia. Estou te levando até ele.",
      filter: "neutro",
      query: "",
      fly: { lat: MARLIN.lat, lng: MARLIN.lng },
      openId: MARLIN.id,
      sheet: null,
      route: { id: MARLIN.id, lat: MARLIN.lat, lng: MARLIN.lng, name: MARLIN.name },
    };
  }
  if (has(text, "parque", "mata do morro", "reserva", "trilha do morro")) {
    return {
      answer: "O Parque Natural Municipal Morro da Pescaria fica no alto, fechando a baía. Te levo até a entrada.",
      filter: "neutro",
      query: "",
      fly: { lat: PARQUE_PESCARIA.lat, lng: PARQUE_PESCARIA.lng },
      openId: PARQUE_PESCARIA.id,
      sheet: null,
      route: {
        id: PARQUE_PESCARIA.id,
        lat: PARQUE_PESCARIA.lat,
        lng: PARQUE_PESCARIA.lng,
        name: PARQUE_PESCARIA.name,
      },
    };
  }
  if (has(text, "pescaria", "ponto de pesca", "pier do morro", "pier da pescaria", "píer")) {
    return {
      answer: "O píer do Morro da Pescaria é o ponto de pesca no costão, no fim da praia. Estou te levando.",
      filter: "neutro",
      query: "",
      fly: { lat: PIER_PESCARIA.lat, lng: PIER_PESCARIA.lng },
      openId: PIER_PESCARIA.id,
      sheet: null,
      route: { id: PIER_PESCARIA.id, lat: PIER_PESCARIA.lat, lng: PIER_PESCARIA.lng, name: PIER_PESCARIA.name },
    };
  }
  if (has(text, "banheiro", "sanitario", "wc")) {
    return {
      answer: "Tem banheiros públicos na orla. Estou no Banheiro V, na Beira Mar. Também tem o II, III e VI.",
      filter: "neutro",
      query: "",
      fly: { lat: BANHEIRO_V.lat, lng: BANHEIRO_V.lng },
      openId: BANHEIRO_V.id,
      sheet: null,
      route: { id: BANHEIRO_V.id, lat: BANHEIRO_V.lat, lng: BANHEIRO_V.lng, name: BANHEIRO_V.name },
    };
  }
  if (has(text, "arena", "quadra de areia", "futevolei", "volei de praia")) {
    const spot = has(text, "sul", "quadra") && !has(text, "arena") ? QUADRA_AREIA : ARENA_03;
    return {
      answer: `${spot.name}: quadra na areia. Te levo até lá — e lembro das regras de convivência.`,
      filter: "neutro",
      query: "",
      fly: { lat: spot.lat, lng: spot.lng },
      openId: spot.id,
      sheet: null,
      route: { id: spot.id, lat: spot.lat, lng: spot.lng, name: spot.name },
    };
  }
  if (has(text, "praca da paz", "praça da paz")) {
    return {
      answer: "A Praça da Paz fica na Beira Mar, perto do Marlin. Vamos até ela.",
      filter: "neutro",
      query: "",
      fly: { lat: PRACA_PAZ.lat, lng: PRACA_PAZ.lng },
      openId: PRACA_PAZ.id,
      sheet: null,
      route: { id: PRACA_PAZ.id, lat: PRACA_PAZ.lat, lng: PRACA_PAZ.lng, name: PRACA_PAZ.name },
    };
  }
  if (has(text, "escuna", "barco", "passeio de barco", "canal")) {
    return {
      answer: "O ponto das escunas fica na água, ao sul da praia. Pirata, Monte Aghá e a do Canal saem dali.",
      filter: "neutro",
      query: "",
      fly: { lat: ESCUNA_POINT.lat, lng: ESCUNA_POINT.lng },
      openId: null,
      sheet: "escunas",
      route: { id: "escunas", lat: ESCUNA_POINT.lat, lng: ESCUNA_POINT.lng, name: "Ponto das Escunas" },
    };
  }
  if (has(text, "pier")) {
    return {
      answer:
        "Tem dois: o píer de pesca no Morro da Pescaria, no fim da praia, e o ponto das escunas no canal, ao sul. Te levo ao de pesca.",
      filter: "neutro",
      query: "",
      fly: { lat: PIER_PESCARIA.lat, lng: PIER_PESCARIA.lng },
      openId: PIER_PESCARIA.id,
      sheet: null,
      route: { id: PIER_PESCARIA.id, lat: PIER_PESCARIA.lat, lng: PIER_PESCARIA.lng, name: PIER_PESCARIA.name },
    };
  }

  if (has(text, "milho")) return showSpot("milho", "O Milho Verde está andando na areia, com espiga na brasa. Abri o cardápio.", "ambulantes", true);
  if (has(text, "picole")) return showSpot("picole", "O Picolé da Tarde passa pela areia com a caixa térmica. Abri o cardápio.", "ambulantes", true);
  if (has(text, "acai")) return showSpot("acai", "O açaí está parado na areia, com tigela gelada. Abri o cardápio.", "ambulantes", true);
  if (has(text, "caldo", "cana", "garapa")) return showSpot("caldo", "O Caldo de Cana está parado na areia, copo na hora. Abri o cardápio.", "ambulantes", true);
  if (has(text, "agua de coco", "coco")) return { answer: "Água de coco não está na areia neste momento. Na faixa, agora, eu vejo milho, picolé, açaí e caldo de cana." };
  if (has(text, "pastel")) return { answer: "O Pastel do Morro ainda não entra no mapa. Só aparecem os ambulantes que estão na areia." };

  if (has(text, "ducha sul", "chuveiro sul")) {
    const shower = SHOWERS[0];
    return { answer: "A Ducha Sul fica no calçadão, no trecho sul da praia.", filter: "duchas", query: "", fly: { lat: shower.lat, lng: shower.lng }, openId: null, sheet: null, route: { id: shower.id, lat: shower.lat, lng: shower.lng, name: shower.name } };
  }
  if (has(text, "ducha norte", "chuveiro norte")) {
    const shower = SHOWERS[1];
    return { answer: "A Ducha Norte fica no calçadão, mais para o norte.", filter: "duchas", query: "", fly: { lat: shower.lat, lng: shower.lng }, openId: null, sheet: null, route: { id: shower.id, lat: shower.lat, lng: shower.lng, name: shower.name } };
  }
  if (has(text, "ducha", "chuveiro")) {
    const shower = SHOWERS[0];
    return { answer: "São duas duchas no calçadão: Sul e Norte. Estou na Ducha Sul. A Norte fica mais adiante.", filter: "duchas", query: "", fly: { lat: shower.lat, lng: shower.lng }, openId: null, sheet: null, route: { id: shower.id, lat: shower.lat, lng: shower.lng, name: shower.name } };
  }

  if (has(text, "farmacia")) return showSpot("farmacia", "A Farmácia da Orla fica na avenida, atrás da praia.", "parceiros", false);
  if (has(text, "restaurante", "beira-mar", "beira mar")) return showSpot("restaurante", "O Restaurante Beira-Mar fica na avenida. Abri a casa.", "parceiros", true);
  if (has(text, "sorvete", "sorveteria")) return showSpot("sorvete", "A Sorveteria do Morro fica na avenida, das 11h às 22h. Abri a casa.", "sorveterias", true);
  if (has(text, "pousada")) return showSpot("pousada", "A Pousada da Orla fica na avenida. O check-in é às 14h. Abri a casa.", "hoteis", true);
  if (has(text, "hotel mar", "hotel")) return showSpot("hotel-mar", "O Hotel Mar tem recepção 24h, na avenida, atrás da praia. A Pousada da Orla também está nesse filtro.", "hoteis", false);

  if (has(text, "ambulante", "carrinho", "na areia agora")) {
    const first = AMBULANTES.find((item) => item.isSponsor && item.isOnline);
    return {
      answer: "Na areia agora: Milho Verde e Picolé da Tarde andando, Açaí e Caldo de Cana parados. Toca o carrinho para ver o cardápio e chamar no WhatsApp.",
      filter: "ambulantes",
      query: "",
      fly: first ? { lat: first.lat, lng: first.lng } : undefined,
      openId: null,
      sheet: null,
    };
  }
  if (has(text, "quiosque", "barraca")) {
    return showSpot(
      "q12",
      "São 26 quiosques, só com o número, na areia na frente do calçadão. Os de cardápio são o 07, o 12, o 18 e o 22. Te deixei no 12.",
      "quiosques",
      false,
      false,
    );
  }

  if (has(text, "mare", "onda", "preamar", "maré")) return { answer: tideAnswer(live.tide) };
  if (has(text, "alerta", "bandeira", "agua-viva", "aguas-vivas", "salva-vidas", "salva vidas")) return { answer: ALERTS };
  if (has(text, "clima", "tempo", "temperatura", "vento")) return { answer: weatherAnswer(live.weather) };

  return {
    answer: "Posso te levar aos quiosques, ambulantes, duchas, hotéis, sorvete, escunas ou ao Marlin. Pode pedir pelo nome, como Quiosque 12 ou Caldo de Cana.",
  };
}
