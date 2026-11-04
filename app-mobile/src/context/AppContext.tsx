import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DayLayer } from "../data/day-layers";
import type { FeatureId, MapFilter } from "../data/catalog";
import { useTide, useWeather } from "../data/coast";
import { useSkyPhase } from "../data/sky-phase";
import type { TravelMode, WalkPoint, WalkRoute } from "../data/walk-route";
import type { GuaraTipStep } from "../components/guara/TipTourModal";

export type TipTourState = {
  title: string;
  subtitle?: string;
  steps: readonly GuaraTipStep[];
  accent?: "ocean" | "teal" | "amber" | "rose";
  stepIndex: number;
} | null;

export type NavState = {
  mode: TravelMode;
  route: WalkRoute;
  destination: WalkPoint;
  stepIndex: number;
  active: boolean;
} | null;

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
  missionOpen: boolean;
  setMissionOpen: (v: boolean) => void;
  tipTour: TipTourState;
  openTipTour: (tour: Omit<NonNullable<TipTourState>, "stepIndex">) => void;
  tipNext: () => void;
  tipClose: () => void;
  showerRitual: { name: string; stepIndex: number } | null;
  openShowerRitual: (name: string) => void;
  showerNext: () => void;
  showerClose: () => void;
  routeTarget: WalkPoint | null;
  setRouteTarget: (p: WalkPoint | null) => void;
  nav: NavState;
  startNav: (mode: TravelMode, route: WalkRoute, destination: WalkPoint) => void;
  stopNav: () => void;
  navNextStep: () => void;
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
  const [missionOpen, setMissionOpen] = useState(false);
  const [tipTour, setTipTour] = useState<TipTourState>(null);
  const [showerRitual, setShowerRitual] = useState<{ name: string; stepIndex: number } | null>(null);
  const [routeTarget, setRouteTarget] = useState<WalkPoint | null>(null);
  const [nav, setNav] = useState<NavState>(null);
  const weather = useWeather();
  const tide = useTide();
  const sky = useSkyPhase();

  const openSos = useCallback(() => setSosOpen(true), []);
  const closeSos = useCallback(() => setSosOpen(false), []);

  const openTipTour = useCallback((tour: Omit<NonNullable<TipTourState>, "stepIndex">) => {
    setTipTour({ ...tour, stepIndex: 0 });
  }, []);
  const tipNext = useCallback(() => {
    setTipTour((cur) => {
      if (!cur) return null;
      if (cur.stepIndex >= cur.steps.length - 1) return null;
      return { ...cur, stepIndex: cur.stepIndex + 1 };
    });
  }, []);
  const tipClose = useCallback(() => setTipTour(null), []);

  const openShowerRitual = useCallback((name: string) => setShowerRitual({ name, stepIndex: 0 }), []);
  const showerNext = useCallback(() => {
    setShowerRitual((cur) => {
      if (!cur) return null;
      return { ...cur, stepIndex: cur.stepIndex + 1 };
    });
  }, []);
  const showerClose = useCallback(() => setShowerRitual(null), []);

  const startNav = useCallback((mode: TravelMode, route: WalkRoute, destination: WalkPoint) => {
    setRouteTarget(null);
    setNav({ mode, route, destination, stepIndex: 0, active: true });
  }, []);
  const stopNav = useCallback(() => setNav(null), []);
  const navNextStep = useCallback(() => {
    setNav((cur) => {
      if (!cur) return null;
      const next = Math.min(cur.stepIndex + 1, Math.max(0, cur.route.steps.length - 1));
      return { ...cur, stepIndex: next };
    });
  }, []);

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
      missionOpen,
      setMissionOpen,
      tipTour,
      openTipTour,
      tipNext,
      tipClose,
      showerRitual,
      openShowerRitual,
      showerNext,
      showerClose,
      routeTarget,
      setRouteTarget,
      nav,
      startNav,
      stopNav,
      navNextStep,
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
      missionOpen,
      tipTour,
      openTipTour,
      tipNext,
      tipClose,
      showerRitual,
      openShowerRitual,
      showerNext,
      showerClose,
      routeTarget,
      nav,
      startNav,
      stopNav,
      navNextStep,
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
