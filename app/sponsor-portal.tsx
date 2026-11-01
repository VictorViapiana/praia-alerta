"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  BadgeCheck,
  Clock3,
  Gift,
  MapPinned,
  Music2,
  Share2,
  ShowerHead,
  Sparkles,
  Star,
  UtensilsCrossed,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GuaraPose } from "./guara-pose";
import type { GuaraPoseId } from "./guara-poses";
import type { PerkId, Place, SponsorOffer } from "./places";
import { RouteChoice } from "./route-choice";
import { hourInSaoPaulo, skyPhaseAt, type SkyPhase } from "./sky-phase";

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };
const STAMP_KEY = "pa-sponsor-stamps-v1";
const HOLD_MS = 15 * 60 * 1000;

type TabId = "cardapio" | "agora" | "presente" | "ir";

const TABS: { id: TabId; label: string; icon: typeof UtensilsCrossed }[] = [
  { id: "cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { id: "agora", label: "Agora", icon: Waves },
  { id: "presente", label: "Presente", icon: Gift },
  { id: "ir", label: "Ir", icon: MapPinned },
];

const PERK_META: Record<PerkId, { label: string; icon: typeof Wifi }> = {
  shower: { label: "Chuveiro", icon: ShowerHead },
  wifi: { label: "Wi-Fi", icon: Wifi },
  access: { label: "Acesso", icon: Accessibility },
  music: { label: "Música", icon: Music2 },
};

const PHASE_LABEL: Record<SkyPhase, string> = {
  dawn: "Nascer do sol",
  day: "Dia na orla",
  dusk: "Pôr do sol",
  night: "Noite na orla",
};

const PHASE_END: Record<SkyPhase, number> = {
  dawn: 7.5,
  day: 16.5,
  dusk: 19,
  night: 29, // 5h next day → treat as 5+24
};

function placeMark(name: string) {
  const label = (name.split("·")[1] ?? name).trim();
  const words = label.split(/\s+/).filter((word) => !/^(d[aeo]s?|e)$/i.test(word));
  const letters = words.map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return letters.length > 1 ? letters : label.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function readStamps(): string[] {
  try {
    const raw = localStorage.getItem(STAMP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeStamps(ids: string[]) {
  try {
    localStorage.setItem(STAMP_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

function housePulse(hour: number): { level: number; label: string; hint: string } {
  if (hour < 9) return { level: 0.18, label: "Ainda acordando", hint: "Mesa fácil, café e brisa." };
  if (hour < 12) return { level: 0.42, label: "Movimento leve", hint: "Bom pra chegar sem fila." };
  if (hour < 15) return { level: 0.72, label: "Casa quente", hint: "Almoço no auge — reserve." };
  if (hour < 18) return { level: 0.88, label: "Pico da orla", hint: "Muita gente na areia agora." };
  if (hour < 21) return { level: 0.78, label: "Fim de tarde cheio", hint: "Som, mesa e pôr do sol." };
  return { level: 0.48, label: "Noite calma", hint: "Clima mais intimista." };
}

function msUntilPhaseEnd(phase: SkyPhase, hour: number) {
  let end = PHASE_END[phase];
  if (phase === "night" && hour < 5) end = 5;
  const remainH = Math.max(0, end - hour);
  return remainH * 60 * 60 * 1000;
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function openWhatsApp(phone: string | undefined, text: string) {
  const encoded = encodeURIComponent(text);
  const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function guaraForPhase(phase: SkyPhase): GuaraPoseId {
  if (phase === "night") return "noite";
  if (phase === "dusk") return "festa";
  if (phase === "dawn") return "clima";
  return "clima";
}

function activeOffer(place: Place, phase: SkyPhase): SponsorOffer | null {
  return place.offers?.[phase] ?? place.offers?.day ?? null;
}

export function SponsorSheet({ place, onClose }: { place: Place; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("agora");
  const [stamps, setStamps] = useState<string[]>([]);
  const [justStamped, setJustStamped] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const initials = placeMark(place.name);
  const sky = skyPhaseAt(new Date(now));
  const hour = hourInSaoPaulo(new Date(now));
  const pulse = housePulse(hour);
  const offer = activeOffer(place, sky.phase);
  const offerRemain = msUntilPhaseEnd(sky.phase, hour);
  const stamped = stamps.includes(place.id);
  const stampCount = stamps.length;

  useEffect(() => {
    setStamps(readStamps());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!holdUntil) return;
    if (now >= holdUntil) setHoldUntil(null);
  }, [now, holdUntil]);

  const holdLeft = holdUntil ? Math.max(0, holdUntil - now) : 0;

  const passportProgress = useMemo(() => Math.min(1, stampCount / 3), [stampCount]);

  function collectStamp() {
    if (stamped) {
      setGiftOpen(true);
      return;
    }
    const next = Array.from(new Set([...stamps, place.id]));
    writeStamps(next);
    setStamps(next);
    setJustStamped(true);
    setGiftOpen(true);
    window.setTimeout(() => setJustStamped(false), 2200);
  }

  function holdTable() {
    const until = Date.now() + HOLD_MS;
    setHoldUntil(until);
    setTab("ir");
    openWhatsApp(
      place.phone,
      `Olá! Vim pelo Praia Alerta Alegretto e quero segurar uma mesa em ${place.name} pelos próximos 15 minutos. Nome na reserva: (seu nome).`,
    );
  }

  function callWhatsApp(extra?: string) {
    const giftLine = place.gift && stamped ? ` Código do presente: ${place.gift.code}.` : "";
    const offerLine = offer ? ` Vi a oferta "${offer.title}" (código ${offer.code}).` : "";
    openWhatsApp(
      place.phone,
      `Oi! Cheguei pelo Praia Alerta em ${place.name}.${offerLine}${giftLine}${extra ? ` ${extra}` : ""}`,
    );
  }

  async function sharePlace() {
    const text = `${place.name} na Praia do Morro — patrocinador do Praia Alerta Alegretto.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      data-map-ui
      className="absolute inset-0 z-[110]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-label={place.name}
        className="absolute inset-x-0 bottom-0 flex h-[min(92%,52rem)] flex-col overflow-hidden rounded-t-[28px] bg-[#120c08] shadow-[0_-24px_60px_rgba(0,0,0,0.45)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.span
            className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-orange-500/15 blur-3xl"
            animate={{ opacity: [0.25, 0.55, 0.25], x: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative h-[132px] shrink-0">
          <img src={place.cover} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-[#120c08]/25 to-black/30" />
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
          <motion.span
            className="absolute -bottom-5 left-4 grid h-14 w-14 place-items-center rounded-2xl border-2 border-amber-200 bg-[#1c1208] text-sm font-semibold text-amber-100 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            animate={justStamped ? { scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] } : {}}
            transition={{ duration: 0.7 }}
          >
            {initials || "PA"}
          </motion.span>
          {stamped && (
            <span className="absolute -bottom-3 left-[4.6rem] inline-flex items-center gap-1 rounded-full border border-amber-200/40 bg-amber-300/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-50 backdrop-blur-md">
              <BadgeCheck className="h-3 w-3 text-amber-200" />
              Selo do Guará
            </span>
          )}
        </div>

        <div className="relative px-4 pb-2 pt-8">
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Portal do patrocinador
          </p>
          <h2 className="mt-1 font-serif text-[1.55rem] leading-none text-white">{place.name}</h2>
          <p className="mt-1 text-xs text-white/55">{place.hours}</p>
          {place.tag && (
            <p className="mt-2 inline-flex rounded-full border border-amber-200/30 bg-amber-300/10 px-2.5 py-1 text-[11px] text-amber-50">
              {place.tag}
            </p>
          )}

          <div
            role="tablist"
            aria-label="Seções da casa"
            className="mt-3.5 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-black/35 p-1"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                    active ? "text-[#3a2208]" : "text-white/55"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sponsor-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-200 to-orange-300 shadow-[0_8px_18px_rgba(251,191,36,0.25)]"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-4 pb-28">
          <AnimatePresence mode="wait">
            {tab === "cardapio" && (
              <motion.div
                key="cardapio"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {place.about && <p className="text-sm leading-snug text-white/75">{place.about}</p>}

                {place.moments && place.moments.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-white/40">Momentos da casa</p>
                    <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                      {place.moments.map((moment, index) => (
                        <motion.article
                          key={moment.caption}
                          className="relative h-[118px] w-[148px] shrink-0 overflow-hidden rounded-2xl border border-white/10"
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.06 }}
                        >
                          <motion.img
                            src={moment.photo}
                            alt=""
                            className="h-full w-full object-cover"
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 8 + index, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                          <p className="absolute inset-x-2 bottom-2 text-[11px] font-medium leading-tight text-white">
                            {moment.caption}
                          </p>
                        </motion.article>
                      ))}
                    </div>
                  </>
                )}

                <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-white/40">Top 3 do cardápio</p>
                <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                  {place.menu?.map((item) => (
                    <article
                      key={item.name}
                      className="w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                      <img src={item.photo} alt="" className="h-[92px] w-full object-cover" />
                      <div className="px-2.5 py-2">
                        <p className="text-[12px] font-semibold leading-tight text-white">{item.name}</p>
                        <p className="mt-1 text-[12px] font-medium text-amber-200">{item.price}</p>
                      </div>
                    </article>
                  ))}
                </div>

                {place.perks && place.perks.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-white/40">No lugar</p>
                    <div className="flex flex-wrap gap-2">
                      {place.perks.map((perk) => {
                        const meta = PERK_META[perk];
                        const Icon = meta.icon;
                        return (
                          <span
                            key={perk}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 text-[11px] text-white/80"
                          >
                            <Icon className="h-3.5 w-3.5 text-amber-100" />
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {tab === "agora" && (
              <motion.div
                key="agora"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-3.5"
              >
                <div className="overflow-hidden rounded-[22px] border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-white/5 to-orange-500/10 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/80">
                        Pulso da casa
                      </p>
                      <p className="mt-1 text-[1.05rem] font-semibold text-white">{pulse.label}</p>
                      <p className="mt-0.5 text-[12px] text-white/65">{pulse.hint}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[10px] text-white/70">
                      <Clock3 className="h-3 w-3" />
                      {PHASE_LABEL[sky.phase]}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/35">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(pulse.level * 100)}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    />
                  </div>
                  <motion.p
                    className="mt-2 text-[11px] text-amber-50/70"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  >
                    Ao vivo · horário de Guarapari
                  </motion.p>
                </div>

                <div className="flex gap-3 rounded-[22px] border border-white/10 bg-white/5 p-3">
                  <GuaraPose pose={guaraForPhase(sky.phase)} className="h-[72px] w-[72px] shrink-0 drop-shadow-lg" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                      Guará sussurra
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-white/85">
                      {place.guaraTip ?? "Vale a visita — é casa de patrocinador da orla."}
                    </p>
                  </div>
                </div>

                {offer && (
                  <div className="relative overflow-hidden rounded-[22px] border border-amber-200/35 bg-[#1c1208] p-3.5">
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent"
                      animate={{ x: ["-140%", "240%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                    />
                    <div className="relative flex items-start justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                          <Sparkles className="h-3 w-3" />
                          Oferta da maré
                        </p>
                        <p className="mt-1 text-[1.05rem] font-semibold text-white">{offer.title}</p>
                        <p className="mt-1 text-[12px] leading-snug text-white/70">{offer.detail}</p>
                      </div>
                      <div className="rounded-xl border border-amber-200/30 bg-amber-300/10 px-2.5 py-2 text-center">
                        <p className="text-[9px] uppercase tracking-wide text-amber-100/70">Expira</p>
                        <p className="font-mono text-[13px] font-bold text-amber-100">{formatRemain(offerRemain)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => callWhatsApp(`Quero a oferta ${offer.code}.`)}
                      className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 to-orange-300 py-2.5 text-[13px] font-semibold text-[#3a2208]"
                    >
                      Usar código {offer.code}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "presente" && (
              <motion.div
                key="presente"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-3.5"
              >
                <div className="rounded-[22px] border border-amber-200/30 bg-gradient-to-b from-amber-300/20 to-transparent p-4 text-center">
                  <GuaraPose pose="festa" className="mx-auto h-24 w-24 drop-shadow-[0_12px_24px_rgba(251,191,36,0.35)]" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Passaporte da orla
                  </p>
                  <h3 className="mt-1 font-serif text-[1.35rem] leading-none text-white">Selo do Guará</h3>
                  <p className="mx-auto mt-2 max-w-[18rem] text-[12px] leading-snug text-white/70">
                    Toque para carimbar esta casa no seu celular. Três selos e você vira Amigo da Orla.
                  </p>

                  <div className="mx-auto mt-3 h-2 max-w-[14rem] overflow-hidden rounded-full bg-black/40">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-200 to-orange-400"
                      animate={{ width: `${Math.round(passportProgress * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-amber-50/75">
                    {stampCount}/3 selos · {stampCount >= 3 ? "Amigo da Orla desbloqueado" : "colecione nas casas"}
                  </p>

                  <button
                    type="button"
                    onClick={collectStamp}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 px-5 py-3 text-sm font-semibold text-[#3a2208] shadow-[0_12px_28px_rgba(251,191,36,0.28)]"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {stamped ? "Ver meu presente" : "Carimbar selo agora"}
                  </button>
                </div>

                <AnimatePresence>
                  {giftOpen && place.gift && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="overflow-hidden rounded-[22px] border border-amber-200/40 bg-[#1a1008] p-4"
                    >
                      <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                        <Gift className="h-3 w-3" />
                        Presente exclusivo
                      </p>
                      <p className="mt-1 text-[1.1rem] font-semibold text-white">{place.gift.title}</p>
                      <p className="mt-1 text-[13px] leading-snug text-white/70">{place.gift.detail}</p>
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-amber-200/45 bg-amber-300/10 px-3 py-2.5">
                        <span className="font-mono text-[1.05rem] font-bold tracking-[0.18em] text-amber-100">
                          {place.gift.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => callWhatsApp(`Meu código do presente é ${place.gift!.code}.`)}
                          className="rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-semibold text-[#04210f]"
                        >
                          Enviar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {tab === "ir" && (
              <motion.div
                key="ir"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <button
                  type="button"
                  onClick={holdTable}
                  className="relative w-full overflow-hidden rounded-[22px] border border-amber-200/30 bg-gradient-to-br from-orange-400/25 to-amber-200/10 p-4 text-left"
                >
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }}
                    transition={{ duration: 3.2, repeat: Infinity }}
                  />
                  <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                    Mesa mágica
                  </p>
                  <p className="relative mt-1 text-[1.1rem] font-semibold text-white">
                    {holdLeft > 0 ? "Mesa segurada" : "Segurar mesa 15 min"}
                  </p>
                  <p className="relative mt-1 text-[12px] text-white/65">
                    {holdLeft > 0
                      ? `Válida por mais ${formatRemain(holdLeft)} — já abrimos o WhatsApp da casa.`
                      : "Reservamos mentalmente sua mesa e abrimos o WhatsApp com a mensagem pronta."}
                  </p>
                  {holdLeft > 0 && (
                    <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-black/35">
                      <motion.div
                        className="h-full rounded-full bg-amber-300"
                        animate={{ width: `${Math.round((holdLeft / HOLD_MS) * 100)}%` }}
                      />
                    </div>
                  )}
                </button>

                <RouteChoice place={{ id: place.id, lat: place.lat, lng: place.lng, name: place.name }} tone="sheet" />

                <button
                  type="button"
                  onClick={() => sharePlace()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white/85"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar esta casa
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#120c08]/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => callWhatsApp()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-[#04210f]"
          >
            Chamar no WhatsApp
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
