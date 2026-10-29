"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HeartHandshake, X } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.86 };

export function MissionTrigger({
  onOpen,
  variant = "badge",
}: {
  onOpen: () => void;
  variant?: "badge" | "rail";
}) {
  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label="Abrir Nossa Missão"
        className="group relative flex min-h-[2.6rem] items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-100/45 bg-gradient-to-r from-cyan-500/35 via-sky-950/40 to-amber-300/25 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:border-cyan-50/65 hover:from-cyan-400/42"
      >
        <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan-100/45 bg-cyan-300/30 text-cyan-50">
          <HeartHandshake className="h-3.5 w-3.5" strokeWidth={2.1} />
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-200/80 opacity-70" />
            <span className="relative h-2 w-2 rounded-full bg-cyan-100" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold leading-none text-white">Nossa Missão</span>
          <span className="mt-0.5 block text-[9px] leading-none text-cyan-50/85">Por que existimos</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label="Abrir Nossa Missão"
      className="group relative inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-200/35 bg-white/10 px-2.5 py-1.5 text-left shadow-[0_8px_24px_-16px_rgba(34,211,238,0.85),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md transition hover:border-cyan-100/55 hover:bg-white/16"
    >
      <span className="pointer-events-none absolute -inset-1 rounded-full bg-cyan-300/15 opacity-70 blur-md transition group-hover:opacity-100" />
      <span className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full border border-cyan-100/30 bg-cyan-300/15 text-cyan-50">
        <HeartHandshake className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-200/80 opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-cyan-100 shadow-[0_0_8px_rgba(165,243,252,0.95)]" />
        </span>
      </span>
      <span className="relative min-w-0">
        <span className="block truncate text-[11px] font-semibold leading-none tracking-wide text-white">
          Nossa Missão
        </span>
        <span className="mt-0.5 block truncate text-[9px] leading-none text-cyan-50/70">
          Praia Alerta
        </span>
      </span>
    </button>
  );
}

export function MissionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mission-root"
          className="absolute inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.button
            type="button"
            aria-label="Fechar missão"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-title"
            className="relative flex max-h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-cyan-100/35 bg-sky-700/90 shadow-[0_-24px_80px_-28px_rgba(14,165,233,0.45)] backdrop-blur-2xl sm:max-w-[26rem] sm:rounded-[1.75rem]"
            initial={{ y: "108%", opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "108%", opacity: 0.75 }}
            transition={spring}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(120% 55% at 50% -8%, rgba(34,211,238,0.22), transparent 55%), radial-gradient(90% 40% at 80% 0%, rgba(251,191,36,0.16), transparent 50%)",
              }}
            />

            <div className="relative flex justify-center pb-1 pt-3 sm:hidden" aria-hidden>
              <span className="h-1.5 w-12 rounded-full bg-white/30" />
            </div>

            <header className="relative z-10 flex items-start gap-3 px-5 pb-3 pt-2 sm:pt-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                  Praia Alerta Alegretto
                </p>
                <h2
                  id="mission-title"
                  className="mt-1.5 bg-gradient-to-r from-amber-100 via-cyan-50 to-sky-200 bg-clip-text text-[1.35rem] font-semibold leading-snug text-transparent"
                >
                  Nossa missão
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/16"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <p className="font-serif text-[1.35rem] leading-snug text-white">
                Nossa missão não é apenas sobre o mar, a areia ou a praia. Nossa missão é sobre a{" "}
                <span className="bg-gradient-to-r from-amber-200 to-cyan-100 bg-clip-text font-semibold text-transparent">
                  VIDA
                </span>
                !
              </p>

              <div className="mt-5 space-y-4 text-[14.5px] leading-relaxed text-white/82">
                <p>
                  É sobre o valor de cada pessoa, de cada criança, de cada família e de cada turista que
                  chega à nossa querida Guarapari.
                </p>
                <p>
                  O <strong className="font-semibold text-white">Praia Alerta Alegretto</strong> nasceu com
                  o propósito de prevenir acidentes, orientar visitantes, proteger nossas crianças,
                  valorizar nossos trabalhadores e preservar as belezas naturais e culturais da nossa
                  cidade.
                </p>
                <p>
                  Queremos que cada pessoa que chegue à Praia do Morro encontre não apenas um lugar
                  bonito para descansar, mas também informação, orientação, acolhimento e segurança.
                </p>
                <p>
                  Nossa missão é aproximar pessoas, facilitar o acesso à informação e contribuir para
                  uma praia mais humana, organizada e segura.
                </p>
              </div>

              <blockquote className="relative mt-6 overflow-hidden rounded-3xl border border-amber-100/25 bg-gradient-to-br from-amber-300/15 via-white/5 to-cyan-300/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <span
                  className="pointer-events-none absolute -left-2 top-3 font-serif text-5xl leading-none text-amber-200/35"
                  aria-hidden
                >
                  “
                </span>
                <p className="relative text-[14.5px] font-medium leading-relaxed text-amber-50">
                  Porque uma vida não tem preço. Um pequeno alerta pode evitar um grande acidente. Uma
                  simples orientação pode proteger uma família.
                </p>
              </blockquote>

              <p className="mt-6 pb-2 text-[14.5px] leading-relaxed text-white/88">
                O <strong className="font-semibold text-white">Praia Alerta Alegretto</strong> não é apenas
                um aplicativo. É um compromisso com a vida, com as pessoas e com o futuro de Guarapari.
              </p>
            </div>

            <div className="relative z-10 border-t border-white/10 bg-sky-800/55 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
              <button
                type="button"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full border border-cyan-100/30 bg-gradient-to-r from-cyan-300/90 via-sky-200 to-amber-100 px-4 py-3.5 text-[15px] font-semibold text-slate-950 shadow-[0_12px_30px_-16px_rgba(125,211,252,0.9)] transition hover:brightness-105 active:scale-[0.99]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
