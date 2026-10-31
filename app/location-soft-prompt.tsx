"use client";

import { LocateFixed, MapPinOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  LOCATION_SOFT_KEY,
  readLocationSoftChoice,
  writeLocationSoftChoice,
  type LocationSoftChoice,
} from "./location-soft";

/**
 * Soft prompt: pergunta na nossa UI antes do dialog nativo de localização/orientação.
 * Só chama o callback de aceite (geolocation + compass) se o usuário aceitar aqui.
 */
export function LocationSoftPrompt({
  ready,
  forceOpen = false,
  onAccepted,
  onDeclined,
  onDismissed,
}: {
  ready: boolean;
  /** Reabre o modal (ex.: toque em Minha localização após "agora não"). */
  forceOpen?: boolean;
  onAccepted: () => void;
  onDeclined?: () => void;
  onDismissed?: () => void;
}) {
  const [choice, setChoice] = useState<LocationSoftChoice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const stored = readLocationSoftChoice();
    setChoice(stored);
    if (forceOpen) {
      setOpen(true);
      return;
    }
    if (stored !== "unset") return;
    // Depois do soft prompt de avisos (~0.9s) para não empilhar modais.
    const t = window.setTimeout(() => setOpen(true), 2800);
    return () => window.clearTimeout(t);
  }, [ready, forceOpen]);

  if (!open) return null;
  if (!forceOpen && choice !== "unset") return null;

  const accept = () => {
    writeLocationSoftChoice("accepted");
    setChoice("accepted");
    setOpen(false);
    onAccepted();
    onDismissed?.();
  };

  const decline = () => {
    writeLocationSoftChoice("declined");
    setChoice("declined");
    setOpen(false);
    onDeclined?.();
    onDismissed?.();
  };

  return (
    <div
      className="absolute inset-x-3 z-[96] flex justify-center"
      style={{ bottom: "max(11.5rem, calc(env(safe-area-inset-bottom, 0px) + 10.5rem))" }}
      data-map-ui
      role="dialog"
      aria-label="Ativar localização da orla"
    >
      <div className="w-full max-w-[22rem] rounded-[22px] border border-white/25 bg-[#102028]/96 p-3.5 text-white shadow-[0_20px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/25 text-amber-100">
            <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug">Quer que o Guará te ache na orla?</p>
            <p className="mt-1 text-[11px] leading-snug text-white/65">
              Usamos localização e orientação só pra te mostrar no mapa e avisar perto dos pontos. Você
              escolhe — o celular só pergunta se você aceitar aqui.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={decline}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={decline}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/90"
          >
            <MapPinOff className="h-3.5 w-3.5" />
            Agora não
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-[#0e76a8] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(14,118,168,0.85)]"
          >
            Quero localização
          </button>
        </div>
        <p className="mt-2 text-center text-[9px] text-white/35" data-soft-key={LOCATION_SOFT_KEY}>
          Preferência salva neste aparelho
        </p>
      </div>
    </div>
  );
}
