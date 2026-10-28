"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Baby,
  LifeBuoy,
  LocateFixed,
  MapPin,
  Phone as PhoneIcon,
  RotateCcw,
  ShieldAlert,
  Sun,
  Volume2,
  Waves,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CriancaModal } from "./crianca-perdida";
import { fold, useTide, useWeather } from "./coast";
import { requestCompass, useDeviceHeading } from "./heading-beam";
import { MapSearch, type MapMark } from "./map-search";
import { AmbulanteSheet, EscunaSheet, SponsorSheet } from "./marker-popup";
import { FlagsLink, FotosScreen, LiveClima, LiveMare, MarlinScreen, OrlaCards, FlagsScreen, type StoryId } from "./orla";
import { AMBULANTES, MARLIN, MARLIN_SPEAK, MARLIN_TIPS, PLACES, SHOWERS } from "./places";
import type { PinKind } from "./page-types";
import { CameraFab, TouristCamera } from "./tourist-camera";
import { GuaraOnboarding, HOME_STEPS, HOME_TOUR_KEY, MAP_STEPS, MAP_TOUR_KEY } from "./guara-onboarding";
import { GuaraMapChat } from "./guara-map";
import { HOME_PROMPTS, answerGuara } from "./guara-guide";
import { RouteActionsProvider, RouteChoice } from "./route-choice";
import { useRampWatch } from "./rampa-sentinel";
import { RAMPA_RULE, RAMPA_WARN } from "./rampas";
import { speakGuara, stopSpeaking } from "./voice";
import { NavDrive } from "./nav-drive";
import { MissionModal, MissionTrigger } from "./mission-modal";
import { CloseButton, closeTopClass, screenEnter, useEdgeSwipeBack } from "./nav-chrome";
import { SplashScreen } from "./splash";
import { CALL_OUT, followRoute, formatDistance, formatWalk, metersBetween, modeLabel, nextManeuvers, OFF_ROUTE, planRoute, routeIntro, routeSurface, type TravelMode, type WalkPoint, type WalkRoute } from "./walk-route";

const BeachMap = dynamic(() => import("./beach-map").then((mod) => mod.BeachMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#2c3832]" />,
});

type FeatureId = "mare" | "clima" | "crianca" | "alertas";
type MapFilter = "neutro" | PinKind;

type Feature = {
  id: FeatureId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  wash: string;
};

const FEATURES: Feature[] = [
  {
    id: "mare",
    title: "Maré Agora",
    subtitle: "nível e ondas",
    icon: Waves,
    color: "text-cyan-300",
    glow: "drop-shadow(0 0 12px rgba(34,211,238,0.95))",
    wash: "rgba(34,211,238,0.4)",
  },
  {
    id: "clima",
    title: "Clima",
    subtitle: "7 dias",
    icon: Sun,
    color: "text-yellow-300",
    glow: "drop-shadow(0 0 12px rgba(250,204,21,0.95))",
    wash: "rgba(250,204,21,0.42)",
  },
  {
    id: "crianca",
    title: "Criança Perdida",
    subtitle: "Perdi ou achei",
    icon: Baby,
    color: "text-orange-300",
    glow: "drop-shadow(0 0 12px rgba(251,146,60,0.95))",
    wash: "rgba(251,146,60,0.42)",
  },
  {
    id: "alertas",
    title: "Alertas",
    subtitle: "2 ativos",
    icon: ShieldAlert,
    color: "text-purple-300",
    glow: "drop-shadow(0 0 12px rgba(192,132,252,0.95))",
    wash: "rgba(168,85,247,0.42)",
  },
];

const GUARA_SPEECH = "Oi, sou o Guará! Como posso te ajudar na Praia do Morro hoje?";
const INTRO = GUARA_SPEECH;

const MAP_FILTERS: { id: MapFilter; label: string; emoji: string; hint: string }[] = [
  {
    id: "neutro",
    label: "Vista",
    emoji: "◌",
    hint: "Vista da orla, sem comércio em destaque.",
  },
  {
    id: "quiosques",
    label: "Quiosques",
    emoji: "🍹",
    hint: "Quiosques na areia, na frente de quem caminha no calçadão.",
  },
  {
    id: "ambulantes",
    label: "Ambulantes",
    emoji: "🧺",
    hint: "Só os ambulantes credenciados que estão na areia agora.",
  },
  {
    id: "duchas",
    label: "Duchas",
    emoji: "🚿",
    hint: "Duchas no calçadão, ao lado de quem está passeando.",
  },
  {
    id: "hoteis",
    label: "Hotéis",
    emoji: "🏨",
    hint: "Hotéis na avenida, atrás da praia.",
  },
  {
    id: "sorveterias",
    label: "Sorvetes",
    emoji: "🍦",
    hint: "Sorveterias na avenida. Um tipo de parceria com o comércio da orla.",
  },
  {
    id: "parceiros",
    label: "Parceiros",
    emoji: "🤝",
    hint: "Restaurante e farmácia na avenida. A orla cabe vários tipos de comércio.",
  },
];

const cardSpring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.86 };
const islandSpring = { type: "spring" as const, stiffness: 460, damping: 36, mass: 0.72 };

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 420, damping: 30 },
  },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function speakPortuguese(text: string, onEnd: () => void) {
  speakGuara(text, onEnd);
}

function useTypewriter(text: string, speed = 32) {
  const [typed, setTyped] = useState(text);

  useEffect(() => {
    if (text === INTRO) {
      setTyped(text);
      return;
    }
    setTyped("");
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  return typed;
}

function OceanWash({ urgent = false, paused = false }: { urgent?: boolean; paused?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(125%_85%_at_50%_115%,#0f5968_0%,#0a3142_38%,#07131d_100%)]" />
      {paused ? null : (
      <>
      <motion.div
        className="absolute -right-10 -top-8 h-64 w-64 rounded-full blur-3xl"
        animate={
          paused
            ? { backgroundColor: urgent ? "rgba(239,68,68,0.38)" : "rgba(251,191,36,0.28)" }
            : {
                backgroundColor: urgent ? "rgba(239,68,68,0.38)" : "rgba(251,191,36,0.28)",
                x: [0, -18, 8, 0],
                y: [0, 16, -6, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{
          backgroundColor: { duration: 0.45 },
          x: { duration: 16, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 16, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 16, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute -left-16 top-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
        animate={paused ? undefined : { x: [0, 26, -8, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-12%] left-1/4 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl"
        animate={paused ? { opacity: urgent ? 0.25 : 0.8 } : { y: [0, -18, 0], opacity: urgent ? 0.25 : 0.8 }}
        transition={{
          y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.4 },
        }}
      />
      <motion.svg
        aria-hidden
        viewBox="0 0 1440 140"
        className="absolute -bottom-2 left-0 h-28 w-[210%] opacity-40"
        animate={paused ? undefined : { x: [0, -160, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          fill="rgba(125,211,252,0.28)"
          d="M0 78C140 110 250 30 420 62C590 94 690 28 860 64C1030 100 1140 36 1320 70C1420 88 1480 60 1560 72L1560 140L0 140Z"
        />
        <path
          fill="rgba(255,214,140,0.12)"
          d="M0 96C180 70 300 120 480 98C680 74 760 112 960 92C1160 72 1280 116 1440 90L1440 140L0 140Z"
        />
      </motion.svg>
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.38)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent" />
      </>
      )}
    </div>
  );
}

function Stage({ urgent, paused = false }: { urgent: boolean; paused?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_20%,#16384a_0%,#07141e_46%,#03080d_100%)]" />
      {paused ? null : (
      <>
      <motion.div
        className="absolute right-[8%] top-[14%] h-48 w-48 rounded-full blur-2xl"
        animate={
          paused
            ? { backgroundColor: urgent ? "rgba(248,113,113,0.55)" : "rgba(253,224,171,0.78)" }
            : {
                backgroundColor: urgent ? "rgba(248,113,113,0.55)" : "rgba(253,224,171,0.78)",
                scale: [1, 1.06, 1],
              }
        }
        transition={{
          backgroundColor: { duration: 0.5 },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ boxShadow: "0 0 90px 46px rgba(251,191,36,0.18)" }}
      />
      <motion.div
        className="absolute -left-24 bottom-[8%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl"
        animate={paused ? undefined : { x: [0, 40, 0], y: [0, -24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-6rem] top-1/2 h-[22rem] w-[22rem] rounded-full bg-amber-400/10 blur-3xl"
        animate={paused ? undefined : { y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="grain absolute inset-0 opacity-[0.18] mix-blend-overlay" />
      </>
      )}
    </div>
  );
}

function Caret() {
  return (
    <motion.span
      aria-hidden
      className="ml-0.5 inline-block h-3.5 w-px translate-y-[2px] bg-white/80"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((bar) => (
        <motion.span
          key={bar}
          className="w-[3px] rounded-full bg-[#ff8d7a]"
          animate={{ height: [5, 16, 7, 13, 5] }}
          transition={{
            duration: 0.85,
            repeat: Infinity,
            delay: bar * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function GuaraIsland({ onReplay, onMission }: { onReplay: () => void; onMission: () => void }) {
  const { data: weather } = useWeather();
  const { data: tide } = useTide();
  const [open, setOpen] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [line, setLine] = useState(INTRO);
  const [picked, setPicked] = useState<string | null>(null);
  const typed = useTypewriter(line, line === INTRO ? 28 : 18);
  const alive = useRef(true);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const prime = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", prime);
    return () => {
      alive.current = false;
      window.speechSynthesis?.removeEventListener("voiceschanged", prime);
      window.speechSynthesis?.cancel();
      stopSpeaking();
    };
  }, []);

  const finishSpeech = () => {
    if (alive.current) setNarrating(false);
  };

  const say = (text: string) => {
    setNarrating(true);
    speakPortuguese(text, finishSpeech);
  };

  const toggle = () => {
    if (open) {
      window.speechSynthesis?.cancel();
      stopSpeaking();
      setNarrating(false);
      setOpen(false);
      return;
    }
    setOpen(true);
    say(GUARA_SPEECH);
  };

  return (
    <div className="relative z-20 px-3 pt-2">
      <motion.div
        layout
        transition={{ layout: islandSpring }}
        className="sheen relative overflow-hidden rounded-[1.65rem] border border-white/25 bg-white/[0.13] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)] backdrop-blur-md"
      >
        <div
          className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-[#ff6b57]/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-6 top-0 h-24 w-24 rounded-full bg-cyan-300/15 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-stretch gap-2.5 p-2.5 pb-2">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="Falar com o Guará"
            className="relative grid h-[3.35rem] w-[3.35rem] shrink-0 place-items-center self-center rounded-2xl border border-white/20 bg-gradient-to-b from-white/20 to-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[#ff6b57]/15 blur-[1px]" />
            <img
              src="/guara.png?v=3"
              alt=""
              draggable={false}
              decoding="async"
              className="guara-float relative h-10 w-auto select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-[#071820] bg-black">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.95)]" />
            </span>
          </button>

          <button
            type="button"
            onClick={toggle}
            className="min-w-0 flex-1 rounded-2xl px-1 py-0.5 text-left"
            aria-expanded={open}
          >
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Guará · guia da orla
              </p>
              {narrating ? (
                <Equalizer />
              ) : (
                <span className="rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
                  {open ? "Toque p/ fechar" : "Toque p/ falar"}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] font-medium leading-snug text-white">
              {typed}
              {typed.length < line.length && <Caret />}
            </p>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="guara-panel"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={islandSpring}
              className="overflow-hidden"
            >
              <div className="max-h-[min(20rem,42dvh)] space-y-2 overflow-y-auto border-t border-white/10 px-2.5 pb-2.5 pt-2">
                <div className="flex items-center justify-between px-0.5 text-[11px] text-white/55">
                  <span>Pergunte ao Guará</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (narrating) {
                        stopSpeaking();
                        setNarrating(false);
                        return;
                      }
                      say(line);
                    }}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]",
                      narrating
                        ? "border-[#ff6b57]/40 bg-[#ff6b57]/20 text-white"
                        : "border-white/15 bg-white/10 text-white/80",
                    )}
                  >
                    <Volume2 className="h-3 w-3" />
                    {narrating ? "Pausar" : "Ouvir"}
                  </button>
                </div>

                {picked && (
                  <div className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{picked}</p>
                    <p className="mt-1 text-[13px] leading-snug text-white/95">{line}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  {HOME_PROMPTS.map((prompt, index) => (
                    <motion.button
                      key={prompt.label}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...islandSpring, delay: 0.04 * index }}
                      onClick={() => {
                        const guide = answerGuara(prompt.ask, { tide, weather });
                        setPicked(prompt.label);
                        setLine(guide.answer);
                        say(guide.answer);
                      }}
                      className={cx(
                        "flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-left text-[12px] text-white/90",
                        picked === prompt.label
                          ? "border-[#ff6b57]/50 bg-[#ff6b57]/20"
                          : "border-white/15 bg-black/20",
                      )}
                    >
                      <span aria-hidden className="text-base leading-none">
                        {prompt.emoji}
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">{prompt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative grid grid-cols-2 gap-1.5 border-t border-white/10 bg-black/25 p-2">
          <MissionTrigger variant="rail" onOpen={onMission} />
          <button
            type="button"
            onClick={onReplay}
            aria-label="Refazer tutorial"
            className="flex min-h-[2.6rem] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-3 py-2 text-left transition hover:border-white/30 hover:bg-white/12"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white/85">
              <RotateCcw className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold leading-none text-white">Passeio</span>
              <span className="mt-0.5 block text-[9px] leading-none text-white/55">Refazer tutorial</span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureGlyph({
  feature,
  size = "h-11 w-11",
}: {
  feature: Feature;
  size?: string;
}) {
  const Icon = feature.icon;
  return (
    <Icon
      className={cx(size, feature.color)}
      style={{ filter: feature.glow }}
      strokeWidth={1.7}
    />
  );
}

function FeatureCard({
  feature,
  onOpen,
}: {
  feature: Feature;
  onOpen: (id: FeatureId) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.975 }}
      transition={cardSpring}
      onClick={() => onOpen(feature.id)}
      style={{ borderRadius: 26 }}
      className="group relative flex h-[122px] flex-col justify-between overflow-hidden border border-white/20 bg-white/10 p-3.5 text-left shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md"
      data-onboard={feature.id}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: feature.wash }}
      />
      {feature.id === "alertas" && (
        <span className="absolute right-3.5 top-3.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-300 opacity-80" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-purple-100" />
        </span>
      )}
      <span className="relative inline-flex w-fit">
        <FeatureGlyph feature={feature} />
      </span>
      <span className="relative">
        <span className="block text-[15px] font-semibold leading-tight text-white">
          {feature.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-white/60">{feature.subtitle}</span>
      </span>
    </motion.button>
  );
}

function SheetShell({
  feature,
  onClose,
  children,
}: {
  feature: Feature;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      {...screenEnter}
      style={{ borderRadius: 0 }}
      className="absolute inset-0 z-40 overflow-hidden border-0 bg-[#071820]/92 shadow-2xl backdrop-blur-2xl"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: feature.wash }}
      />
      <div
        className="relative flex items-center gap-3 px-5 pb-1 pr-16"
        style={{ paddingTop: "max(1.1rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))" }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10">
          <FeatureGlyph feature={feature} size="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[1.35rem] font-semibold leading-none text-white">{feature.title}</h2>
          <p className="mt-1 text-xs text-white/55">{feature.subtitle}</p>
        </div>
      </div>
      <CloseButton onClose={onClose} className={closeTopClass} />
      <div className="no-scrollbar relative h-[calc(100%-5.5rem)] overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {children}
      </div>
    </motion.div>
  );
}

function CoastMap() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#e7eef2]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/36612/25397)" }}
      />
    </div>
  );
}

function MapSos({ onTrigger, parked = false }: { onTrigger: () => void; parked?: boolean }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const hold = 1200;

  const cancel = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    origin.current = null;
    setProgress(0);
  };

  const tick = (started: number) => {
    const step = (now: number) => {
      const next = Math.min(1, (now - started) / hold);
      setProgress(next);
      if (next >= 1) {
        frame.current = 0;
        origin.current = null;
        navigator.vibrate?.(28);
        onTrigger();
        setProgress(0);
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  return (
    <div
      className="absolute left-3 z-[70]"
      style={{
        top: parked
          ? "max(10.4rem, calc(env(safe-area-inset-top, 0px) + 8.6rem))"
          : "max(4.45rem, calc(env(safe-area-inset-top, 0px) + 3.55rem))",
      }}
    >
      <button
        type="button"
        data-map-ui
        aria-label="Segure para acionar emergência"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          origin.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
          tick(performance.now());
        }}
        onPointerMove={(event) => {
          const start = origin.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (dx * dx + dy * dy > 14 * 14) cancel();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        className="relative grid h-14 w-14 place-items-center rounded-full border border-red-100/30 bg-black/55 text-white shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-md"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden>
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#fecaca"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={150.8}
            strokeDashoffset={150.8 * (1 - progress)}
          />
        </svg>
        <LifeBuoy className={`h-6 w-6 ${progress > 0 ? "text-red-100" : "text-red-300"}`} strokeWidth={2.1} />
      </button>
      <span className="mt-1 block text-center text-[9px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
        {progress > 0 ? "Segure" : "Emergência"}
      </span>
    </div>
  );
}

function cardOwnsRoute(id?: string) {
  if (!id || id === "ponto" || id === "sul" || id === "norte") return false;
  return id === "escunas" || id === MARLIN.id || PLACES.some((place) => place.id === id) || AMBULANTES.some((vendor) => vendor.id === id);
}

const ROUTE_COLOR: Record<TravelMode, string> = {
  foot: "#e11d48",
  bike: "#0f766e",
  car: "#1d4ed8",
};

function MapScreen({
  onClose,
  onSos,
  rampAlert,
  onDismissRamp,
}: {
  onClose: () => void;
  onSos: () => void;
  rampAlert: boolean;
  onDismissRamp: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [filter, setFilter] = useState<MapFilter>("neutro");
  const [query, setQuery] = useState("");
  const [coach, setCoach] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [userPoint, setUserPoint] = useState<{ lat: number; lng: number } | null>(null);
  const heading = useDeviceHeading();
  const [flyTo, setFlyTo] = useState<{ id: number; lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [rampTalk, setRampTalk] = useState(false);
  const [marlinTalk, setMarlinTalk] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "clean">("satellite");
  const onSearchActive = useCallback((active: boolean) => setSearchOpen(active), []);
  const foldedQuery = fold(query.trim());
  const activeFilter = MAP_FILTERS.find((item) => item.id === filter) ?? MAP_FILTERS[0];
  const catalog = [
    ...SHOWERS.map((pin) => ({ kind: pin.mapKind, name: pin.name })),
    ...PLACES.map((place) => ({ kind: place.mapKind, name: place.name })),
    ...(filter === "neutro" ? [{ kind: "parceiros" as const, name: "Ponto das Escunas" }] : []),
  ];
  const hits = catalog.filter((pin) => {
    const inCategory = filter === "neutro" || pin.kind === filter;
    const nameHit = !foldedQuery || fold(pin.name).includes(foldedQuery);
    return inCategory && nameHit;
  }).length;
  const sheetPlace = PLACES.find((place) => place.id === sheetId && place.isSponsor) ?? null;
  const sheetVendor = AMBULANTES.find((vendor) => vendor.id === sheetId && vendor.isSponsor && vendor.isOnline) ?? null;
  const mapHint = foldedQuery
    ? hits === 0
      ? "Nenhum estabelecimento com esse nome."
      : `${hits} estabelecimento${hits === 1 ? "" : "s"} na orla.`
    : coach
      ? "Arraste a orla. Segure o mapa para marcar um ponto."
      : activeFilter.hint;
  const [mode, setMode] = useState<TravelMode | null>(null);
  const [destination, setDestination] = useState<WalkPoint | null>(null);
  const [stops, setStops] = useState<WalkPoint[]>([]);
  const [pending, setPending] = useState<WalkPoint | null>(null);
  const [pendingStep, setPendingStep] = useState<"action" | "mode" | null>(null);
  const [replaceRoute, setReplaceRoute] = useState(false);
  const [originMark, setOriginMark] = useState<{ lat: number; lng: number } | null>(null);
  const [anchor, setAnchor] = useState<{ lat: number; lng: number } | null>(null);
  const [armOrigin, setArmOrigin] = useState(false);
  const [route, setRoute] = useState<WalkRoute | null>(null);
  const [routing, setRouting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [following, setFollowing] = useState(true);
  const [liveFix, setLiveFix] = useState(false);
  const origin = anchor ?? originMark ?? userPoint;
  const spokenKey = useRef("");
  const announced = useRef<Set<string>>(new Set());
  const quietIntro = useRef(false);
  const offStreak = useRef(0);
  const lastPlanAt = useRef(0);
  const accuracy = useRef(99);
  const routeActive = Boolean(destination && mode);
  const driving = routeActive && !cameraOpen && !searchOpen;

  useEffect(() => {
    // deixa a animação do card terminar antes de montar o Leaflet
    let idle = 0;
    const fallback = window.setTimeout(() => setMapReady(true), 280);
    if ("requestIdleCallback" in window) {
      idle = window.requestIdleCallback(() => setMapReady(true), { timeout: 420 });
    }
    return () => {
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!driving) return;
    setOpenId(null);
    setSheetId(null);
  }, [driving, destination?.id, mode]);

  useEffect(() => {
    if (!destination || !mode || anchor) return;
    const start = originMark ?? userPoint;
    if (start) setAnchor(start);
  }, [destination, mode, originMark, userPoint, anchor]);

  useEffect(() => {
    if (!routeActive || !navigator.geolocation) return;
    const last = { lat: 0, lng: 0, at: 0, ready: false };
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        accuracy.current = position.coords.accuracy;
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const moved = last.ready ? metersBetween(last, next) : 999;
        const now = Date.now();
        if (last.ready && moved < 12 && now - last.at < 2500) return;
        last.lat = next.lat;
        last.lng = next.lng;
        last.at = now;
        last.ready = true;
        setUserPoint(next);
        setLiveFix(true);
        setLocating(false);
      },
      () => {
        setLiveFix(false);
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [routeActive]);

  useEffect(() => {
    if (!destination || !anchor || !mode) {
      setRoute(null);
      setRouting(false);
      return;
    }
    const controller = new AbortController();
    setRouting(true);
    const points = [anchor, ...stops, destination];
    planRoute(points, mode, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setRoute(next);
        setRouting(false);
        setRecalculating(false);
        lastPlanAt.current = Date.now();
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRouting(false);
        setRecalculating(false);
      });
    return () => controller.abort();
  }, [destination, stops, anchor, mode]);

  const progress = useMemo(() => (route && userPoint ? followRoute(userPoint, route.line) : null), [route, userPoint]);
  const cues = useMemo(() => (route ? nextManeuvers(route, progress?.traveledMeters ?? 0) : []), [route, progress]);
  const maneuver = cues[0] ?? null;
  const afterManeuver = cues[1] ?? null;
  const remainingMeters = progress?.remainingMeters ?? route?.meters ?? 0;
  const remainingSeconds = route && route.meters > 0 ? route.seconds * (remainingMeters / route.meters) : 0;
  const arrived = Boolean(progress && progress.remainingMeters < 22 && progress.offMeters < 40);

  useEffect(() => {
    if (!route || !mode || !destination) return;
    const key = `${mode}:${destination.id ?? destination.name}:${Math.round(route.meters)}:${stops.length}:${anchor?.lat.toFixed(4)}`;
    if (spokenKey.current === key) return;
    spokenKey.current = key;
    announced.current = new Set();
    if (quietIntro.current) {
      quietIntro.current = false;
      return;
    }
    speakGuara(routeIntro(route, mode, destination.name));
  }, [route, mode, destination, stops.length, anchor]);

  useEffect(() => {
    if (!route || !progress || !mode || !destination || !userPoint) return;
    const cues = CALL_OUT[mode];
    route.steps.forEach((step, index) => {
      if (!step.at || step.modifier === "depart") return;
      const remain = (step.along ?? 0) - progress.traveledMeters;
      if (remain < -20) return;
      const street = step.street ? ` na ${step.street}` : "";
      if (cues.far && remain <= cues.far && remain > cues.near + 12 && !announced.current.has(`${index}:far`)) {
        announced.current.add(`${index}:far`);
        speakGuara(`Daqui a ${formatDistance(remain)}, ${step.instruction.toLowerCase()}${street}.`);
      }
      if (remain <= cues.near && !announced.current.has(`${index}:near`)) {
        announced.current.add(`${index}:near`);
        speakGuara(`Agora, ${step.instruction.toLowerCase()}${street}.`);
      }
    });
    if (arrived && !announced.current.has("arrive")) {
      announced.current.add("arrive");
      speakGuara(`Você chegou. ${destination.name} está aqui.`);
    }
  }, [route, progress, mode, destination, userPoint, arrived]);

  useEffect(() => {
    if (!progress || !mode || !userPoint || !route || route.via === "linha" || routing || arrived) return;
    if (accuracy.current > 80) return;
    const missed = progress.offMeters > OFF_ROUTE[mode] && progress.traveledMeters > 30;
    offStreak.current = missed ? offStreak.current + 1 : 0;
    if (offStreak.current < 3 || Date.now() - lastPlanAt.current < 12000) return;
    offStreak.current = 0;
    quietIntro.current = true;
    setRecalculating(true);
    setAnchor(userPoint);
    setStops((current) => current.filter((stop) => metersBetween(userPoint, stop) > 40));
    speakGuara("Você saiu do caminho. Estou refazendo a rota.");
  }, [progress, mode, userPoint, route, routing, arrived]);

  const stopRoute = () => {
    stopSpeaking();
    spokenKey.current = "";
    announced.current = new Set();
    setDestination(null);
    setStops([]);
    setMode(null);
    setPending(null);
    setPendingStep(null);
    setReplaceRoute(false);
    setOriginMark(null);
    setAnchor(null);
    setArmOrigin(false);
    setRoute(null);
    setRecalculating(false);
    setFollowing(true);
    setLiveFix(false);
    offStreak.current = 0;
  };

  const askPlace = (place: WalkPoint) => {
    setCoach(false);
    setPending(place);
    setReplaceRoute(false);
    setPendingStep(destination && mode ? "action" : "mode");
    if (place.id === "escunas") setSheetId("escunas");
    else if (place.id && place.id !== "ponto") setOpenId(place.id);
  };

  const pickMode = (next: TravelMode) => {
    if (!pending) return;
    setMode(next);
    if (!routeActive || replaceRoute) {
      setDestination(pending);
      setStops([]);
      setAnchor(userPoint ?? originMark);
    }
    setPending(null);
    setPendingStep(null);
    setReplaceRoute(false);
    setOpenId(null);
    setSheetId(null);
    setFollowing(true);
  };

  const beginFresh = () => {
    setReplaceRoute(true);
    setPendingStep("mode");
  };

  const addStop = () => {
    if (!pending) return;
    setStops((current) => [...current, pending]);
    if (userPoint) setAnchor(userPoint);
    setPending(null);
    setPendingStep(null);
  };

  const holdPoint = (lat: number, lng: number) => {
    setCoach(false);
    if (armOrigin) {
      setOriginMark({ lat, lng });
      setAnchor({ lat, lng });
      setArmOrigin(false);
      return;
    }
    askPlace({ id: "ponto", lat, lng, name: "Ponto no mapa" });
  };

  const locate = () => {
    void requestCompass();
    if (!navigator.geolocation) {
      setLocateNote("Este aparelho não informou a localização.");
      return;
    }
    setLocating(true);
    setLocateNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserPoint(next);
        setLiveFix(true);
        if (!routeActive) setFlyTo({ id: Date.now(), lat: next.lat, lng: next.lng });
        setLocating(false);
        setCoach(false);
      },
      () => {
        setLocating(false);
        setLocateNote("Permita a localização para centralizar o mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  useEffect(() => {
    locate();
  }, []);

  useEffect(() => {
    if (!rampAlert || driving) return;
    speakGuara(RAMPA_WARN);
  }, [rampAlert, driving]);

  useEffect(() => {
    if (!rampTalk || rampAlert || driving || marlinTalk) return;
    speakGuara(RAMPA_RULE);
  }, [rampTalk, rampAlert, driving, marlinTalk]);

  useEffect(() => {
    if (!marlinTalk || driving) return;
    speakGuara(MARLIN_SPEAK);
  }, [marlinTalk, driving]);

  const markOnMap = (mark: MapMark) => {
    setCoach(false);
    setFilter("neutro");
    setOpenId(mark.placeId);
    setFlyTo({ id: Date.now(), lat: mark.lat, lng: mark.lng });
    const vendor = AMBULANTES.find((item) => item.id === mark.placeId && item.isSponsor && item.isOnline);
    if (vendor) setSheetId(vendor.id);
  };

  return (
    <RouteActionsProvider
      value={{
        active: routeActive,
        destinationId: destination?.id,
        pendingId: pending?.id ?? null,
        pendingStep,
        ask: askPlace,
        pickMode,
        beginFresh,
        addStop,
        stop: stopRoute,
        speak: () => {
          if (route && mode && destination) speakGuara(routeIntro(route, mode, destination.name));
        },
        locate,
        markOrigin: () => {
          setArmOrigin(true);
          setSheetId(null);
        },
        needsOrigin: !origin,
        armingOrigin: armOrigin,
        summary:
          route && mode
            ? {
                label: `${modeLabel(mode)}${stops.length ? ` · ${stops.length} parada${stops.length === 1 ? "" : "s"}` : ""}`,
                detail: `${formatDistance(route.meters)} · ${formatWalk(route.seconds)} · chega às ${route.arrivalLabel}`,
                note: routeSurface(mode, route.via),
              }
            : mode
              ? { label: modeLabel(mode), detail: routing ? "Calculando o caminho…" : "Rota em andamento", note: "" }
              : null,
      }}
    >
    <motion.div
      ref={mapRef}
      {...screenEnter}
      style={{ borderRadius: 0 }}
      className="absolute inset-0 z-40 overflow-hidden bg-[#2c3832]"
    >
      <div className="absolute inset-0 z-0 bg-[#2c3832]">
        {mapReady ? (
          <BeachMap
            filter={filter}
            query={foldedQuery}
            openId={openId}
            onSelect={(id) => {
              setCoach(false);
              if (id === MARLIN.id) {
                setOpenId(MARLIN.id);
                setRampTalk(false);
                setMarlinTalk(true);
                return;
              }
              setMarlinTalk(false);
              setOpenId((current) => (current === id ? null : id));
            }}
            onOpen={(id) => setSheetId(id)}
            onOpenEscunas={() => {
              setCoach(false);
              setSheetId("escunas");
            }}
            onOpenVendor={(id) => {
              setCoach(false);
              setOpenId(id);
              setSheetId(id);
            }}
            onRampTap={() => {
              setCoach(false);
              setMarlinTalk(false);
              setRampTalk(true);
            }}
            onClear={() => {
              setOpenId(null);
              setMarlinTalk(false);
            }}
            onHold={holdPoint}
            flyTo={flyTo}
            user={userPoint}
            heading={heading ?? 0}
            basemap={basemap}
            routeLine={route?.line ?? null}
            routeColor={mode ? ROUTE_COLOR[mode] : "#e11d48"}
            destination={destination}
            stops={stops}
            originMark={originMark}
            driving={driving}
            follow={following}
            followTick={Math.round((progress?.traveledMeters ?? 0) / 40)}
            traveledLine={progress?.traveledLine ?? null}
            remainingLine={progress?.remainingLine ?? null}
          />
        ) : (
          <div className="h-full w-full bg-[#2c3832]" aria-hidden />
        )}
      </div>

      <AnimatePresence>
        {sheetPlace && <SponsorSheet key={sheetPlace.id} place={sheetPlace} onClose={() => setSheetId(null)} />}
        {sheetVendor && <AmbulanteSheet key={sheetVendor.id} vendor={sheetVendor} onClose={() => setSheetId(null)} />}
        {sheetId === "escunas" && <EscunaSheet onClose={() => setSheetId(null)} />}
      </AnimatePresence>

      {!driving && <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-black/45 to-transparent" />}
      {!driving && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-t from-black/50 to-transparent" />}

      {!driving && (
        <div
          className="pointer-events-none absolute left-5 right-16 z-50"
          style={{ top: "max(0.85rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))" }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
            Praia do Morro
          </p>
          <h2 className="mt-1 text-[1.35rem] font-semibold leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            Mapa & Localização
          </h2>
        </div>
      )}

      <CloseButton onClose={onClose} light={!driving} className={closeTopClass} data-map-ui />

      {!driving && (
      <div
        className="absolute right-4 z-50 flex flex-col items-end gap-1"
        style={{ top: "max(4.7rem, calc(env(safe-area-inset-top, 0px) + 3.7rem))" }}
      >
        <button
          type="button"
          data-map-ui
          data-onboard="map-location"
          aria-label="Minha localização"
          onClick={locate}
          className="grid h-12 w-12 place-items-center rounded-full border border-white bg-white text-[#1d4ed8] shadow-[0_12px_28px_rgba(15,23,42,0.28)]"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
        <span className="rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white">Minha localização</span>
        <div role="group" aria-label="Estilo do mapa" className="flex rounded-full border border-white/25 bg-black/55 p-0.5 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md">
          {(
            [
              ["satellite", "Satélite"],
              ["clean", "Limpo"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-map-ui
              aria-pressed={basemap === id}
              onClick={() => setBasemap(id)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${basemap === id ? "bg-white text-[#142018]" : "text-white/80"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {locateNote && !destination && <p className="max-w-[9.5rem] text-right text-[10px] leading-tight text-white">{locateNote}</p>}
      </div>
      )}

      {!driving && marlinTalk && !cameraOpen && !searchOpen && (
        <motion.div
          role="dialog"
          aria-label="Cuidados no Marlin Azul"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="@container absolute inset-0 z-[75] flex items-center justify-center bg-black/45 px-5"
        >
          <div className="flex max-h-full w-full max-w-[19.5rem] flex-col items-center">
            <div className="w-full rounded-[22px] bg-white px-3.5 py-3 text-[#1c120c] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              <p className="text-[15px] font-semibold leading-snug">Marlin Azul</p>
              <p className="mt-0.5 text-[12px] text-neutral-500">Patrimônio da orla · preserve e se cuide</p>
              <ul className="mt-2 space-y-2">
                {MARLIN_TIPS.map((tip) => (
                  <li key={tip.title}>
                    <p className="text-[12px] font-semibold leading-snug text-[#082E84]">{tip.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-neutral-600">{tip.text}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setMarlinTalk(false)}
                className="mt-2.5 rounded-full bg-[#1d4ed8] px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                Entendi
              </button>
            </div>
            <img
              src="/guara-inteiro.png?v=1"
              alt="Guará"
              draggable={false}
              decoding="async"
              className="guara-float-lg h-auto max-h-[min(18rem,42cqh)] w-auto max-w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
            />
          </div>
        </motion.div>
      )}

      {!driving && !marlinTalk && (rampAlert || rampTalk) && !cameraOpen && !searchOpen && (
        <motion.div
          role="dialog"
          aria-label="Corredor da rampa"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="@container absolute inset-0 z-[75] flex items-center justify-center bg-black/45 px-5"
        >
          <div className="flex max-h-full w-full max-w-[19.5rem] flex-col items-center">
            <div className="w-full rounded-[22px] bg-white px-3.5 py-3 text-[#1c120c] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              <p className="text-[15px] font-semibold leading-snug">Corredor da rampa</p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-600">{rampAlert ? RAMPA_WARN : RAMPA_RULE}</p>
              <button
                type="button"
                onClick={() => {
                  if (rampAlert) onDismissRamp();
                  setRampTalk(false);
                }}
                className="mt-2.5 rounded-full bg-[#0284c7] px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                {rampAlert ? "Entendi, vou sair" : "Entendi"}
              </button>
            </div>
            <img
              src="/guara-inteiro.png?v=1"
              alt="Guará"
              draggable={false}
              decoding="async"
              className="guara-float-lg h-auto max-h-[min(20rem,46cqh)] w-auto max-w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
            />
          </div>
        </motion.div>
      )}

      {!driving && (
      <MapSearch
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
        filters={MAP_FILTERS}
        hint={mapHint}
        user={userPoint}
        onMark={markOnMap}
        onActiveChange={onSearchActive}
      />
      )}

      {!driving && !cameraOpen && !searchOpen && <CameraFab onOpen={() => setCameraOpen(true)} />}
      {!driving && (
      <GuaraMapChat
        hidden={cameraOpen || searchOpen}
        onGuide={(guide) => {
          setCoach(false);
          if (guide.query !== undefined) setQuery(guide.query);
          if (guide.filter) setFilter(guide.filter);
          if (guide.basemap) setBasemap(guide.basemap);
          if (guide.openId !== undefined) setOpenId(guide.openId);
          if (guide.sheet !== undefined) setSheetId(guide.sheet);
          if (guide.fly) setFlyTo({ id: Date.now(), lat: guide.fly.lat, lng: guide.fly.lng });
          if (guide.locate) locate();
          if (guide.route) {
            setOriginMark(null);
            setAnchor(null);
            setArmOrigin(false);
            askPlace(guide.route);
          }
        }}
      />
      )}
      {driving && destination && mode && (
        <NavDrive
          mode={mode}
          destination={destination.name}
          routing={routing}
          recalculating={recalculating}
          arrived={arrived}
          live={liveFix}
          following={following}
          remainingMeters={remainingMeters}
          remainingSeconds={remainingSeconds}
          arrival={route?.arrivalLabel ?? "--:--"}
          maneuver={maneuver}
          after={afterManeuver}
          needsOrigin={!origin}
          armingOrigin={armOrigin}
          onToggleFollow={() => setFollowing((value) => !value)}
          onStop={stopRoute}
          onSpeak={() => {
            if (!route) return;
            const street = maneuver?.street ? ` na ${maneuver.street}` : "";
            const line = maneuver
              ? `${maneuver.instruction}${street}. Faltam ${formatDistance(remainingMeters)}, cerca de ${formatWalk(remainingSeconds)}.`
              : routeIntro(route, mode, destination.name);
            speakGuara(line);
          }}
          onLocate={locate}
          onMarkOrigin={() => {
            setArmOrigin(true);
            setSheetId(null);
          }}
        />
      )}
      {pending && !cardOwnsRoute(pending.id) && !cameraOpen && !searchOpen && (
        <div className={`absolute z-[66] rounded-[22px] border border-white/70 bg-white/95 p-3 text-[#142018] shadow-[0_16px_36px_rgba(0,0,0,0.28)] ${driving ? "inset-x-3 bottom-[13.5rem]" : "left-[5.25rem] top-[7.7rem] w-[min(14rem,calc(100%-10.75rem))]"}`}>
          <p className="text-[13px] font-semibold">{pending.name}</p>
          <RouteChoice place={pending} tone="light" />
        </div>
      )}
      <MapSos onTrigger={onSos} parked={driving} />
      {cameraOpen && <TouristCamera onClose={() => setCameraOpen(false)} />}
      <GuaraOnboarding rootRef={mapRef} steps={MAP_STEPS} storageKey={MAP_TOUR_KEY} />
    </motion.div>
    </RouteActionsProvider>
  );
}

function MapHighlight({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ borderColor: "rgba(255,255,255,0.45)" }}
      whileTap={{ scale: 0.985 }}
      transition={cardSpring}
      onClick={onOpen}
      style={{ borderRadius: 28 }}
      className="relative h-[158px] w-full overflow-hidden border border-white/20 bg-[#0c141b] text-left shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
    >
      <CoastMap />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/85 via-[#061018]/25 to-[#061018]/10" />
      <span className="pointer-events-none absolute -right-2 top-0 h-24 w-24 rounded-full bg-cyan-400/25 blur-2xl" />
      <span className="relative flex h-full flex-col justify-between p-4">
        <span className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-50 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            ao vivo
          </span>
          <MapPin className="h-5 w-5 text-blue-200" style={{ filter: "drop-shadow(0 0 10px rgba(96,165,250,0.95))" }} />
        </span>
        <span>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Praia do Morro</span>
          <span className="mt-1 block text-[1.35rem] font-semibold leading-none text-white">Mapa & Localização</span>
          <span className="mt-1.5 block text-xs text-white/65">Você no calçadão · areia na frente, comércio atrás</span>
        </span>
      </span>
    </motion.button>
  );
}

function AlertasBody({ onFlags }: { onFlags: () => void }) {
  const items = [
    {
      title: "Bandeira amarela",
      place: "Praia do Morro",
      detail: "Mar picado. Banho apenas entre as bandeiras.",
      tone: "bg-amber-300",
    },
    {
      title: "Águas-vivas",
      place: "Areia Preta",
      detail: "Registros nas últimas 2 horas. Evite o raso.",
      tone: "bg-purple-300",
    },
    {
      title: "Plantão ativo",
      place: "Salva-vidas até 18h",
      detail: "Postos 1, 2 e 4 operando agora.",
      tone: "bg-emerald-300",
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2.5">
      <FlagsLink onOpen={onFlags} />
      {items.map((item) => (
        <motion.article
          key={item.title}
          variants={itemVariants}
          className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className={cx("h-2 w-2 rounded-full", item.tone)} />
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">
            {item.place}
          </p>
          <p className="mt-1.5 text-sm text-white/75">{item.detail}</p>
        </motion.article>
      ))}
    </motion.div>
  );
}

function FeatureBody({ id, onFlags }: { id: FeatureId; onFlags: () => void }) {
  switch (id) {
    case "mare":
      return <LiveMare />;
    case "clima":
      return <LiveClima />;
    case "alertas":
      return <AlertasBody onFlags={onFlags} />;
    case "crianca":
      return null;
  }
}

function BeachHome({
  mapOpen,
  activeId,
  story,
  onOpenMap,
  onOpen,
  onOpenStory,
}: {
  mapOpen: boolean;
  activeId: FeatureId | null;
  story: StoryId | null;
  onOpenMap: () => void;
  onOpen: (id: FeatureId) => void;
  onOpenStory: (id: StoryId) => void;
}) {
  const { data: weather } = useWeather();

  return (
    <div className="pt-4">
      {mapOpen ? <div className="h-[158px]" /> : <MapHighlight onOpen={onOpenMap} />}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
          {weather ? `${Math.round(weather.temp)}° · ${weather.summary.toLowerCase()}` : "Lendo o clima"}
        </span>
        <button
          type="button"
          onClick={() => onOpenStory("bandeiras")}
          className="rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1 text-xs text-amber-50"
        >
          Bandeira amarela
        </button>
      </div>
      <OrlaCards hidden={story} onOpen={onOpenStory} />
      <div className="mb-2.5 mt-4 flex items-end justify-between px-0.5">
        <p className="text-sm font-medium text-white/90">Serviços da praia</p>
        <p className="text-[11px] text-white/45">ao vivo</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map((feature) =>
          activeId === feature.id ? (
            <div key={feature.id} className="h-[122px]" />
          ) : (
            <FeatureCard key={feature.id} feature={feature} onOpen={onOpen} />
          ),
        )}
      </div>
    </div>
  );
}

function SosSlider({ onTrigger }: { onTrigger: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const maxRef = useRef(0);
  const [max, setMax] = useState(0);
  const triggered = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const next = Math.max(0, track.clientWidth - 56 - 8);
      maxRef.current = next;
      setMax(next);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const labelOpacity = useTransform(x, (value) => {
    const limit = maxRef.current || 1;
    return Math.max(0, 1 - value / (limit * 0.72));
  });
  const releaseOpacity = useTransform(x, (value) => {
    const limit = maxRef.current || 1;
    const progress = value / limit;
    if (progress < 0.74) return 0;
    return Math.min(1, (progress - 0.74) / 0.18);
  });
  const fillWidth = useTransform(x, (value) => value + 56);

  const finish = () => {
    const limit = maxRef.current;
    if (triggered.current) return;
    if (limit > 0 && x.get() >= limit * 0.9) {
      triggered.current = true;
      void animate(x, limit, { type: "spring", stiffness: 520, damping: 32 });
      navigator.vibrate?.(28);
      onTrigger();
      return;
    }
    void animate(x, 0, { type: "spring", stiffness: 540, damping: 28, mass: 0.75 });
  };

  return (
    <div className="absolute bottom-[max(1.1rem,env(safe-area-inset-bottom))] left-4 right-4 z-30">
      <div
        ref={trackRef}
        className="relative h-16 overflow-hidden rounded-full border border-white/15 bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
        data-onboard="sos"
      >
        <motion.div
          style={{ width: fillWidth }}
          className="absolute bottom-1 left-1 top-1 rounded-full bg-gradient-to-r from-red-700/90 to-red-500/50"
        />
        <motion.span
          style={{ opacity: labelOpacity }}
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 grid place-items-center pl-10 text-[13px] font-medium tracking-wide text-white/80"
        >
          Deslize para Emergência &gt;&gt;&gt;
        </motion.span>
        <motion.span
          style={{ opacity: releaseOpacity }}
          className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] font-semibold text-white"
        >
          Solte para acionar
        </motion.span>
        <motion.div
          role="slider"
          aria-label="Deslize para emergência"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={max ? Math.round((x.get() / max) * 100) : 0}
          drag="x"
          dragConstraints={{ left: 0, right: max }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x, touchAction: "none" }}
          onDragEnd={finish}
          className="absolute left-1 top-1 z-10 grid h-14 w-14 cursor-grab place-items-center rounded-full bg-gradient-to-b from-red-400 to-red-700 shadow-[0_0_22px_rgba(239,68,68,0.7)] active:cursor-grabbing"
        >
          <motion.span
            className="absolute inset-0 rounded-full border border-red-200/70"
            animate={{ scale: [1, 1.28], opacity: [0.75, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            animate={{ rotate: [0, 10, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <LifeBuoy className="h-7 w-7 text-white" strokeWidth={2.1} />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function SosModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [calling, setCalling] = useState(false);
  const [note, setNote] = useState("");
  const [attached, setAttached] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSent(true), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      role="alertdialog"
      aria-label="Alerta crítico"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-red-500 via-red-700 to-[#4a0b0b]"
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
      />
      <motion.div
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        animate={{ x: ["-60%", "280%"] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "linear", repeatDelay: 0.35 }}
      />
      <div
        className="no-scrollbar relative flex h-full flex-col overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-white"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))" }}
      >
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-0 rounded-full border border-white/50"
              animate={{ scale: [0.7, 1.7], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: ring * 0.35 }}
            />
          ))}
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-red-600 shadow-[0_0_30px_rgba(255,255,255,0.35)]"
          >
            <LifeBuoy className="h-8 w-8" />
          </motion.span>
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
          Alerta crítico
        </p>
        <h2 className="mt-2 font-serif text-4xl italic leading-none">
          {sent ? "Emergência enviada" : "Localizando você"}
        </h2>
        <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-white/85">
          {sent
            ? "A equipe Alegretto da Praia do Morro foi notificada. Fique visível e aguarde o posto."
            : "Confirmando o ponto na areia antes de avisar o salva-vidas."}
        </p>
        <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-white/70">
          20.671° S · 40.497° W
        </p>
        {sent && (
          <form
            className="mt-5 w-full text-left"
            onSubmit={(event) => {
              event.preventDefault();
              if (!note.trim() || attached) return;
              setAttached(true);
            }}
          >
            <label htmlFor="emergencia" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              Descreva a emergência (opcional)
            </label>
            <textarea
              id="emergencia"
              value={note}
              readOnly={attached}
              maxLength={240}
              rows={3}
              placeholder="O que está acontecendo agora"
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 w-full resize-none rounded-2xl border border-white/30 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-white/45"
            />
            {attached ? (
              <p className="mt-2 text-xs text-white">Descrição anexada ao alerta do posto.</p>
            ) : (
              <>
                <p className="mt-2 text-xs text-white/70">
                  O posto já tem sua localização. Este texto só entra se você quiser.
                </p>
                <button
                  type="submit"
                  disabled={!note.trim()}
                  className="mt-2 w-full rounded-full border border-white/40 bg-white/15 py-2.5 text-sm font-medium disabled:opacity-40"
                >
                  Anexar ao alerta
                </button>
              </>
            )}
          </form>
        )}
        <div className="mx-auto mt-5 flex w-full max-w-[250px] flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setCalling(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-red-700"
          >
            <PhoneIcon className="h-4 w-4" />
            {calling ? "Conectando ao posto 2" : "Ligar para o posto"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/35 bg-white/10 py-3 text-sm font-medium backdrop-blur-md"
          >
            Cancelar alerta
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Phone({
  sos,
  onSos,
  onCloseSos,
  splashDone = true,
  splashActive = false,
}: {
  sos: boolean;
  onSos: () => void;
  onCloseSos: () => void;
  splashDone?: boolean;
  splashActive?: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [tourReplay, setTourReplay] = useState(0);
  const [activeId, setActiveId] = useState<FeatureId | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [story, setStory] = useState<StoryId | null>(null);
  const [sosKey, setSosKey] = useState(0);
  const [missionOpen, setMissionOpen] = useState(false);
  const ramp = useRampWatch(mapOpen, !splashActive);
  const active = FEATURES.find((feature) => feature.id === activeId) ?? null;
  const sheet = active && active.id !== "crianca" ? active : null;

  // Gesto de voltar do iPhone — desligado no mapa para não sair ao arrastar a orla.
  const canEdgeBack = Boolean(missionOpen || sos || childOpen || story || sheet);
  useEdgeSwipeBack(
    canEdgeBack,
    useCallback(() => {
      if (missionOpen) {
        setMissionOpen(false);
        return;
      }
      if (sos) {
        onCloseSos();
        setSosKey((value) => value + 1);
        return;
      }
      if (childOpen) {
        setChildOpen(false);
        return;
      }
      if (story) {
        setStory(null);
        return;
      }
      if (sheet) setActiveId(null);
    }, [missionOpen, sos, childOpen, story, sheet, onCloseSos]),
  );

  const openFeature = (id: FeatureId) => {
    setStory(null);
    if (id === "crianca") {
      setMapOpen(false);
      setActiveId(null);
      setChildOpen(true);
      return;
    }
    setMapOpen(false);
    setChildOpen(false);
    setActiveId(id);
  };

  const openStory = (id: StoryId) => {
    setMapOpen(false);
    setChildOpen(false);
    setActiveId(null);
    setStory(id);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (missionOpen) {
        setMissionOpen(false);
        return;
      }
      setActiveId(null);
      setMapOpen(false);
      setChildOpen(false);
      setStory(null);
      if (sos) {
        onCloseSos();
        setSosKey((value) => value + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [missionOpen, onCloseSos, sos]);

  return (
    <div className="relative h-dvh w-full max-w-[480px] sm:h-[850px] sm:w-[400px] sm:max-w-none">
      <span className="absolute -left-[3px] top-28 hidden h-8 w-[3px] rounded-l-sm bg-gray-800 sm:block" />
      <span className="absolute -left-[3px] top-40 hidden h-14 w-[3px] rounded-l-sm bg-gray-800 sm:block" />
      <span className="absolute -left-[3px] top-56 hidden h-14 w-[3px] rounded-l-sm bg-gray-800 sm:block" />
      <span className="absolute -right-[3px] top-44 hidden h-20 w-[3px] rounded-r-sm bg-gray-800 sm:block" />

      <div ref={shellRef} className={`relative h-full w-full overflow-hidden bg-gray-900 sm:rounded-[3rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl ${splashActive ? "pa-hold" : ""}`}>
        <OceanWash urgent={sos} paused={splashActive} />
        <div
          className="relative z-10 flex h-full flex-col"
          style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top, 0px))" }}
        >
          <GuaraIsland
            onMission={() => setMissionOpen(true)}
            onReplay={() => {
              try {
                localStorage.removeItem(HOME_TOUR_KEY);
                localStorage.removeItem(MAP_TOUR_KEY);
              } catch {
                /* ignore private mode */
              }
              setMapOpen(false);
              setActiveId(null);
              setStory(null);
              setTourReplay((value) => value + 1);
            }}
          />

          <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-2.5 ${splashActive ? "content-visibility-auto" : ""}`}>
            <BeachHome
              mapOpen={mapOpen}
              activeId={activeId}
              story={story}
              onOpenMap={() => {
                setActiveId(null);
                setChildOpen(false);
                setStory(null);
                setMapOpen(true);
              }}
              onOpen={openFeature}
              onOpenStory={openStory}
            />
          </div>
        </div>

        <AnimatePresence>
          {sheet && (
            <SheetShell key={sheet.id} feature={sheet} onClose={() => setActiveId(null)}>
              <FeatureBody id={sheet.id} onFlags={() => openStory("bandeiras")} />
            </SheetShell>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {mapOpen && (
            <MapScreen
              key="map"
              onClose={() => setMapOpen(false)}
              onSos={onSos}
              rampAlert={ramp.alert}
              onDismissRamp={ramp.dismiss}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {story === "marlin" && <MarlinScreen key="marlin" onClose={() => setStory(null)} />}
          {story === "fotos" && <FotosScreen key="fotos" onClose={() => setStory(null)} />}
          {story === "bandeiras" && <FlagsScreen key="bandeiras" onClose={() => setStory(null)} />}
        </AnimatePresence>

        <SosSlider key={sosKey} onTrigger={onSos} />

        <AnimatePresence>
          {childOpen && <CriancaModal onClose={() => setChildOpen(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {sos && (
            <SosModal
              onClose={() => {
                onCloseSos();
                setSosKey((value) => value + 1);
              }}
            />
          )}
        </AnimatePresence>

        <MissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />

        <p className="sr-only" aria-live="assertive">
          {sos ? "Alerta crítico acionado na Praia do Morro." : ""}
        </p>
        {!mapOpen && (
          <GuaraOnboarding
            rootRef={shellRef}
            steps={HOME_STEPS}
            storageKey={HOME_TOUR_KEY}
            replay={tourReplay}
            reveal={splashDone || !splashActive}
          />
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [sos, setSos] = useState(false);
  const [splash, setSplash] = useState(true);
  // aquecimento: monta o Guará ainda sob a splash para não tiltar na revelação
  const [warm, setWarm] = useState(false);
  const warmHome = useCallback(() => setWarm(true), []);
  const dismissSplash = useCallback(() => setSplash(false), []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-start overflow-x-hidden sm:justify-center sm:px-3 sm:py-8">
      {splash && <SplashScreen onWarm={warmHome} onDone={dismissSplash} />}
      <Stage urgent={sos} paused={splash} />
      <div className="relative z-10">
        <Phone
          sos={sos}
          onSos={() => setSos(true)}
          onCloseSos={() => setSos(false)}
          splashDone={warm}
          splashActive={splash}
        />
      </div>
      <footer className="relative z-10 mt-6 hidden text-center sm:block">
        <p className="font-serif text-lg italic text-white/80">Praia Alerta</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/40">
          Guarapari · Espírito Santo
        </p>
      </footer>
    </main>
  );
}
