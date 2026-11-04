import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DayLayer } from "../data/day-layers";
import type { FeatureId, MapFilter } from "../data/catalog";
import { useTide, useWeather } from "../data/coast";
import { useSkyPhase } from "../data/sky-phase";

type AppState = {
  filter: MapFilter;
  setFilter: (f: MapFilter) => void;
  dayLayer: DayLayer;
  setDayLayer: (l: DayLayer) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  guaraOpen: boolean;
  setGuaraOpen: (v: boolean) => void;
  featureId: FeatureId | null;
  setFeatureId: (id: FeatureId | null) => void;
  sosOpen: boolean;
  openSos: () => void;
  closeSos: () => void;
  weather: ReturnType<typeof useWeather>;
  tide: ReturnType<typeof useTide>;
  sky: ReturnType<typeof useSkyPhase>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<MapFilter>("neutro");
  const [dayLayer, setDayLayer] = useState<DayLayer>("off");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [guaraOpen, setGuaraOpen] = useState(false);
  const [featureId, setFeatureId] = useState<FeatureId | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const weather = useWeather();
  const tide = useTide();
  const sky = useSkyPhase();

  const openSos = useCallback(() => setSosOpen(true), []);
  const closeSos = useCallback(() => setSosOpen(false), []);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      dayLayer,
      setDayLayer,
      selectedId,
      setSelectedId,
      searchQuery,
      setSearchQuery,
      searchOpen,
      setSearchOpen,
      guaraOpen,
      setGuaraOpen,
      featureId,
      setFeatureId,
      sosOpen,
      openSos,
      closeSos,
      weather,
      tide,
      sky,
    }),
    [
      filter,
      dayLayer,
      selectedId,
      searchQuery,
      searchOpen,
      guaraOpen,
      featureId,
      sosOpen,
      openSos,
      closeSos,
      weather,
      tide,
      sky,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
