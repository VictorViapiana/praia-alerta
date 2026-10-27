"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { speakGuara, stopSpeaking } from "./voice";

// v2: o startOnMap antigo gravava essas chaves sem o usuário ver o tour
export const HOME_TOUR_KEY = "hasSeenGuaraTutorial_v2";
export const MAP_TOUR_KEY = "hasSeenGuaraMapTutorial_v2";

export type TourStep = {
  text: string;
  target: string | null;
  guara: "large" | "small";
  coach: string;
};

export const HOME_STEPS: TourStep[] = [
  {
    text: "Olá! Eu sou o Guará, o seu guia aqui na Praia do Morro! 🏖️ Deixe-me dar 2 avisos muito importantes antes de você aproveitar.",
    target: null,
    guara: "large",
    coach: "bottom-8 items-end",
  },
  {
    text: "Este é o botão de Criança Perdida. 👶 Ele avisa todos os quiosques e guarda-vidas da orla instantaneamente. Use APENAS se uma criança se perder de verdade!",
    target: "crianca",
    guara: "small",
    coach: "top-14 items-start",
  },
  {
    text: "E aqui embaixo fica o botão de Emergência. 🚨 Deslizar este botão aciona a Polícia e o Resgate. Trotes e alarmes falsos são crime, então use com total responsabilidade, ok?",
    target: "sos",
    guara: "small",
    coach: "bottom-[8.5rem] items-end",
  },
  {
    text: "Tudo certo! Pode contar comigo. Clique em concluir e aproveite a praia com segurança!",
    target: null,
    guara: "small",
    coach: "bottom-6 items-end",
  },
];

export const MAP_STEPS: TourStep[] = [
  {
    text: "Chegamos na orla! Eu te mostro o mapa em poucos toques, para você achar gente e registrar a praia.",
    target: null,
    guara: "large",
    coach: "bottom-[11rem] items-end",
  },
  {
    text: "Escreva aqui o nome de um quiosque, de um ambulante ou a palavra escuna. Eu levo o mapa até o ponto.",
    target: "map-search",
    guara: "small",
    coach: "top-16 items-start",
  },
  {
    text: "Se preferir, filtre. Quiosques, ambulantes, duchas, hotéis e sorvetes. Toque de novo no mesmo filtro para voltar à vista geral.",
    target: "map-filters",
    guara: "small",
    coach: "top-16 items-start",
  },
  {
    text: "Este botão abre a câmera com a moldura Eu amo Guarapari. A foto fica com você.",
    target: "map-camera",
    guara: "small",
    coach: "top-16 items-start",
  },
  {
    text: "Este círculo branco centraliza o mapa em você: calçadão embaixo dos pés, areia na frente.",
    target: "map-location",
    guara: "small",
    coach: "bottom-[11rem] items-end",
  },
  {
    text: "Aproxima com dois dedos. Os quiosques e os carrinhos nascem na areia. Toque no carrinho para ver o cardápio e chamar no WhatsApp.",
    target: null,
    guara: "small",
    coach: "bottom-[11rem] items-end",
  },
  {
    text: "É isso. A orla é sua. Bom passeio na Praia do Morro!",
    target: null,
    guara: "large",
    coach: "bottom-[11rem] items-end",
  },
];

type Hole = { x: number; y: number; width: number; height: number; radius: string };

function readSeen(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function Spotlight({ hole }: { hole: Hole | null }) {
  // sem backdrop-blur: no celular ele trava a entrada do Guará
  if (!hole) return <div className="absolute inset-0 bg-black/72" />;

  const { x, y, width, height, radius } = hole;
  const radiusPx = Math.min(Number.parseFloat(radius) || 0, width / 2, height / 2);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute bg-transparent"
          style={{
            left: x,
            top: y,
            width,
            height,
            borderRadius: radiusPx,
            boxShadow: "0 0 0 100vmax rgba(0,0,0,0.72)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute"
        style={{
          left: x,
          top: y,
          width,
          height,
          borderRadius: radiusPx,
          boxShadow: "inset 0 0 0 2px #fff",
        }}
      />
    </>
  );
}

function coachPlace(hole: Hole | null): { top: number; left: number; right: number } {
  if (!hole) return { top: 16, left: 12, right: 12 };
  const above = hole.y > 230;
  return {
    top: above ? Math.max(12, hole.y - 138) : hole.y + hole.height + 14,
    left: 12,
    right: 12,
  };
}

function CoachBubble({
  step,
  text,
  narrating,
  last,
  count,
  tail,
  onToggle,
  onNext,
}: {
  step: number;
  text: string;
  narrating: boolean;
  last: boolean;
  count: number;
  tail: "center" | "bottom" | "down";
  onToggle: () => void;
  onNext: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`relative min-w-0 rounded-[24px] bg-white px-3.5 py-3 text-[#1c120c] shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${tail === "down" ? "mb-3 w-full" : "mb-2 flex-1"}`}
      >
        <span
          className={`absolute h-3.5 w-3.5 rotate-45 bg-white ${
            tail === "down" ? "-bottom-1.5 left-1/2 -translate-x-1/2" : tail === "center" ? "-left-1.5 top-1/2 -translate-y-1/2" : "-left-1.5 bottom-5"
          }`}
        />
        <p className="text-[14px] leading-snug">{text}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="text-[11px] font-semibold text-[#e11d48]"
            >
              {narrating ? "Pausar" : "Ouvir"}
            </button>
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: count }, (_, index) => (
                <span key={index} className={`h-1.5 rounded-full ${index === step ? "w-4 bg-[#e11d48]" : "w-1.5 bg-black/15"}`} />
              ))}
            </span>
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className="shrink-0 whitespace-nowrap rounded-full bg-[#e11d48] px-3.5 py-1.5 text-[12px] font-semibold text-white"
          >
            {last ? "Começar a usar" : "Próximo >>"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function GuaraOnboarding({
  rootRef,
  steps,
  storageKey,
  replay = 0,
  reveal = true,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  steps: TourStep[];
  storageKey: string;
  replay?: number;
  /** quando false, só pré-aquece; a UI do tour espera a splash sumir */
  reveal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [hole, setHole] = useState<Hole | null>(null);
  const [narrating, setNarrating] = useState(false);
  const index = Math.min(step, Math.max(steps.length - 1, 0));
  const current = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    if (readSeen(storageKey)) return;
    setPending(true);
  }, [storageKey]);

  useEffect(() => {
    if (replay < 1) return;
    setStep(0);
    setPending(true);
  }, [replay]);

  useEffect(() => {
    if (!pending || !reveal || open) return undefined;
    // um frame depois da splash sair: evita tilt na transição
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pending, reveal, open]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const target = current?.target;
    if (!root || !target) {
      setHole(null);
      return;
    }
    const node = root.querySelector<HTMLElement>(`[data-onboard="${target}"]`);
    if (!node) {
      setHole(null);
      return;
    }
    const box = node.getBoundingClientRect();
    const host = root.getBoundingClientRect();
    const frame = getComputedStyle(root);
    const borderLeft = Number.parseFloat(frame.borderLeftWidth) || 0;
    const borderTop = Number.parseFloat(frame.borderTopWidth) || 0;
    setHole({
      x: box.left - host.left - borderLeft,
      y: box.top - host.top - borderTop,
      width: box.width,
      height: box.height,
      radius: getComputedStyle(node).borderTopLeftRadius || "16px",
    });
  }, [current?.target, rootRef]);

  useLayoutEffect(() => {
    if (!open || !current) return;
    const root = rootRef.current;
    const target = current.target;
    if (root && target) {
      root.querySelector<HTMLElement>(`[data-onboard="${target}"]`)?.scrollIntoView({
        block: target === "sos" ? "nearest" : "center",
        inline: "nearest",
      });
    }
    measure();
    const timer = window.setTimeout(measure, 280);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [open, step, current, measure, rootRef]);

  if (!current) return null;

  const finish = () => {
    stopSpeaking();
    setNarrating(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore private mode */
    }
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    stopSpeaking();
    setNarrating(false);
    if (last) finish();
    else setStep((value) => value + 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={storageKey}
          role="dialog"
          aria-modal="true"
          aria-label="Tutorial do Guará"
          className="absolute inset-0 z-[80] cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={next}
        >
          <Spotlight hole={hole} />
          {!current.target ? (
            <div className="pointer-events-none absolute inset-0 z-[90] flex items-center justify-center px-6">
              <div className="pointer-events-auto flex max-h-full w-full max-w-[19.5rem] flex-col items-center">
                <CoachBubble
                  step={step}
                  text={current.text}
                  narrating={narrating}
                  last={last}
                  count={steps.length}
                  tail="down"
                  onToggle={() => {
                    if (narrating) {
                      stopSpeaking();
                      setNarrating(false);
                      return;
                    }
                    setNarrating(true);
                    speakGuara(current.text, () => setNarrating(false));
                  }}
                  onNext={next}
                />
                <img
                  src="/guara-inteiro.png?v=1"
                  alt="Guará"
                  decoding="async"
                  fetchPriority="high"
                  className="guara-float-lg h-auto max-h-[min(19rem,50cqh)] w-auto max-w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute z-[90] flex items-end gap-2" style={coachPlace(hole)}>
              <img
                src="/guara.png?v=3"
                alt="Guará"
                decoding="async"
                className="guara-float pointer-events-none h-12 w-auto shrink-0 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
              />
              <div className="pointer-events-auto min-w-0 flex-1">
                <CoachBubble
                  step={step}
                  text={current.text}
                  narrating={narrating}
                  last={last}
                  count={steps.length}
                  tail="bottom"
                  onToggle={() => {
                    if (narrating) {
                      stopSpeaking();
                      setNarrating(false);
                      return;
                    }
                    setNarrating(true);
                    speakGuara(current.text, () => setNarrating(false));
                  }}
                  onNext={next}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
