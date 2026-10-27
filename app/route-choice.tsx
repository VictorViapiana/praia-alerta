"use client";

import { Bike, Car, Footprints, Navigation, Plus } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import type { TravelMode, WalkPoint } from "./walk-route";

type RouteActions = {
  active: boolean;
  destinationId?: string;
  pendingId: string | null;
  pendingStep: "action" | "mode" | null;
  summary: { label: string; detail: string; note: string } | null;
  ask: (place: WalkPoint) => void;
  pickMode: (mode: TravelMode) => void;
  beginFresh: () => void;
  addStop: () => void;
  stop: () => void;
  speak: () => void;
  locate: () => void;
  markOrigin: () => void;
  needsOrigin: boolean;
  armingOrigin: boolean;
};

const RouteContext = createContext<RouteActions | null>(null);

export function RouteActionsProvider({ value, children }: { value: RouteActions; children: ReactNode }) {
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

const MODES: { id: TravelMode; label: string; hint: string; icon: typeof Car }[] = [
  { id: "foot", label: "A pé", hint: "dois sentidos", icon: Footprints },
  { id: "bike", label: "Bike", hint: "ciclovia", icon: Bike },
  { id: "car", label: "Carro", hint: "mão da via", icon: Car },
];

export function RouteChoice({ place, tone = "dark" }: { place: WalkPoint; tone?: "dark" | "light" | "sheet" }) {
  const actions = useContext(RouteContext);
  if (!actions) return null;
  const { active, destinationId, pendingId, pendingStep, summary, ask, pickMode, beginFresh, addStop, stop, speak, locate, markOrigin, needsOrigin, armingOrigin } = actions;
  const open = pendingId === place.id;
  const here = Boolean(place.id && destinationId === place.id);
  const light = tone === "light";
  const quiet = light ? "text-neutral-500" : "text-white/55";
  const strong = light ? "text-[#142018]" : "text-white";

  if (here && !open) {
    return (
      <div className={`mt-2 rounded-2xl px-2.5 py-2 ${light ? "bg-neutral-100" : "bg-white/10"}`} onPointerDown={(event) => event.stopPropagation()}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${light ? "text-[#e11d48]" : "text-amber-100"}`}>{summary?.label ?? "Rota em andamento"}</p>
        {summary?.detail && <p className={`mt-1 text-[12px] font-semibold leading-snug ${strong}`}>{summary.detail}</p>}
        {summary?.note && <p className={`mt-0.5 text-[10px] leading-snug ${quiet}`}>{summary.note}</p>}
        {needsOrigin && (
          <div className="mt-2 flex gap-1">
            <button type="button" onClick={(event) => { event.stopPropagation(); locate(); }} className="rounded-full bg-[#082E84] px-2 py-1 text-[10px] font-semibold text-white">
              {armingOrigin ? "Segure o mapa" : "Minha localização"}
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); markOrigin(); }} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${light ? "bg-white text-[#142018]" : "bg-white/15 text-white"}`}>
              Marcar partida
            </button>
          </div>
        )}
        <div className="mt-2 flex gap-1">
          <button type="button" onClick={(event) => { event.stopPropagation(); speak(); }} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${light ? "bg-[#142018] text-white" : "bg-white text-[#142018]"}`}>
            Ouvir
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); stop(); }} className="rounded-full bg-[#e11d48] px-2 py-1 text-[10px] font-semibold text-white">
            Parar rota
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          ask(place);
        }}
        className={
          light
            ? "mt-2 flex w-full items-center gap-2 rounded-2xl bg-[#142018] px-2.5 py-2 text-left text-white shadow-[0_8px_18px_rgba(20,32,24,0.18)]"
            : "mt-2 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-2.5 py-2 text-left text-white"
        }
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e11d48] text-white">
          <Navigation className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-snug">Ir até aqui</span>
          <span className={`mt-0.5 block whitespace-nowrap text-[12px] leading-snug ${light ? "text-white/80" : "text-white/70"}`}>A pé, bicicleta ou carro</span>
        </span>
      </button>
    );
  }

  if (pendingStep === "action") {
    return (
      <div className="mt-2" onPointerDown={(event) => event.stopPropagation()}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${quiet}`}>Este lugar entra como</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              beginFresh();
            }}
            className="rounded-xl bg-[#e11d48] px-2 py-2 text-[11px] font-semibold text-white"
          >
            Nova rota
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              addStop();
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold ${light ? "bg-neutral-100 text-[#142018]" : "bg-white/10 text-white"}`}
          >
            <Plus className="h-3 w-3" />
            Parada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2" onPointerDown={(event) => event.stopPropagation()}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${quiet}`}>Como você vai?</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {MODES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                pickMode(item.id);
              }}
              className={`flex flex-col items-center rounded-xl px-1 py-1.5 ${light ? "bg-neutral-100" : "bg-white/10"}`}
            >
              <Icon className={`h-3.5 w-3.5 ${strong}`} />
              <span className={`mt-0.5 text-[11px] font-semibold ${strong}`}>{item.label}</span>
              <span className={`text-[9px] leading-none ${quiet}`}>{item.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
