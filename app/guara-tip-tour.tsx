"use client";

import { Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { speakGuara, stopSpeaking } from "./voice";

export type GuaraTipStep = {
  title: string;
  text: string;
  kind?: "alerta" | "convivencia" | "aviso";
};

export function GuaraTipTour({
  title,
  subtitle,
  steps,
  stepIndex,
  speakAll,
  accent = "ocean",
  onNext,
  onClose,
}: {
  title: string;
  subtitle?: string;
  steps: readonly GuaraTipStep[];
  stepIndex: number;
  speakAll?: string;
  accent?: "ocean" | "teal" | "amber" | "rose";
  onNext: () => void;
  onClose: () => void;
}) {
  const step = steps[stepIndex] ?? steps[0];
  const last = stepIndex >= steps.length - 1;
  const tone =
    step?.kind === "alerta"
      ? "border-red-100 bg-red-50/90 text-red-700"
      : step?.kind === "convivencia"
        ? "border-emerald-100 bg-emerald-50/90 text-emerald-800"
        : "border-sky-100 bg-sky-50/90 text-[#0b3a66]";

  const accentBtn =
    accent === "teal"
      ? "bg-[#0f766e]"
      : accent === "amber"
        ? "bg-amber-600"
        : accent === "rose"
          ? "bg-rose-600"
          : "bg-[#1d4ed8]";

  const accentSoft =
    accent === "teal"
      ? "border-[#0f766e]/25 bg-[#0f766e]/10 text-[#0f766e]"
      : accent === "amber"
        ? "border-amber-600/25 bg-amber-500/10 text-amber-800"
        : accent === "rose"
          ? "border-rose-600/25 bg-rose-500/10 text-rose-700"
          : "border-[#1d4ed8]/25 bg-[#1d4ed8]/10 text-[#1d4ed8]";

  if (!step) return null;

  return (
    <motion.div
      role="dialog"
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="@container absolute inset-0 z-[75] flex items-center justify-center bg-black/45 px-5"
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
      <div className="flex max-h-full w-full max-w-[19.5rem] flex-col items-center">
        <div className="w-full rounded-[22px] bg-white px-3.5 py-3 text-[#1c120c] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="pa-brand text-[16px] leading-snug text-[#0c2a4a]">{title}</p>
              {subtitle ? <p className="mt-0.5 text-[12px] text-neutral-500">{subtitle}</p> : null}
            </div>
            <p className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
              {stepIndex + 1}/{steps.length}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${stepIndex}-${step.title}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={`mt-2.5 rounded-2xl border px-3 py-2.5 ${tone}`}
            >
              {step.kind === "alerta" ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600/90">Alerta</p>
              ) : null}
              {step.kind === "convivencia" ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700/90">
                  Boa convivência
                </p>
              ) : null}
              <p className="mt-1 text-[13px] font-semibold leading-snug">{step.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-700">{step.text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 flex gap-1.5">
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={`h-1 flex-1 rounded-full ${index <= stepIndex ? accentBtn : "bg-black/10"}`}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {speakAll ? (
              <button
                type="button"
                onClick={() => speakGuara(speakAll)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${accentSoft}`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                Ouvir
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (last) {
                  stopSpeaking();
                  onClose();
                } else {
                  onNext();
                }
              }}
              className={`rounded-full px-3 py-1.5 text-[13px] font-semibold text-white ${accentBtn}`}
            >
              {last ? "Entendi, Guará" : "Próximo >>"}
            </button>
          </div>
        </div>
        <img
          src="/guara-inteiro.png?v=1"
          alt="Guará"
          draggable={false}
          decoding="async"
          className="guara-float-lg h-auto max-h-[min(18rem,42cqh)] w-auto max-w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
        />
        <p className="mt-1 text-center text-[11px] text-white/85 drop-shadow">Toque na tela ou em Próximo</p>
      </div>
    </motion.div>
  );
}
