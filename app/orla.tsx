"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Ban, ChevronRight, Clock, Droplets, Sun, Trash2, Wind, X } from "lucide-react";
import { useState } from "react";
import { meters, tideDot, tidePath, useTide, useWeather, uvLabel, weatherMark } from "./coast";

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

function CloseButton({ onClose, light = false }: { onClose: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Fechar"
      onClick={onClose}
      className={
        light
          ? "grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-md"
          : "grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md"
      }
    >
      <X className="h-4 w-4" />
    </button>
  );
}

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
          layoutId="marlin-card"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpen("marlin")}
          style={{ borderRadius: 26 }}
          className="relative h-[176px] overflow-hidden border border-white/25 text-left shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
        >
          <img
            src={PHOTOS[0].src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#041018] via-[#041018]/25 to-transparent" />
          <span className="relative flex h-full flex-col justify-end p-3">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-white/70">
              Símbolo da orla
            </span>
            <span className="mt-1 block font-serif text-[1.35rem] leading-none text-white">
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
          layoutId="fotos-card"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpen("fotos")}
          style={{ borderRadius: 26 }}
          className="relative h-[176px] overflow-hidden border border-white/25 text-left shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
        >
          <img
            src={BEACH[0].src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#102033] via-[#102033]/15 to-transparent" />
          <span className="absolute right-2 top-2 flex -space-x-2">
            {BEACH.slice(1, 4).map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt=""
                className="h-8 w-8 rounded-full border border-white/80 object-cover"
              />
            ))}
          </span>
          <span className="relative flex h-full items-end justify-between gap-2 p-3">
            <span className="font-serif text-[1.35rem] leading-[1.05] text-white">Praia do Morro</span>
            <span className="shrink-0 -translate-x-2 text-[10px] uppercase tracking-[0.16em] text-sky-50/80">
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
      layoutId="marlin-card"
      transition={spring}
      style={{ borderRadius: 32 }}
      className="absolute inset-0 z-40 overflow-hidden bg-[#061018]"
    >
      <div className="no-scrollbar h-full overflow-x-hidden overflow-y-auto">
        <div className="relative h-[300px]">
          <img
            src={PHOTOS[1].src}
            alt="Marlin Azul no pôr do sol da Praia do Morro"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#061018] via-[#061018]/10 to-black/30" />
          <div className="absolute right-4 top-4">
            <CloseButton onClose={onClose} light />
          </div>
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
      layoutId="fotos-card"
      transition={spring}
      style={{ borderRadius: 32 }}
      className="absolute inset-0 z-40 overflow-hidden bg-[#07131c]"
    >
      <div className="no-scrollbar h-full overflow-x-hidden overflow-y-auto">
        <div className="relative h-[300px]">
          <img
            src={BEACH[0].src}
            alt={BEACH[0].caption}
            className="h-full w-full object-cover object-[center_55%]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#07131c] via-transparent to-black/25" />
          <div className="absolute right-4 top-4">
            <CloseButton onClose={onClose} light />
          </div>
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
            <div className="absolute right-4 top-4">
              <CloseButton onClose={() => setZoom(null)} light />
            </div>
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
      className="absolute inset-0 z-40 overflow-hidden bg-[#07140c]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={spring}
      role="dialog"
      aria-label="Bandeiras de sinalização"
    >
      <div className="flex items-start justify-between px-5 pb-2 pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">Sinalização</p>
          <h2 className="font-serif text-3xl leading-none text-white">Bandeiras</h2>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <div className="no-scrollbar h-[calc(100%-88px)] space-y-2.5 overflow-y-auto px-5 pb-8">
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
    <div className="space-y-4">
      <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 text-center backdrop-blur-md">
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
          <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
            <stat.icon className="h-4 w-4 text-yellow-100/80" />
            <p className="mt-2 text-lg font-semibold leading-tight text-white">{stat.value}</p>
            <p className="text-[11px] text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Sete dias · toque para abrir</p>
        <div className="space-y-1.5">
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
                    ? "w-full rounded-2xl border border-white/30 bg-white/15 px-3 py-2.5 text-left"
                    : "flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left"
                }
              >
                <span className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-[13px] text-white/70">{day.label}</span>
                  <span className="w-6 text-center text-base" aria-hidden>
                    {day.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-white/80">{day.summary}</span>
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
                  <span className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                    {[
                      ["Mínima", `${Math.round(day.min)}°`],
                      ["Chuva", `${Math.round(day.rain)}%`],
                      ["Vento", `${Math.round(day.wind)} km/h`],
                      ["UV", `${day.uv.toFixed(1).replace(".", ",")} ${uvLabel(day.uv)}`],
                      ["Máxima", `${Math.round(day.max)}°`],
                      ["Céu", day.summary],
                    ].map(([label, value]) => (
                      <span key={label} className="min-w-0">
                        <span className="block truncate text-[10px] uppercase tracking-[0.12em] text-white/40">
                          {label}
                        </span>
                        <span className="block truncate text-[13px] font-medium text-white">{value}</span>
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
  const turns = [
    data.nextHigh ? ["Preamar", data.nextHigh.label, meters(data.nextHigh.level)] : null,
    data.nextLow ? ["Baixa-mar", data.nextLow.label, meters(data.nextLow.level)] : null,
  ].filter((item): item is [string, string, string] => item !== null);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
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
          <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
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
