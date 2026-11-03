"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { GuaraPose } from "./guara-pose";
import { speakGuara, stopSpeaking } from "./voice";

export type ShowerRitualStep = {
  title: string;
  text: string;
  kind: "moeda" | "alerta" | "convivencia" | "festa";
};

function CoinFace({ size = 96 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #fff7d1 0%, #f5d76e 28%, #d4a017 62%, #8a6a0a 100%)",
        boxShadow:
          "0 0 0 3px rgba(255,247,209,0.55), 0 12px 28px rgba(212,160,23,0.4), inset 0 -8px 18px rgba(90,60,0,0.35)",
      }}
    >
      <span
        className="absolute inset-[10%] rounded-full border border-[#fff3b0]/70"
        style={{ boxShadow: "inset 0 0 0 2px rgba(138,106,10,0.35)" }}
      />
      <span className="relative text-center leading-none text-[#5c4308]">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em]">Brasil</span>
        <span className="mt-0.5 block font-serif text-[2rem] font-black">R$ 1</span>
      </span>
    </div>
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

  if (!step) return null;

  const tone =
    step.kind === "moeda"
      ? "border-amber-200/80 bg-[#fff8e7] text-[#5c4308]"
      : step.kind === "alerta"
        ? "border-rose-200/80 bg-[#fff1f2] text-rose-900"
        : step.kind === "festa"
          ? "border-cyan-200/80 bg-[#ecfeff] text-[#0b3a5b]"
          : "border-emerald-200/80 bg-[#ecfdf5] text-emerald-950";

  const label =
    step.kind === "moeda"
      ? "Como usar"
      : step.kind === "alerta"
        ? "Cuidado"
        : step.kind === "festa"
          ? "Pronto"
          : "Boa convivência";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — avisos do Guará`}
      className="absolute inset-0 z-[120] flex items-end justify-center overflow-hidden bg-[#0c4a6e] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12"
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(125,211,252,0.35),transparent_55%)]" />

      <button
        type="button"
        aria-label="Fechar"
        onClick={(event) => {
          event.stopPropagation();
          stopSpeaking();
          onClose();
        }}
        className="absolute right-3 top-[max(0.75rem,calc(env(safe-area-inset-top,0px)+0.35rem))] z-30 grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/55 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>

      <div className="relative z-10 flex w-full max-w-[22rem] flex-col items-center">
        <div className="mb-2 flex h-[5.75rem] w-full items-center justify-center">
          <CoinFace />
        </div>

        <p className="pa-brand text-center text-[1.35rem] leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          {name}
        </p>
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.18em] text-cyan-100/75">Guará</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${stepIndex}-${step.title}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`relative mt-3 w-full rounded-[22px] border p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)] ${tone}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">{label}</p>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold">
                {stepIndex + 1}/{steps.length}
              </span>
            </div>
            <h3 className="mt-1.5 text-[1.1rem] font-semibold leading-snug">{step.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed opacity-90">{step.text}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  speakGuara(`${step.title}. ${step.text}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[13px] font-semibold text-[#0b3a5b]"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Ouvir
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (last) {
                    stopSpeaking();
                    onClose();
                  } else {
                    onNext();
                  }
                }}
                className="rounded-full bg-[#0284c7] px-3.5 py-1.5 text-[13px] font-semibold text-white"
              >
                {last ? "Entendi, Guará" : "Próximo >>"}
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
          width={180}
          height={190}
          className="mt-1 h-[min(9.5rem,28dvh)] w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
        />
        <p className="mb-1 text-center text-[11px] text-cyan-50/80">Toque fora do card ou em Próximo</p>
      </div>
    </div>
  );
}
