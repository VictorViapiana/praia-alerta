"use client";

import { BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { GuaraPose } from "./guara-pose";
import {
  NOTIFY_SOFT_KEY,
  readNotifySoftChoice,
  requestNativeNotifyPermission,
  writeNotifySoftChoice,
  type NotifySoftChoice,
} from "./orla-notify";

/**
 * Soft prompt: pergunta na nossa UI antes do dialog nativo do SO.
 * Só chama Notification.requestPermission se o usuário aceitar aqui.
 */
export function NotifySoftPrompt({ ready }: { ready: boolean }) {
  const [choice, setChoice] = useState<NotifySoftChoice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const stored = readNotifySoftChoice();
    setChoice(stored);
    if (stored !== "unset") return;
    if (typeof Notification !== "undefined" && Notification.permission !== "default") {
      writeNotifySoftChoice(Notification.permission === "granted" ? "accepted" : "declined");
      setChoice(Notification.permission === "granted" ? "accepted" : "declined");
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [ready]);

  if (!open || choice !== "unset") return null;

  const accept = async () => {
    writeNotifySoftChoice("accepted");
    setChoice("accepted");
    setOpen(false);
    await requestNativeNotifyPermission();
  };

  const decline = () => {
    writeNotifySoftChoice("declined");
    setChoice("declined");
    setOpen(false);
  };

  return (
    <div
      className="absolute inset-x-3 z-[95] flex justify-center"
      style={{ bottom: "max(calc(9rem + 16px), calc(env(safe-area-inset-bottom, 0px) + 8rem + 16px))" }}
      data-map-ui
      role="dialog"
      aria-label="Ativar avisos da orla"
    >
      <div className="w-full max-w-[22rem] overflow-hidden rounded-[22px] border border-white/25 bg-[#102028]/96 p-3.5 text-white shadow-[0_20px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-start gap-2.5">
          <GuaraPose
            pose="avisos"
            alt=""
            width={72}
            height={85}
            priority
            className="mt-0.5 h-[4.25rem] w-auto shrink-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.4)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug">Quer avisos da orla?</p>
            <p className="mt-1 text-[11px] leading-snug text-white/65">
              O Guará fica de olho no Marlim, Golfinho, quiosques e rampa. Você escolhe — só ativamos a
              permissão do celular se você aceitar.
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
            <BellOff className="h-3.5 w-3.5" />
            Agora não
          </button>
          <button
            type="button"
            onClick={() => void accept()}
            className="rounded-full bg-[#0e76a8] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(14,118,168,0.85)]"
          >
            Quero avisos
          </button>
        </div>
        <p className="mt-2 text-center text-[9px] text-white/35" data-soft-key={NOTIFY_SOFT_KEY}>
          Preferência salva neste aparelho
        </p>
      </div>
    </div>
  );
}
