"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fold } from "./coast";
import { AMBULANTES, CARRINHO_SRC, ESCUNA_POINT, PLACES, SHOWERS, escunasPatrocinadoras, type Place } from "./places";
import { RAMPA_NOTE, RAMPA_PRINCIPAL } from "./rampas";
import type { PinKind } from "./page-types";

type MapFilter = "neutro" | PinKind;

type FilterChip = { id: MapFilter; label: string; emoji: string };

export type MapMark = {
  lat: number;
  lng: number;
  placeId: string | null;
};

type Hit = {
  key: string;
  name: string;
  hours: string;
  detail: string;
  sponsor: boolean;
  vendor?: boolean;
  cover?: string;
  tag?: string;
  lat: number;
  lng: number;
  placeId: string | null;
};

const KIND_LABEL: Record<PinKind, string> = {
  quiosques: "Quiosque na areia",
  duchas: "Ducha pública",
  hoteis: "Hospedagem na avenida",
  sorveterias: "Sorveteria",
  parceiros: "Comércio da orla",
  ambulantes: "Ambulante credenciado",
};

const KIND_ALIASES: Record<PinKind, string[]> = {
  quiosques: ["quiosque", "quiosques"],
  duchas: ["ducha", "duchas", "chuveiro", "chuveiros"],
  hoteis: ["hotel", "hoteis", "pousada", "pousadas"],
  sorveterias: ["sorvete", "sorvetes", "sorveteria", "sorveterias"],
  parceiros: ["parceiro", "parceiros", "restaurante", "farmacia", "comercio"],
  ambulantes: ["ambulante", "ambulantes", "vendedor", "vendedores"],
};

const spring = { type: "spring" as const, stiffness: 340, damping: 32, mass: 0.82 };

function metersBetween(a: { lat: number; lng: number }, lat: number, lng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat - a.lat);
  const dLng = toRad(lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceLabel(user: { lat: number; lng: number } | null, lat: number, lng: number) {
  if (!user) return null;
  const meters = metersBetween(user, lat, lng);
  if (meters > 25000) return null;
  if (meters < 1000) return `a ${Math.max(20, Math.round(meters / 10) * 10)} m`;
  return `a ${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function spotOrder(name: string) {
  const number = name.match(/\d+/);
  return number ? Number(number[0]) : 1000;
}

function kindHit(kind: PinKind, query: string) {
  if (query.length < 3) return false;
  return KIND_ALIASES[kind].some((alias) => alias.includes(query) || query.includes(alias));
}

function placeHit(place: Place, query: string) {
  if (!query) return false;
  const blob = fold(`${place.name} ${place.tag ?? ""} ${place.hours}`);
  return blob.includes(query) || kindHit(place.mapKind, query);
}

function toPlaceHit(place: Place, user: { lat: number; lng: number } | null): Hit {
  const away = distanceLabel(user, place.lat, place.lng);
  return {
    key: place.id,
    name: place.name,
    hours: place.hours,
    detail: [KIND_LABEL[place.mapKind], away].filter(Boolean).join(" · "),
    sponsor: place.isSponsor,
    cover: place.cover,
    tag: place.tag,
    lat: place.lat,
    lng: place.lng,
    placeId: place.id,
  };
}

function resultsFor(
  query: string,
  filter: MapFilter,
  user: { lat: number; lng: number } | null,
): { hits: Hit[] } {
  const places = PLACES.filter((place) => filter === "neutro" || place.mapKind === filter).map((place) =>
    toPlaceHit(place, user),
  );
  const showers: Hit[] =
    filter === "neutro" || filter === "duchas"
      ? SHOWERS.map((shower) => {
          const away = distanceLabel(user, shower.lat, shower.lng);
          return {
            key: shower.id,
            name: shower.name,
            hours: "Pública",
            detail: ["Ducha na areia", away].filter(Boolean).join(" · "),
            sponsor: false,
            lat: shower.lat,
            lng: shower.lng,
            placeId: null,
          };
        })
      : [];

  const vendors: Hit[] =
    filter === "neutro" || filter === "ambulantes"
      ? AMBULANTES.filter((vendor) => vendor.isSponsor && vendor.isOnline).map((vendor) => {
          const away = distanceLabel(user, vendor.lat, vendor.lng);
          return {
            key: vendor.id,
            name: vendor.name,
            hours: "Na areia agora",
            detail: ["Ambulante credenciado", away].filter(Boolean).join(" · "),
            sponsor: true,
            vendor: true,
            tag: vendor.tag,
            lat: vendor.lat,
            lng: vendor.lng,
            placeId: vendor.id,
          };
        })
      : [];

  const escunaBlob = fold(
    `ponto das escunas canal passeio barco ${escunasPatrocinadoras.map((item) => `${item.name} ${item.roteiro}`).join(" ")}`,
  );
  const escunas: Hit[] =
    filter === "neutro" && (!query || escunaBlob.includes(query))
      ? [
          {
            key: ESCUNA_POINT.id,
            name: ESCUNA_POINT.name,
            hours: "Passeios no canal",
            detail: escunasPatrocinadoras.map((item) => item.name).join(" · "),
            sponsor: true,
            cover: "/guarapari/praia-enseada.jpg",
            tag: "Patrocinador",
            lat: ESCUNA_POINT.lat,
            lng: ESCUNA_POINT.lng,
            placeId: ESCUNA_POINT.id,
          },
        ]
      : [];

  const rampBlob = fold(`${RAMPA_PRINCIPAL.name} ${RAMPA_PRINCIPAL.detail} rampa acesso corredor livre`);
  const ramps: Hit[] =
    query && rampBlob.includes(query)
      ? [
          {
            key: RAMPA_PRINCIPAL.id,
            name: RAMPA_PRINCIPAL.name,
            hours: "Acesso à areia",
            detail: RAMPA_NOTE,
            sponsor: false,
            lat: RAMPA_PRINCIPAL.lat,
            lng: RAMPA_PRINCIPAL.lng,
            placeId: RAMPA_PRINCIPAL.id,
          },
        ]
      : [];

  const hits = (
    query
      ? [
          ...places.filter((hit) => {
            const place = PLACES.find((item) => item.id === hit.key);
            return place ? placeHit(place, query) : false;
          }),
          ...showers.filter((hit) => fold(hit.name).includes(query) || kindHit("duchas", query)),
          ...vendors.filter((hit) => fold(`${hit.name} ${hit.tag ?? ""}`).includes(query) || kindHit("ambulantes", query)),
          ...escunas,
          ...ramps,
        ]
      : [...places, ...showers, ...vendors, ...escunas]
  ).sort((a, b) => Number(b.sponsor) - Number(a.sponsor) || Number(Boolean(a.vendor)) - Number(Boolean(b.vendor)) || spotOrder(a.name) - spotOrder(b.name) || a.name.localeCompare(b.name, "pt"));

  return { hits };
}

function MarkButton({
  name,
  sponsor,
  onMark,
}: {
  name: string;
  sponsor: boolean;
  onMark: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Marcar ${name} no mapa`}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onMark}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
        sponsor
          ? "bg-gradient-to-r from-amber-200 to-orange-300 text-[#3a2208]"
          : "border border-white/25 bg-white/10 text-white"
      }`}
    >
      <MapPin className="h-3 w-3" />
      Marcar no mapa
    </button>
  );
}

function SponsorRow({ hit, onMark }: { hit: Hit; onMark: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={spring}
      className="sheen relative overflow-hidden rounded-2xl border border-amber-200/45 bg-gradient-to-br from-[#3a2712] via-[#241608] to-[#120d08] p-2.5 shadow-[0_14px_30px_-18px_rgba(245,158,11,0.9)]"
    >
      <div className="flex gap-2.5">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl">
          {hit.cover && <img src={hit.cover} alt="" className="h-full w-full object-cover" />}
          <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[#1c1208] text-amber-200 shadow-md">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">Patrocinador</p>
          <p className="truncate text-[14px] font-semibold leading-tight text-white">{hit.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-amber-100/80">
            {hit.tag ? `${hit.tag} · ` : ""}
            {hit.hours}
          </p>
          <p className="truncate text-[11px] text-white/55">{hit.detail}</p>
          <div className="mt-1.5">
            <MarkButton name={hit.name} sponsor onMark={onMark} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function VendorRow({ hit, onMark }: { hit: Hit; onMark: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="rounded-2xl border border-violet-300/40 bg-gradient-to-r from-violet-950/80 to-[#1a1020] px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span className="relative grid h-8 w-8 shrink-0 place-items-center">
          <img src={CARRINHO_SRC} alt="" className="h-8 w-8 object-contain" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{hit.name}</p>
          <p className="truncate text-[11px] text-violet-100/75">
            {hit.tag ? `${hit.tag} · ` : ""}
            {hit.detail}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <MarkButton name={hit.name} sponsor={false} onMark={onMark} />
      </div>
    </motion.article>
  );
}

function FreeRow({ hit, onMark }: { hit: Hit; onMark: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
    >
      <p className="truncate text-[13px] font-semibold text-white">{hit.name}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-white/60">
        {hit.hours}
        {hit.detail ? ` · ${hit.detail}` : ""}
      </p>
      <div className="mt-2">
        <MarkButton name={hit.name} sponsor={false} onMark={onMark} />
      </div>
    </motion.article>
  );
}

export function MapSearch({
  query,
  onQuery,
  filter,
  onFilter,
  filters,
  hint,
  user,
  onMark,
  onActiveChange,
}: {
  query: string;
  onQuery: (value: string) => void;
  filter: MapFilter;
  onFilter: (value: MapFilter) => void;
  filters: FilterChip[];
  hint: string;
  user: { lat: number; lng: number } | null;
  onMark: (mark: MapMark) => void;
  onActiveChange: (active: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const folded = fold(query.trim());
  const open = !collapsed && (focused || query.trim().length > 0);
  const { hits } = useMemo(() => resultsFor(folded, filter, user), [folded, filter, user]);
  const sponsors = hits.filter((hit) => hit.sponsor && !hit.vendor);
  const vendors = hits.filter((hit) => hit.vendor);
  const rest = hits.filter((hit) => !hit.sponsor && !hit.vendor);

  useEffect(() => {
    onActiveChange(open);
  }, [open, onActiveChange]);

  const closeSheet = () => {
    setCollapsed(true);
    setFocused(false);
    inputRef.current?.blur();
  };

  const mark = (hit: Hit) => {
    onQuery("");
    closeSheet();
    onMark({ lat: hit.lat, lng: hit.lng, placeId: hit.placeId });
  };

  return (
    <motion.div
      data-map-ui
      initial={false}
      animate={{ height: open ? "56%" : 124 }}
      transition={spring}
      className="absolute inset-x-3 bottom-3 z-[55] flex flex-col overflow-hidden"
    >
      <label
        data-onboard="map-search"
        className={`flex items-center gap-2 rounded-full border px-3 py-2 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md ${
          open ? "border-amber-100/70 bg-white text-[#142018]" : "border-white/30 bg-black/55 text-white"
        }`}
      >
        <Search className={`h-3.5 w-3.5 shrink-0 ${open ? "text-amber-700" : "text-white/70"}`} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setCollapsed(false);
            onQuery(event.target.value);
          }}
          onFocus={() => {
            setCollapsed(false);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && hits[0]) {
              event.preventDefault();
              mark(hits[0]);
            }
            if (event.key === "Escape") closeSheet();
          }}
          placeholder="Buscar estabelecimento"
          aria-label="Buscar estabelecimento"
          aria-expanded={open}
          aria-controls="orla-search-results"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-current/45"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar busca"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              onQuery("");
              inputRef.current?.focus();
            }}
            className="grid h-5 w-5 place-items-center text-current/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {open && (
          <button
            type="button"
            aria-label="Recolher busca"
            onPointerDown={(event) => event.preventDefault()}
            onClick={closeSheet}
            className="text-[11px] font-semibold text-amber-800"
          >
            Mapa
          </button>
        )}
      </label>

      <div data-onboard="map-filters" className="no-scrollbar mt-1.5 flex gap-1 overflow-x-auto rounded-full border border-white/30 bg-black/55 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {filters.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onFilter(item.id === "neutro" ? "neutro" : filter === item.id ? "neutro" : item.id)}
              className={`shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium ${selected ? "bg-white text-[#142018]" : "text-white/85"}`}
            >
              {item.emoji} {item.label}
            </button>
          );
        })}
      </div>

      {open ? (
        <div
          id="orla-search-results"
          className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#07110d]/88 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-3.5 pb-1 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {hits.length === 0 ? "Busca" : `${hits.length} na orla`}
            </p>
            {sponsors.length > 0 && (
              <p className="text-[10px] font-medium text-amber-200">
                {sponsors.length === 1 ? "1 patrocinador" : `${sponsors.length} patrocinadores`}
              </p>
            )}
          </div>
          <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-3">
            <AnimatePresence initial={false}>
              {sponsors.map((hit) => (
                <SponsorRow key={hit.key} hit={hit} onMark={() => mark(hit)} />
              ))}
            </AnimatePresence>
            {vendors.length > 0 && (
              <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/80">Ambulantes na areia</p>
            )}
            <AnimatePresence initial={false}>
              {vendors.map((hit) => (
                <VendorRow key={hit.key} hit={hit} onMark={() => mark(hit)} />
              ))}
            </AnimatePresence>
            {rest.length > 0 && (
              <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Demais locais</p>
            )}
            <AnimatePresence initial={false}>
              {rest.map((hit) => (
                <FreeRow key={hit.key} hit={hit} onMark={() => mark(hit)} />
              ))}
            </AnimatePresence>
            {hits.length === 0 && (
              <p className="px-1 py-6 text-center text-[13px] text-white/70">Nenhum estabelecimento com esse nome.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mb-0 mt-1.5 truncate px-2 text-center text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{hint}</p>
      )}
    </motion.div>
  );
}
