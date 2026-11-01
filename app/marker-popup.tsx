"use client";

import { motion } from "framer-motion";
import {
  Accessibility,
  BadgeCheck,
  ChevronRight,
  Music2,
  ShowerHead,
  Star,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";
import { CARRINHO_SRC, ESCUNA_POINT, escunasPatrocinadoras, ESCUNA_SRC, type Ambulante, type PerkId, type Place } from "./places";
import { RouteChoice } from "./route-choice";

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };

function placeMark(name: string) {
  const label = (name.split("·")[1] ?? name).trim();
  const words = label.split(/\s+/).filter((word) => !/^(d[aeo]s?|e)$/i.test(word));
  const letters = words.map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return letters.length > 1 ? letters : label.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

const PERK_META: Record<PerkId, { label: string; icon: typeof Wifi }> = {
  shower: { label: "Chuveiro", icon: ShowerHead },
  wifi: { label: "Wi-Fi", icon: Wifi },
  access: { label: "Acesso", icon: Accessibility },
  music: { label: "Música", icon: Music2 },
};

export function MarkerPopup({
  place,
  onOpen,
}: {
  place: Place;
  onOpen: () => void;
}) {
  if (!place.isSponsor) {
    return (
      <div className="absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-[228px] -translate-x-1/2">
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-left shadow-[0_10px_24px_rgba(28,25,23,0.18)]">
          <p className="text-[14px] font-semibold leading-snug text-neutral-900">{place.name}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-neutral-600">{place.hours}</p>
          <RouteChoice place={{ id: place.id, lat: place.lat, lng: place.lng, name: place.name }} tone="light" />
        </div>
        <span className="mx-auto -mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r border-neutral-200 bg-white" />
      </div>
    );
  }

  return (
    <div data-map-ui className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-[232px] -translate-x-1/2">
      <div className="rounded-[22px] bg-gradient-to-br from-amber-200 via-orange-400 to-amber-500 p-[1.5px] shadow-[0_16px_36px_rgba(180,83,9,0.35)]">
        <div className="overflow-hidden rounded-[20px] bg-[#1c1208] text-left">
          <div className="relative h-[52px]">
            <img src={place.cover} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#1c1208] via-[#1c1208]/35 to-black/10" />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#1c1208]/80 px-2 py-1 text-[11px] font-bold leading-none text-amber-50">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              Patrocinador
            </span>
          </div>
          <div className="px-2.5 pb-2.5">
            <p className="text-[15px] font-semibold leading-snug text-white">{place.name}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-white/70">{place.hours}</p>
            {place.tag && (
              <p className="mt-1.5 inline-flex rounded-full bg-amber-300/15 px-2 py-1 text-[12px] font-medium leading-none text-amber-50">
                {place.tag}
              </p>
            )}
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              className="relative mt-2 flex w-full items-center justify-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-200 to-orange-300 px-3 py-2.5 text-[13px] font-semibold leading-none text-[#3a2208]"
            >
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                animate={{ x: ["-120%", "220%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
              />
              <span className="relative">Ver cardápio e fotos</span>
              <ChevronRight className="relative h-3.5 w-3.5" />
            </button>
            <RouteChoice place={{ id: place.id, lat: place.lat, lng: place.lng, name: place.name }} />
          </div>
        </div>
      </div>
      <span className="mx-auto -mt-1 block h-3 w-3 rotate-45 bg-orange-400" />
    </div>
  );
}

export function SponsorSheet({ place, onClose }: { place: Place; onClose: () => void }) {
  const [called, setCalled] = useState(false);
  const initials = placeMark(place.name);

  return (
    <motion.div
      data-map-ui
      className="absolute inset-0 z-[110]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-label={place.name}
        className="absolute inset-x-0 bottom-0 flex h-[70%] flex-col overflow-hidden rounded-t-[28px] bg-[#120c08] shadow-[0_-24px_60px_rgba(0,0,0,0.45)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
      >
        <div className="relative h-[148px] shrink-0">
          <img src={place.cover} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-transparent to-black/25" />
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute -bottom-5 left-4 grid h-14 w-14 place-items-center rounded-2xl border-2 border-amber-200 bg-[#1c1208] text-sm font-semibold text-amber-100 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            {initials || "PA"}
          </span>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                Patrocinador
              </p>
              <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-white">{place.name}</h2>
              <p className="mt-1 text-xs text-white/55">{place.hours}</p>
            </div>
          </div>
          {place.tag && (
            <p className="mt-3 inline-flex rounded-full border border-amber-200/30 bg-amber-300/10 px-2.5 py-1 text-[11px] text-amber-50">
              {place.tag}
            </p>
          )}

          <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.16em] text-white/40">Top 3 do cardápio</p>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {place.menu?.map((item) => (
              <article key={item.name} className="w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img src={item.photo} alt="" className="h-[92px] w-full object-cover" />
                <div className="px-2.5 py-2">
                  <p className="text-[12px] font-semibold leading-tight text-white">{item.name}</p>
                  <p className="mt-1 text-[12px] font-medium text-amber-200">{item.price}</p>
                </div>
              </article>
            ))}
          </div>

          {place.perks && place.perks.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.16em] text-white/40">No lugar</p>
              <div className="flex flex-wrap gap-2">
                {place.perks.map((perk) => {
                  const meta = PERK_META[perk];
                  const Icon = meta.icon;
                  return (
                    <span
                      key={perk}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 text-[11px] text-white/80"
                    >
                      <Icon className="h-3.5 w-3.5 text-amber-100" />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 bg-[#120c08]/95 px-4 py-3 backdrop-blur-md">
          <RouteChoice place={{ id: place.id, lat: place.lat, lng: place.lng, name: place.name }} tone="sheet" />
          <button
            type="button"
            onClick={() => setCalled(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-[#04210f]"
          >
            {called ? "Conversa pronta no WhatsApp" : "Chamar no WhatsApp"}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function EscunaSheet({ onClose }: { onClose: () => void }) {
  const [calledId, setCalledId] = useState<string | null>(null);

  return (
    <motion.div
      data-map-ui
      className="absolute inset-0 z-[110]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-label="Ponto das Escunas"
        className="absolute inset-x-0 bottom-0 flex h-[70%] flex-col overflow-hidden rounded-t-[28px] bg-[#120c08] shadow-[0_-24px_60px_rgba(0,0,0,0.45)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
      >
        <div className="relative h-[148px] shrink-0">
          <img src="/guarapari/praia-enseada.jpg" alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-transparent to-black/25" />
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute -bottom-5 left-4 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-2 border-amber-200 bg-[#1c1208] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <img src={ESCUNA_SRC} alt="" className="h-12 w-12 object-contain" />
          </span>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-8">
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Patrocinador
          </p>
          <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-white">Ponto das Escunas</h2>
          <p className="mt-1 text-xs text-white/55">Canal de Guarapari · passeios turísticos</p>
          <RouteChoice place={{ id: "escunas", lat: ESCUNA_POINT.lat, lng: ESCUNA_POINT.lng, name: "Ponto das Escunas" }} tone="sheet" />

          <div className="mt-4 space-y-2.5">
            {escunasPatrocinadoras.map((escuna) => {
              const called = calledId === escuna.id;
              return (
                <article key={escuna.id} className="overflow-hidden rounded-2xl border border-amber-200/25 bg-white/5">
                  <div className="flex gap-2.5 p-2">
                    <img src={escuna.photo} alt="" className="h-[84px] w-[84px] shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">{escuna.tag}</p>
                      <h3 className="mt-0.5 text-[15px] font-semibold leading-tight text-white">{escuna.name}</h3>
                      <p className="mt-1 text-[12px] leading-snug text-white/70">{escuna.roteiro}</p>
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <button
                      type="button"
                      onClick={() => setCalledId(escuna.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-[13px] font-semibold text-[#04210f]"
                    >
                      {called ? "Conversa pronta no WhatsApp" : escuna.whatsapp}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function AmbulanteSheet({ vendor, onClose }: { vendor: Ambulante; onClose: () => void }) {
  const [called, setCalled] = useState(false);

  return (
    <motion.div
      data-map-ui
      className="absolute inset-0 z-[110]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-label={vendor.name}
        className="absolute inset-x-0 bottom-0 flex h-[70%] flex-col overflow-hidden rounded-t-[28px] bg-[#120c08] shadow-[0_-24px_60px_rgba(0,0,0,0.45)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
      >
        <div className="relative h-[148px] shrink-0">
          <img src={vendor.cover} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-transparent to-black/25" />
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute -bottom-5 left-4 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-2 border-amber-200 bg-[#1c1208] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <img src={CARRINHO_SRC} alt="" className="h-12 w-12 object-contain" />
          </span>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-8">
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Patrocinador
          </p>
          <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-white">{vendor.name}</h2>
          <p className="mt-1 text-xs text-white/55">{vendor.hours}</p>
          <p className="mt-3 text-sm leading-snug text-white/75">{vendor.about}</p>
          <p className="mt-3 inline-flex rounded-full border border-amber-200/30 bg-amber-300/10 px-2.5 py-1 text-[11px] text-amber-50">
            {vendor.walks ? "Andando pela faixa de areia" : "Parado na areia"}
          </p>

          <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.16em] text-white/40">Cardápio</p>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {vendor.menu.map((item) => (
              <article key={item.name} className="w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img src={item.photo} alt="" className="h-[92px] w-full object-cover" />
                <div className="px-2.5 py-2">
                  <p className="text-[12px] font-semibold leading-tight text-white">{item.name}</p>
                  <p className="mt-1 text-[12px] font-medium text-amber-200">{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 bg-[#120c08]/95 px-4 py-3 backdrop-blur-md">
          <RouteChoice place={{ id: vendor.id, lat: vendor.lat, lng: vendor.lng, name: vendor.name }} tone="sheet" />
          <button
            type="button"
            onClick={() => setCalled(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-[#04210f]"
          >
            {called ? "Conversa pronta no WhatsApp" : vendor.whatsapp}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
