"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { GuaraPose } from "./guara-pose";
import { speakGuara, stopSpeaking } from "./voice";

export type ShowerRitualStep = {
  title: string;
  text: string;
  kind: "moeda" | "alerta" | "convivencia" | "festa";
};

const DROPS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${4 + ((i * 17) % 92)}%`,
  delay: (i % 7) * 0.35,
  duration: 2.4 + (i % 5) * 0.45,
  size: 4 + (i % 4) * 2,
  opacity: 0.25 + (i % 5) * 0.1,
}));

function CoinFace({ size = 112 }: { size?: number }) {
  return (
    <motion.div
      aria-hidden
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #fff7d1 0%, #f5d76e 28%, #d4a017 62%, #8a6a0a 100%)",
        boxShadow:
          "0 0 0 3px rgba(255,247,209,0.55), 0 18px 40px rgba(212,160,23,0.45), inset 0 -8px 18px rgba(90,60,0,0.35)",
      }}
      animate={{ rotateY: [0, 360], scale: [1, 1.06, 1] }}
      transition={{
        rotateY: { duration: 4.8, repeat: Infinity, ease: "linear" },
        scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <span
        className="absolute inset-[10%] rounded-full border border-[#fff3b0]/70"
        style={{ boxShadow: "inset 0 0 0 2px rgba(138,106,10,0.35)" }}
      />
      <span className="relative text-center leading-none text-[#5c4308]">
        <span className="block text-[11px] font-bold uppercase tracking-[0.22em]">Brasil</span>
        <span className="mt-0.5 block font-serif text-[2.35rem] font-black">R$ 1</span>
        <span className="mt-0.5 block text-[10px] font-semibold tracking-wide">a chave da água</span>
      </span>
    </motion.div>
  );
}

export function GuaraShowerRitual({
  name,
  steps,
  stepIndex,
  onNext,
  onClose,
}: {
  name: string;
  steps: readonly ShowerRitualStep[];
  stepIndex: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const step = steps[stepIndex] ?? steps[0];
  const last = stepIndex >= steps.length - 1;
  const [burst, setBurst] = useState(0);
  const mist = useMemo(() => DROPS, []);

  if (!step) return null;

  const tone =
    step.kind === "moeda"
      ? "from-amber-200/90 via-yellow-100/95 to-cyan-100/90 text-[#5c4308]"
      : step.kind === "alerta"
        ? "from-rose-200/90 via-orange-50/95 to-cyan-50/90 text-rose-900"
        : step.kind === "festa"
          ? "from-cyan-100/95 via-sky-50 to-emerald-100/90 text-[#0b3a5b]"
          : "from-emerald-100/95 via-teal-50 to-cyan-100/90 text-emerald-950";

  return (
    <motion.div
      role="dialog"
      aria-label={`Guará na ${name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[78] flex items-end justify-center overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (last) {
          stopSpeaking();
          onClose();
        } else {
          onNext();
        }
      }}
    >
      {/* Oceano surreal atrás */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(56,189,248,0.55),transparent_55%),linear-gradient(180deg,#0369a1_0%,#0c4a6e_42%,#082f49_100%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-[18%] h-[55%] w-[150%] rounded-[100%] bg-cyan-300/25 blur-3xl"
        animate={{ x: ["-6%", "6%", "-6%"], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#7dd3fc]/35 via-[#38bdf8]/12 to-transparent"
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity }}
      />

      {/* Gotas caindo */}
      {mist.map((drop) => (
        <motion.span
          key={drop.id}
          aria-hidden
          className="pointer-events-none absolute top-[-8%] rounded-full bg-white"
          style={{
            left: drop.left,
            width: drop.size,
            height: drop.size * 1.6,
            opacity: drop.opacity,
            filter: "blur(0.4px)",
          }}
          animate={{ y: ["0vh", "110vh"], opacity: [0, drop.opacity, 0] }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}

      <button
        type="button"
        aria-label="Fechar"
        onClick={() => {
          stopSpeaking();
          onClose();
        }}
        className="absolute right-4 top-[max(0.85rem,env(safe-area-inset-top))] z-20 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 flex w-full max-w-[22rem] flex-col items-center">
        {/* Moeda hero */}
        <div className="relative mb-2 flex h-[7.5rem] w-full items-center justify-center">
          <motion.div
            key={burst}
            aria-hidden
            className="absolute inset-0"
            initial={{ opacity: 0.8, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.9 }}
          >
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/40 blur-2xl" />
          </motion.div>
          <CoinFace />
        </div>

        <p className="pa-brand text-center text-[1.35rem] leading-none text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
          {name}
        </p>
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">
          Portal da água · Guará
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${stepIndex}-${step.title}`}
            initial={{ opacity: 0, y: 22, rotateX: -8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`relative mt-3 w-full overflow-hidden rounded-[26px] border border-white/45 bg-gradient-to-br p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl ${tone}`}
          >
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              animate={{ x: ["0%", "280%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.1 }}
            />
            <div className="relative flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                {step.kind === "moeda"
                  ? "Segredo da ducha"
                  : step.kind === "alerta"
                    ? "Alerta da orla"
                    : step.kind === "festa"
                      ? "Banho liberado"
                      : "Boa convivência"}
              </p>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold">
                {stepIndex + 1}/{steps.length}
              </span>
            </div>
            <h3 className="relative mt-1.5 text-[1.15rem] font-semibold leading-snug">{step.title}</h3>
            <p className="relative mt-1.5 text-[13.5px] leading-relaxed opacity-90">{step.text}</p>

            <div className="relative mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => speakGuara(`${step.title}. ${step.text}`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-[13px] font-semibold text-[#0b3a5b] shadow-sm"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Ouvir
              </button>
              <button
                type="button"
                onClick={() => {
                  setBurst((n) => n + 1);
                  if (last) {
                    stopSpeaking();
                    onClose();
                  } else {
                    onNext();
                  }
                }}
                className="rounded-full bg-[#0284c7] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(2,132,199,0.45)]"
              >
                {last ? "Entendi, Guará" : "Próxima gota >>"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 flex w-full gap-1.5 px-1">
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-cyan-200" : "bg-white/20"}`}
            />
          ))}
        </div>

        <GuaraPose
          pose={last ? "festa" : step.kind === "moeda" ? "mare" : step.kind === "alerta" ? "avisos" : "clima"}
          alt="Guará"
          width={200}
          height={210}
          className="guara-float-lg mt-1 h-[min(11.5rem,34dvh)] w-auto drop-shadow-[0_18px_36px_rgba(0,0,0,0.5)]"
        />
        <p className="mb-1 text-center text-[11px] text-cyan-50/85">Toque na névoa ou em Próxima gota</p>
      </div>
    </motion.div>
  );
}
