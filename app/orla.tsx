"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Camera,
  ChevronRight,
  Clock,
  Compass,
  Droplets,
  Fish,
  Footprints,
  Waves,
  Sun,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
import { useState } from "react";
import {
  bearingArrow,
  compass,
  meters,
  tideDot,
  tidePath,
  useTide,
  useWeather,
  uvLabel,
  weatherMark,
  type TideNow,
} from "./coast";
import { CloseButton, closeTopClass, screenEnter } from "./nav-chrome";

export type StoryId = "marlin" | "fotos" | "bandeiras";

const spring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.86 };

export const PHOTOS = [
  {
    src: "/guarapari/marlin-rochas.png",
    title: "Nas pedras",
    caption: "O Marlin Azul no costão, com o céu aberto sobre a Praia do Morro.",
  },
  {
    src: "/guarapari/marlin-por-do-sol.jpg",
    title: "Pôr do sol",
    caption: "O fim da tarde, quando a orla e o morro acendem atrás da estátua.",
  },
  {
    src: "/guarapari/marlin-aerea.png",
    title: "A areia",
    caption: "A praia aos pés do peixe: guarda-sóis, raso e o calçadão logo atrás.",
  },
  {
    src: "/guarapari/marlin-agua.png",
    title: "O mar",
    caption: "A água sobe nas pedras. É daqui que se entende o tamanho da orla.",
  },
] as const;

const BEACH = [
  {
    src: "/guarapari/praia-sul.jpg",
    title: "A curva",
    caption: "A areia abre em direção ao Morro da Pescaria. É a Praia do Morro inteira, num olhar só.",
    credit: "Mariusm98 · CC BY-SA 4.0",
  },
  {
    src: "/guarapari/praia-verao.jpg",
    title: "Verão",
    caption: "Guarda-sóis, raso e a cidade atrás. No calor, a orla fica assim, de ponta a ponta.",
    credit: "Diego Baravelli · CC BY-SA 4.0",
  },
  {
    src: "/guarapari/praia-vista.jpg",
    title: "Fim de tarde",
    caption: "A luz baixa, a espuma na areia e o morro fechando a baía.",
    credit: "HVL · CC BY 3.0",
  },
  {
    src: "/guarapari/praia-orla.jpg",
    title: "A orla",
    caption: "Calçadão, areia larga e o mar calmo na frente dos prédios.",
    credit: "Fabiojrsouza · CC BY-SA 4.0",
  },
  {
    src: "/guarapari/praia-enseada.jpg",
    title: "A enseada",
    caption: "As pedras do costão, a água clara e o morro no horizonte.",
    credit: "edudesena · CC BY-SA 3.0",
  },
] as const;

const CARES = [
  {
    icon: AlertTriangle,
    index: "01",
    title: "O piso escorrega",
    text: "A pedra é lisa e fica molhada de maresia e de respingo. Ande devagar, com o pé inteiro no chão. Não corra. Segure a criança pela mão. Um escorregão aqui machuca.",
  },
  {
    icon: Trash2,
    index: "02",
    title: "Não deixe lixo",
    text: "Garrafa, bituca, casca e sacola não ficam na pedra nem na fresta. O que você trouxe, você leva. Nada de deixar resto para o mar recolher.",
  },
  {
    icon: Ban,
    index: "03",
    title: "Não risque e não danifique",
    text: "O Marlin é patrimônio da cidade. Não escreva nome, não grave data, não arranque pedaço, não suba no peixe e não apoie nada que risque a pintura. Foto, sim. Dano, não.",
  },
] as const;

const FLAGS = [
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
    cloth: "linear-gradient(90deg, #ef4444 50%, #facc15 50%)",
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

export function OrlaCards({
  hidden,
  onOpen,
}: {
  hidden: StoryId | null;
  onOpen: (id: "marlin" | "fotos") => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {hidden === "marlin" ? (
        <div className="h-[176px]" />
      ) : (
        <motion.button
          type="button"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpen("marlin")}
          style={{ borderRadius: 26 }}
          className="relative h-[176px] overflow-hidden border border-white/45 text-left shadow-[0_18px_40px_-18px_rgba(5,28,52,0.65)]"
        >
          <img
            src={PHOTOS[0].src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#041018]/95 via-[#041018]/40 to-transparent" />
          <span className="relative flex h-full flex-col justify-end p-3">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
              Símbolo da orla
            </span>
            <span className="mt-1 block font-serif text-[1.35rem] leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
              Marlin Azul
            </span>
          </span>
        </motion.button>
      )}

      {hidden === "fotos" ? (
        <div className="h-[176px]" />
      ) : (
        <motion.button
          type="button"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpen("fotos")}
          style={{ borderRadius: 26 }}
          className="relative h-[176px] overflow-hidden border border-white/45 text-left shadow-[0_18px_40px_-18px_rgba(5,28,52,0.65)]"
        >
          <img
            src={BEACH[0].src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#0b2740]/95 via-[#102033]/45 to-transparent" />
          <span className="absolute right-2 top-2 flex -space-x-2">
            {BEACH.slice(1, 4).map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt=""
                className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              />
            ))}
          </span>
          <span className="relative flex h-full items-end justify-between gap-2 p-3">
            <span className="font-serif text-[1.35rem] leading-[1.05] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">Praia do Morro</span>
            <span className="shrink-0 -translate-x-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-50">
              Galeria
            </span>
          </span>
        </motion.button>
      )}
    </div>
  );
}

export function MarlinScreen({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      {...screenEnter}
      style={{ borderRadius: 0 }}
      className="absolute inset-0 z-40 overflow-hidden bg-sky-700"
    >
      <CloseButton onClose={onClose} light className={closeTopClass} />
      <div className="no-scrollbar h-full overflow-x-hidden overflow-y-auto">
        <div className="relative h-[300px]">
          <img
            src={PHOTOS[1].src}
            alt="Marlin Azul no pôr do sol da Praia do Morro"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#061018] via-[#061018]/10 to-black/30" />
          <div className="absolute bottom-4 left-5 right-16">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Praia do Morro · Guarapari</p>
            <h2 className="mt-1 font-serif text-4xl leading-none text-white">Marlin Azul</h2>
          </div>
        </div>

        <div className="space-y-4 px-5 pb-8">
          <p className="text-sm leading-relaxed text-white/80">
            O peixe azul nas pedras é o cartão-postal da orla. Ele olha o Atlântico. Atrás dele, no fim
            da tarde, o sol desce no morro.
          </p>

          <section className="space-y-2.5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">No costão</p>
              <h3 className="mt-1 font-serif text-[1.65rem] leading-none text-white">Três cuidados</h3>
            </div>
            {CARES.map((care) => (
              <article
                key={care.index}
                className="flex gap-3 rounded-[1.25rem] border border-white/15 bg-white/10 p-3.5 backdrop-blur-md"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,0.55)]">
                  <care.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">{care.index}</span>
                  <h4 className="text-[15px] font-semibold leading-tight text-white">{care.title}</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/70">{care.text}</p>
                </span>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">A história</p>
            <h3 className="font-serif text-[1.7rem] leading-none text-white">O peixe que virou marco</h3>
            <p className="text-sm leading-relaxed text-white/78">
              Em 1992, Paulo Amorim pescou um marlim-azul de 636 quilos, recorde mundial, na costa
              do Espírito Santo. A escultura da Praia do Morro foi feita para guardar esse feito:
              cerca de 8 metros, em fibra de vidro, pelo artista Giuliano Filippi.
            </p>
            <p className="text-sm leading-relaxed text-white/78">
              Em 2020, a Lei municipal 4.407 declarou a estátua patrimônio cultural e afetivo de
              Guarapari. Ela não é enfeite de passagem. É um bem da cidade, no costão, separado dos
              quiosques e das lojas.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["1992", "O recorde"],
                ["636 kg", "O peixe"],
                ["8 m", "A escultura"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-2.5">
                  <p className="font-serif text-lg leading-none text-white">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            {PHOTOS.map((photo) => (
              <figure key={photo.src} className="overflow-hidden rounded-2xl">
                <img src={photo.src} alt={photo.caption} className="h-36 w-full object-cover" />
                <figcaption className="bg-white/10 px-2.5 py-2 text-[11px] text-white/70">
                  {photo.title}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-white/40">
            Patrimônio cultural e afetivo · Lei municipal 4.407/2020 · Praia do Morro, Guarapari.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function FotosScreen({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState<number | null>(null);
  const photo = zoom === null ? null : BEACH[zoom];

  return (
    <motion.div
      {...screenEnter}
      style={{ borderRadius: 0 }}
      className="absolute inset-0 z-40 overflow-hidden bg-sky-700"
    >
      <CloseButton onClose={onClose} light className={closeTopClass} />
      <div className="no-scrollbar h-full overflow-x-hidden overflow-y-auto">
        <div className="relative h-[300px]">
          <img
            src={BEACH[0].src}
            alt={BEACH[0].caption}
            className="h-full w-full object-cover object-[center_55%]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#07131c] via-transparent to-black/25" />
          <div className="absolute bottom-4 left-5 right-16">
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/80">Guarapari · ES</p>
            <h2 className="mt-1 font-serif text-4xl leading-none text-white">Praia do Morro</h2>
          </div>
        </div>
        <div className="space-y-3 px-5 pb-8">
          <p className="text-sm leading-relaxed text-white/80">
            Uma faixa longa de areia entre a cidade e o Morro da Pescaria. De manhã a orla está
            clara. No verão, a areia enche. No fim da tarde, o morro fecha a baía.
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">{BEACH[0].credit}</p>
          {BEACH.slice(1).map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setZoom(index + 1)}
              className="block w-full overflow-hidden rounded-[1.4rem] border border-white/15 text-left"
            >
              <img src={item.src} alt={item.caption} className="h-48 w-full object-cover" />
              <span className="block bg-white/10 px-3.5 py-3">
                <span className="block text-sm font-semibold text-white">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/70">{item.caption}</span>
                <span className="mt-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40">
                  {item.credit}
                </span>
              </span>
            </button>
          ))}
          <p className="text-[11px] leading-relaxed text-white/40">
            Fotos da Praia do Morro no Wikimedia Commons, com a licença e o autor de cada uma.
          </p>
        </div>
      </div>
      <AnimatePresence>
        {photo && (
          <motion.div
            className="absolute inset-0 z-10 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
            <CloseButton onClose={() => setZoom(null)} light className={closeTopClass} />
            <div className="absolute bottom-6 left-5 right-16">
              <p className="text-sm font-semibold text-white">{photo.title}</p>
              <p className="mt-1 text-[11px] text-white/70">{photo.credit}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FlagsScreen({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden bg-sky-800"
      {...screenEnter}
      role="dialog"
      aria-label="Bandeiras de sinalização"
    >
      <CloseButton onClose={onClose} className={closeTopClass} />
      <div
        className="flex items-start justify-between px-5 pb-2 pr-16"
        style={{ paddingTop: "max(1.1rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))" }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">Sinalização</p>
          <h2 className="font-serif text-3xl leading-none text-white">Bandeiras</h2>
        </div>
      </div>
      <div className="no-scrollbar h-[calc(100%-88px)] space-y-2.5 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="pb-1 text-sm leading-relaxed text-white/70">
          Na Praia do Morro a bandeira vale mais do que o aspecto do mar. Leia antes de entrar na água.
        </p>
        {FLAGS.map((flag) => (
          <article
            key={flag.id}
            className="flex gap-3 rounded-[1.3rem] border border-white/15 bg-white/10 p-3 backdrop-blur-md"
          >
            <span className="flex h-16 shrink-0 items-start pt-1">
              <span className="h-14 w-1 rounded-full bg-white/80" />
              <span
                className="ml-0.5 h-10 w-[4.5rem] rounded-r-md shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
                style={{
                  background: flag.cloth,
                  border: flag.id === "preta" ? "1px solid rgba(255,255,255,0.35)" : undefined,
                }}
              />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{flag.name}</span>
                {flag.now && (
                  <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold text-[#3a2a08]">
                    Agora
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-white/45">
                {flag.meaning}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-white/75">{flag.detail}</span>
            </span>
          </article>
        ))}
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-36 animate-pulse rounded-[1.4rem] bg-white/10" />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export function LiveClima() {
  const { data, failed } = useWeather();
  const [picked, setPicked] = useState(0);

  if (!data) {
    return failed ? (
      <p className="text-sm text-white/70">
        A estação não respondeu. Abra de novo em instantes para a previsão de 7 dias da Praia do Morro.
      </p>
    ) : (
      <Skeleton />
    );
  }

  const nowDay = data.days[0];
  const stats = [
    { icon: Sun, label: "Sensação", value: `${Math.round(data.feels)}°` },
    { icon: Wind, label: `Vento ${data.windDir}`, value: `${Math.round(data.wind)} km/h` },
    { icon: Droplets, label: "Umidade", value: `${Math.round(data.humidity)}%` },
    { icon: Sun, label: "UV agora", value: `${data.uv.toFixed(1).replace(".", ",")} ${uvLabel(data.uv)}` },
  ];

  return (
    <div className="space-y-5">
      <div className="glass-panel relative z-[1] rounded-[1.4rem] p-4 text-center">
        <p className="text-3xl" aria-hidden>
          {weatherMark(data.code)}
        </p>
        <p className="mt-1 font-serif text-6xl leading-none text-white">{Math.round(data.temp)}°</p>
        <p className="mt-2 text-sm text-white/70">
          {data.summary} · Praia do Morro
        </p>
        {nowDay && (
          <p className="mt-1 text-xs text-white/50">
            Máx. {Math.round(nowDay.max)}° · mín. {Math.round(nowDay.min)}° · UV do dia{" "}
            {nowDay.uv.toFixed(1).replace(".", ",")} {uvLabel(nowDay.uv)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel-sm relative z-[1] rounded-2xl p-3">
            <stat.icon className="h-4 w-4 text-cyan-100/80" />
            <p className="mt-2 text-lg font-semibold leading-tight text-white">{stat.value}</p>
            <p className="text-[11px] text-white/55">{stat.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Sete dias · toque para abrir</p>
        <div className="space-y-2">
          {data.days.map((day, index) => {
            const selected = index === picked;
            return (
              <button
                key={day.date}
                type="button"
                aria-pressed={selected}
                onClick={() => setPicked(index)}
                className={
                  selected
                    ? "glass-panel relative z-[1] w-full rounded-[1.4rem] px-3 py-3 text-left"
                    : "glass-panel-sm relative z-[1] flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
                }
              >
                <span className="flex w-full items-center gap-3">
                  <span className="w-14 shrink-0 text-[13px] text-white/70">{day.label}</span>
                  <span className="w-6 text-center text-base" aria-hidden>
                    {day.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-white/85">{day.summary}</span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-cyan-200/80"
                        style={{ width: `${Math.max(4, Math.min(100, day.rain))}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-white">{Math.round(day.max)}°</span>
                    <span className="block text-[11px] text-white/45">{Math.round(day.min)}°</span>
                  </span>
                </span>
                {selected && (
                  <span className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 sm:grid-cols-3">
                    {[
                      ["Mínima", `${Math.round(day.min)}°`],
                      ["Máxima", `${Math.round(day.max)}°`],
                      ["Chuva", `${Math.round(day.rain)}%`],
                      ["Vento", `${Math.round(day.wind)} km/h`],
                      ["UV", `${day.uv.toFixed(1).replace(".", ",")} ${uvLabel(day.uv)}`],
                      ["Céu", day.summary],
                    ].map(([label, value]) => (
                      <span key={label} className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-[0.12em] text-white/40">
                          {label}
                        </span>
                        <span className="block text-[13px] font-medium leading-snug text-white">{value}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-white/40">Open-Meteo · Guarapari, previsão de 7 dias.</p>
    </div>
  );
}

function wavePath(series: number[]) {
  if (series.length < 2) return "";
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(0.15, max - min);
  return series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * 320;
      const y = 12 + (1 - (value - min) / span) * 56;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function mareTips(data: TideNow) {
  const bath =
    data.wave < 0.7
      ? { tone: "bom", text: "Banho confortável no raso entre os postos." }
      : data.wave < 1.3
        ? { tone: "cuidado", text: "Banho com atenção: ondas picadas no raso." }
        : { tone: "evitar", text: "Prefira a areia se a bandeira apertar." };

  const walk =
    data.trend === "Vazante"
      ? { tone: "bom", text: "Boa hora para caminhar na faixa molhada." }
      : { tone: "ok", text: "Faixa molhada mais estreita — caminhe perto do calçadão." };

  const fish =
    data.trend === "Enchente"
      ? { tone: "bom", text: "Enchente favorece a pesca de beira e pedra." }
      : { tone: "ok", text: "Mar em movimento: escolha pedras firmes e secas." };

  const photo =
    data.wave < 1.1
      ? { tone: "bom", text: "Mar mais limpo para foto na orla e no Marlin." }
      : { tone: "ok", text: "Espuma alta: use o costão e o pôr do sol a favor." };

  return [
    { icon: Waves, title: "Banho", ...bath },
    { icon: Footprints, title: "Caminhada", ...walk },
    { icon: Fish, title: "Pesca", ...fish },
    { icon: Camera, title: "Foto", ...photo },
  ] as const;
}

function toneClass(tone: string) {
  if (tone === "bom") return "!border-emerald-200/40 !bg-gradient-to-br !from-emerald-500/25 !to-[rgba(8,38,72,0.9)] text-emerald-50";
  if (tone === "cuidado") return "!border-amber-200/40 !bg-gradient-to-br !from-amber-400/25 !to-[rgba(8,38,72,0.9)] text-amber-50";
  if (tone === "evitar") return "!border-rose-200/40 !bg-gradient-to-br !from-rose-400/25 !to-[rgba(8,38,72,0.9)] text-rose-50";
  return "text-white";
}

function CompassDial({ deg, label }: { deg: number; label: string }) {
  const angle = bearingArrow(deg);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-sky-950/40 shadow-[0_8px_18px_-12px_rgba(3,20,40,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]">
        <span className="absolute top-1 z-[1] text-[9px] font-semibold text-white/45">N</span>
        <span
          className="absolute inset-0"
          style={{ transform: `rotate(${angle}deg)` }}
          aria-hidden
        >
          <span className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(165,243,252,0.65)]" />
        </span>
        <span className="relative z-[1] text-[11px] font-semibold text-white">{compass(deg)}</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
    </div>
  );
}

export function LiveMare() {
  const { data, failed } = useTide();

  if (!data) {
    return failed ? (
      <p className="text-sm text-white/70">
        A estação do mar não respondeu. Abra de novo em instantes para o nível e as ondas.
      </p>
    ) : (
      <Skeleton />
    );
  }

  const line = tidePath(data.series);
  const dot = tideDot(data.series);
  const waves = wavePath(data.waveSeries);
  const turns = [
    data.nextHigh ? ["Preamar", data.nextHigh.label, meters(data.nextHigh.level)] : null,
    data.nextLow ? ["Baixa-mar", data.nextLow.label, meters(data.nextLow.level)] : null,
  ].filter((item): item is [string, string, string] => item !== null);

  const span = Math.max(0.25, data.rangeMax - data.rangeMin);
  const fill = Math.max(0.08, Math.min(1, (data.level - data.rangeMin) / span));
  const tips = mareTips(data);
  const upcoming = data.extremes.slice(0, 5);
  const guaraTip =
    data.trend === "Enchente"
      ? "Na enchente a água sobe rápido no raso. Olhe a bandeira e fique onde o salva-vidas enxerga."
      : data.trend === "Vazante"
        ? "Na vazante o raso abre, mas a corrente ainda puxa. Criança sempre de mão dada."
        : "Mar estável agora. Mesmo assim, o posto manda mais do que o aspecto da água.";

  return (
    <div className="space-y-5">
      <div className="glass-panel relative z-[1] rounded-[1.4rem] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Nível do mar agora</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-serif text-5xl leading-none text-white">{meters(data.level)}</p>
          <p className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{data.trend}</p>
        </div>
        <p className="mt-2 text-[11px] text-white/45">Em relação ao nível médio do mar</p>
        <svg viewBox="0 0 320 92" className="mt-3 h-24 w-full" aria-hidden>
          <path d={line} fill="none" stroke="rgba(165,243,252,0.95)" strokeWidth="3" strokeLinecap="round" />
          <circle cx={dot.x} cy={dot.y} r="5" fill="white" />
        </svg>
        <p className="text-xs text-cyan-100/80">Ondas de {meters(data.wave)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {turns.map(([label, hour, height]) => (
          <div key={label} className="glass-panel-sm relative z-[1] rounded-2xl p-3">
            <p className="text-[11px] text-white/50">{label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{hour}</p>
            <p className="text-xs text-cyan-100/80">{height}</p>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 text-xs text-white/60">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {data.note}
      </p>

      {/* Régua viva da maré */}
      <div className="glass-panel relative z-[1] rounded-[1.4rem] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Régua da maré</p>
            <p className="mt-1 text-sm text-white/70">Onde estamos entre a baixa e a preamar desta janela.</p>
          </div>
          <Waves className="h-5 w-5 text-cyan-100/70" />
        </div>
        <div className="mt-4 flex items-end gap-4">
          <div className="relative h-36 w-14 overflow-hidden rounded-full border border-white/20 bg-[#06263a]/70">
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500 via-sky-300 to-cyan-100/90 transition-[height] duration-700"
              style={{ height: `${Math.round(fill * 100)}%` }}
            />
            <div className="absolute inset-x-1 top-[18%] h-px bg-white/25" />
            <div className="absolute inset-x-1 top-[50%] h-px bg-white/20" />
            <div className="absolute inset-x-1 top-[82%] h-px bg-white/25" />
            <span
              className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ bottom: `calc(${Math.round(fill * 100)}% - 5px)` }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/45">Preamar da janela</span>
              <span className="font-semibold text-white">{meters(data.rangeMax)}</span>
            </div>
            <div className="rounded-xl border border-cyan-100/35 bg-sky-950/45 px-3 py-2 shadow-[0_10px_22px_-14px_rgba(3,20,40,0.65),inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">Agora</p>
              <p className="text-lg font-semibold text-white">
                {meters(data.level)} · {data.trend}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/45">Baixa da janela</span>
              <span className="font-semibold text-white">{meters(data.rangeMin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pulsos do mar */}
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Pulso do mar agora</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              icon: Waves,
              label: "Onda",
              value: meters(data.wave),
              sub: `período ${data.wavePeriod.toFixed(1).replace(".", ",")} s`,
            },
            {
              icon: Thermometer,
              label: "Água",
              value: data.seaTemp != null ? `${data.seaTemp.toFixed(1).replace(".", ",")}°` : "—",
              sub: "temperatura da superfície",
            },
            {
              icon: Compass,
              label: "Direção",
              value: compass(data.waveDir),
              sub: `${Math.round(data.waveDir)}° · vinda da onda`,
            },
            {
              icon: Wind,
              label: "Corrente",
              value: `${data.currentSpeed.toFixed(1).replace(".", ",")} m/s`,
              sub: `rumo ${compass(data.currentDir)}`,
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel-sm relative z-[1] rounded-2xl p-3">
              <stat.icon className="h-4 w-4 text-cyan-100/80" />
              <p className="mt-2 text-lg font-semibold leading-tight text-white">{stat.value}</p>
              <p className="text-[11px] text-white/55">{stat.label}</p>
              <p className="mt-0.5 text-[10px] text-white/40">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Swell + bússolas */}
      <div className="glass-panel relative z-[1] rounded-[1.4rem] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Swell e rumo</p>
            <p className="mt-1 font-serif text-3xl leading-none text-white">{meters(data.swell)}</p>
            <p className="mt-2 text-xs text-white/55">
              Ondulação de fundo · período {data.swellPeriod.toFixed(1).replace(".", ",")} s
            </p>
          </div>
          <div className="flex gap-3">
            <CompassDial deg={data.waveDir} label="Onda" />
            <CompassDial deg={data.swellDir} label="Swell" />
          </div>
        </div>
        <svg viewBox="0 0 320 80" className="mt-3 h-16 w-full" aria-hidden>
          <path d={waves} fill="none" stroke="rgba(125,211,252,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-white/40">Altura das ondas nas próximas horas</p>
      </div>

      {/* Agenda */}
      {upcoming.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Agenda das marés</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {upcoming.map((item) => (
              <div
                key={`${item.kind}-${item.time}`}
                className="glass-panel-sm relative z-[1] min-w-[7.4rem] rounded-2xl px-3 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                  {item.kind === "high" ? "Preamar" : "Baixa-mar"}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">{item.label}</p>
                <p className="text-xs text-cyan-100/80">{meters(item.level)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Para você agora */}
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Para você agora</p>
        <div className="space-y-2">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className={`glass-panel-sm relative z-[1] flex items-start gap-3 rounded-2xl px-3 py-3 ${toneClass(tip.tone)}`}
            >
              <tip.icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{tip.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug opacity-85">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dica do Guará */}
      <div className="glass-panel relative z-[1] overflow-hidden rounded-[1.4rem] border-rose-200/35 bg-gradient-to-br from-rose-500/25 via-[rgba(8,38,72,0.88)] to-cyan-500/15 p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pins/guara-mascot.webp"
            alt=""
            width={72}
            height={96}
            className="h-16 w-12 object-contain drop-shadow-[0_8px_16px_rgba(127,29,29,0.35)]"
            draggable={false}
          />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-rose-100/70">Dica do Guará</p>
            <p className="mt-1 text-sm leading-relaxed text-white/85">{guaraTip}</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-white/40">Open-Meteo Marine · nível do mar e ondas na costa de Guarapari.</p>
    </div>
  );
}

export function FlagsLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-amber-200/30 bg-amber-300/15 p-3 text-left"
    >
      <span className="flex items-start">
        <span className="h-10 w-1 rounded-full bg-white/80" />
        <span className="ml-0.5 h-7 w-10 rounded-r-sm bg-[#facc15]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">Como ler as bandeiras</span>
        <span className="block text-xs text-white/65">Verde, amarela, vermelha, vigiada, roxa e preta.</span>
      </span>
      <ChevronRight className="h-4 w-4 text-white/70" />
    </button>
  );
}
