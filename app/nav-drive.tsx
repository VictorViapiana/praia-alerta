"use client";

import { LocateFixed, Route, Volume2, X } from "lucide-react";
import { formatDistance, formatWalk, modeLabel, type TravelMode } from "./walk-route";

const TURN: Record<string, number> = {
  left: -90,
  right: 90,
  "slight left": -38,
  "slight right": 38,
  "sharp left": -135,
  "sharp right": 135,
  uturn: 180,
  roundabout: 40,
  straight: 0,
  depart: 0,
  arrive: 0,
};

function ManeuverArrow({ modifier, className }: { modifier: string; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ transform: `rotate(${TURN[modifier] ?? 0}deg)` }} aria-hidden>
      <path d="M12 21V4M12 4 5 11M12 4l7 7" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavDrive({
  mode,
  destination,
  routing,
  recalculating,
  arrived,
  live,
  following,
  remainingMeters,
  remainingSeconds,
  arrival,
  maneuver,
  after,
  needsOrigin,
  armingOrigin,
  onToggleFollow,
  onStop,
  onSpeak,
  onLocate,
  onMarkOrigin,
}: {
  mode: TravelMode;
  destination: string;
  routing: boolean;
  recalculating: boolean;
  arrived: boolean;
  live: boolean;
  following: boolean;
  remainingMeters: number;
  remainingSeconds: number;
  arrival: string;
  maneuver: { instruction: string; street: string; modifier: string; meters: number } | null;
  after: { instruction: string; street: string; modifier: string; meters: number } | null;
  needsOrigin: boolean;
  armingOrigin: boolean;
  onToggleFollow: () => void;
  onStop: () => void;
  onSpeak: () => void;
  onLocate: () => void;
  onMarkOrigin: () => void;
}) {
  const distance = arrived ? "Chegou" : !maneuver ? (routing ? "…" : "Siga") : maneuver.meters < 35 ? "Agora" : formatDistance(maneuver.meters);
  const instruction = arrived ? destination : maneuver?.instruction ?? (routing ? "Traçando as ruas" : "Siga em frente");
  const street = arrived ? "Você está no destino" : maneuver?.street || "";

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-[65] bg-[#0b0d10] text-white">
        <div
          className="flex items-center gap-3 px-4 pb-3 pr-16"
          style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))" }}
        >
          <ManeuverArrow modifier={arrived ? "arrive" : maneuver?.modifier ?? "straight"} className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between gap-2">
              <p className="text-[2.35rem] font-black leading-none tracking-tight">{distance}</p>
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{live ? "Ao vivo" : modeLabel(mode)}</span>
            </div>
            <p className="mt-1 truncate text-[16px] font-semibold leading-tight">{instruction}</p>
            {street && <p className="line-clamp-2 text-[13px] leading-snug text-white/60">{street}</p>}
          </div>
        </div>
        {after && !arrived && (
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2 text-[13px]">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Em seguida</span>
            <ManeuverArrow modifier={after.modifier} className="h-4 w-4 shrink-0 text-white/80" />
            <span className="min-w-0 truncate text-white/80">{after.street || after.instruction}</span>
          </div>
        )}
        {recalculating && <p className="bg-amber-300 px-4 py-1.5 text-[12px] font-semibold text-[#1c1408]">Recalculando o caminho…</p>}
      </div>

      {!needsOrigin && (
        <div className="absolute bottom-[5.6rem] right-3 z-[66] flex flex-col gap-2">
          <button
            type="button"
            onClick={onSpeak}
            aria-label="Ouvir a próxima curva"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#0b0d10] text-white shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleFollow}
            aria-label={following ? "Ver o caminho inteiro" : "Voltar ao trecho da frente"}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#0b0d10] text-white shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
          >
            <Route className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[65] bg-white px-4 pb-3 pt-3 text-[#0b0d10] shadow-[0_-8px_24px_rgba(15,23,42,0.12)]">
        {needsOrigin ? (
          <div>
            <p className="text-[15px] font-semibold">Preciso de onde você está</p>
            <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">
              {armingOrigin ? "Segure o mapa no ponto de partida." : "Com a localização ligada, o mapa acompanha o trecho à sua frente."}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={onLocate} className="inline-flex items-center gap-1 rounded-full bg-[#0091ff] px-3 py-2 text-[12px] font-semibold text-white">
                <LocateFixed className="h-3.5 w-3.5" />
                Minha localização
              </button>
              <button type="button" onClick={onMarkOrigin} className="rounded-full bg-neutral-100 px-3 py-2 text-[12px] font-semibold text-neutral-700">
                Marcar partida
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[1.85rem] font-black leading-none">{arrived ? "Chegou" : formatWalk(remainingSeconds)}</p>
              <p className="mt-1 truncate text-[13px] text-neutral-500">
                {arrived ? destination : `${formatDistance(remainingMeters)} · ${destination}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[1.2rem] font-bold leading-none">{arrival}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Chegada</p>
            </div>
            <button
              type="button"
              onClick={onStop}
              aria-label="Encerrar navegação"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-[#0b0d10]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
