import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { BeachMapView, type BeachMapHandle } from "../components/map/BeachMapView";
import { MapChrome } from "../components/overlays/MapChrome";
import { SoftPrompt } from "../components/overlays/SoftPrompt";
import { TipTourModal } from "../components/guara/TipTourModal";
import { ShowerRitualModal } from "../components/guara/ShowerRitualModal";
import { GuaraChat } from "../components/guara/GuaraChat";
import { TourOverlay } from "../components/guara/TourOverlay";
import { SponsorSheet } from "../components/sheets/SponsorSheet";
import { RoutePreviewSheet } from "../components/nav/RoutePreviewSheet";
import { NavHud } from "../components/nav/NavHud";
import { useApp } from "../context/AppContext";
import { MURO_TALK_SUBTITLE, MURO_TALK_TEXT, MURO_TALK_TITLE } from "../data/orla-muro";
import {
  ACADEMIA_ORLA,
  ACADEMIA_TOUR_STEPS,
  AMBULANTES,
  ESCUNA_POINT,
  GOLFINHO,
  MARLIN,
  MARLIN_TIPS,
  PLACES,
  SHOWERS,
  landmarkById,
} from "../data/places";
import { RAMPS, RAMPA_NOTE, RAMPA_RULE, RAMPA_WARN } from "../data/rampas";
import { MAP_STEPS, MAP_TOUR_KEY } from "../data/onboarding";
import { storageGet, storageSet } from "../utils/storage";
import {
  readLocationSoftChoice,
  writeLocationSoftChoice,
} from "../data/location-soft";
import {
  readNotifySoftChoice,
  requestNativeNotifyPermission,
  writeNotifySoftChoice,
  takePendingSpot,
} from "../data/orla-notify";
import { useOrlaSentinel } from "../hooks/useOrlaSentinel";
import { useUserLocation } from "../hooks/useUserLocation";
import { useNavTracking } from "../hooks/useNavTracking";
import { useNotifyOpen } from "../hooks/useNotifyOpen";
import { useAmbulanteLive } from "../context/AmbulanteLiveContext";
import type { RootStackParamList } from "../navigation/types";
import type { WalkPoint, WalkRoute } from "../data/walk-route";
import { SHOWER_RITUAL_STEPS } from "../data/places";
import type { GuaraGuide } from "../data/guara-guide";
import { PRAIA_MORRO_VIEW } from "../data/guara-guide";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export function MapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<BeachMapHandle>(null);
  const app = useApp();
  const liveVendors = useAmbulanteLive();
  const { fix } = useUserLocation(!app.nav?.active);
  const navTrack = useNavTracking(Boolean(app.nav?.active), app.nav?.route ?? null);
  const [heading, setHeading] = useState<number | null>(null);
  const [locPrompt, setLocPrompt] = useState(false);
  const [notifyPrompt, setNotifyPrompt] = useState(false);
  const [mapTour, setMapTour] = useState<{ on: boolean; i: number }>({ on: false, i: 0 });
  const [previewRoute, setPreviewRoute] = useState<WalkRoute | null>(null);
  const [muroTalk, setMuroTalk] = useState(false);

  const liveHeading = app.nav?.active ? navTrack.fix?.heading ?? heading : heading;
  const liveLat = app.nav?.active ? navTrack.fix?.lat ?? fix?.lat ?? null : fix?.lat ?? null;
  const liveLng = app.nav?.active ? navTrack.fix?.lng ?? fix?.lng ?? null : fix?.lng ?? null;

  // Chegada: encerra navegação perto do destino.
  useEffect(() => {
    if (!app.nav?.active) return;
    if (navTrack.remainingMeters > 28) return;
    if ((navTrack.progress?.offMeters ?? 0) > 40) return;
    app.stopNav();
    setPreviewRoute(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.nav?.active, navTrack.remainingMeters, navTrack.progress?.offMeters]);

  const place = PLACES.find((p) => p.id === app.selectedId) ?? null;
  const shower = SHOWERS.find((s) => s.id === app.selectedId) ?? null;
  const vendor =
    liveVendors.vendors.find((v) => v.id === app.selectedId) ??
    AMBULANTES.find((v) => v.id === app.selectedId) ??
    null;
  const landmark = landmarkById(app.selectedId);
  const ramp = RAMPS.find((r) => r.id === app.selectedId) ?? null;

  useNotifyOpen(
    useCallback(
      (spot) => {
        app.setSelectedId(spot);
      },
      [app],
    ),
  );

  const origin: WalkPoint = useMemo(
    () =>
      fix
        ? { id: "me", lat: fix.lat, lng: fix.lng, name: "Minha localização" }
        : { id: "orla", lat: PRAIA_MORRO_VIEW.lat, lng: PRAIA_MORRO_VIEW.lng, name: "Praia do Morro" },
    [fix],
  );

  useEffect(() => {
    void (async () => {
      const seen = await storageGet(MAP_TOUR_KEY);
      if (seen !== "1") setMapTour({ on: true, i: 0 });
      const loc = await readLocationSoftChoice();
      if (loc === "unset") setLocPrompt(true);
      const n = await readNotifySoftChoice();
      if (n === "unset") setNotifyPrompt(true);
      const pending = await takePendingSpot();
      if (pending) app.setSelectedId(pending);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    void Location.watchHeadingAsync((h) => {
      setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
    }).then((s) => {
      sub = s;
    }).catch(() => undefined);
    return () => sub?.remove();
  }, []);

  useOrlaSentinel({
    enabled: true,
    fix,
    onSpot: (spot, kind) => {
      if (kind === "ducha") {
        const s = SHOWERS.find((x) => x.id === spot);
        if (s) app.openShowerRitual(s.name);
      } else if (kind === "marlin") {
        app.openTipTour({
          title: MARLIN.name,
          subtitle: MARLIN.detail,
          steps: MARLIN_TIPS.map((t) => ({ title: t.title, text: t.text, kind: "aviso" as const })),
          accent: "ocean",
        });
      } else if (kind === "golfinho") {
        app.openTipTour({
          title: GOLFINHO.name,
          subtitle: GOLFINHO.detail,
          steps: GOLFINHO.tips,
          accent: "teal",
        });
      } else if (kind === "rampa") {
        app.openTipTour({
          title: "Rampa de acesso",
          steps: [
            { title: "Atenção", text: RAMPA_WARN, kind: "alerta" },
            { title: "Regra", text: RAMPA_RULE, kind: "aviso" },
            { title: "Dica", text: RAMPA_NOTE, kind: "convivencia" },
          ],
          accent: "amber",
        });
      } else {
        app.setSelectedId(spot);
      }
    },
  });

  const openSelectedExperience = useCallback(
    (id: string) => {
      const showerHit = SHOWERS.find((s) => s.id === id);
      if (showerHit) {
        app.openShowerRitual(showerHit.detail || showerHit.name);
        return;
      }
      if (id === ACADEMIA_ORLA.id) {
        app.openTipTour({
          title: ACADEMIA_ORLA.name,
          subtitle: ACADEMIA_ORLA.detail,
          steps: ACADEMIA_TOUR_STEPS,
          accent: "rose",
        });
        return;
      }
      if (id === GOLFINHO.id) {
        app.openTipTour({ title: GOLFINHO.name, subtitle: GOLFINHO.detail, steps: GOLFINHO.tips, accent: "teal" });
        return;
      }
      if (id === MARLIN.id) {
        app.openTipTour({
          title: MARLIN.name,
          subtitle: MARLIN.detail,
          steps: MARLIN_TIPS.map((t) => ({ title: t.title, text: t.text, kind: "aviso" as const })),
        });
      }
    },
    [app],
  );

  useEffect(() => {
    if (!app.selectedId) return;
    openSelectedExperience(app.selectedId);
  }, [app.selectedId, openSelectedExperience]);

  const onGuide = useCallback(
    (guide: GuaraGuide) => {
      if (guide.filter) app.setFilter(guide.filter);
      if (guide.query != null) {
        app.setSearchQuery(guide.query);
        app.setSearchOpen(true);
      }
      if (guide.openId) app.setSelectedId(guide.openId);
      if (guide.fly) mapRef.current?.animateTo(guide.fly.lat, guide.fly.lng, 0.005);
      if (guide.route) {
        app.setRouteTarget({
          id: guide.route.id,
          lat: guide.route.lat,
          lng: guide.route.lng,
          name: guide.route.name,
        });
      }
      if (guide.locate && fix) mapRef.current?.animateTo(fix.lat, fix.lng);
    },
    [app, fix],
  );

  const showSponsor =
    (place && place.isSponsor) || vendor || app.selectedId === ESCUNA_POINT.id || app.selectedId === "escunas";

  return (
    <View style={styles.fill}>
      <BeachMapView
        ref={mapRef}
        previewRoute={previewRoute}
        heading={liveHeading}
        userLat={liveLat}
        userLng={liveLng}
        moving={Boolean(navTrack.fix?.moving)}
        traveled={navTrack.traveledLine}
        remaining={navTrack.remainingLine}
        onMuroPress={() => {
          setMuroTalk(true);
          app.openTipTour({
            title: MURO_TALK_TITLE,
            subtitle: MURO_TALK_SUBTITLE,
            steps: [{ title: MURO_TALK_TITLE, text: MURO_TALK_TEXT, kind: "aviso" }],
          });
        }}
      />

      {!app.nav?.active && !app.routeTarget && (
        <MapChrome
          onOpenGuara={() => app.setGuaraOpen(true)}
          onOpenSos={() => {
            app.openSos();
            navigation.navigate("Sos");
          }}
        />
      )}

      {!app.nav?.active && (
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Home</Text>
        </Pressable>
      )}

      {app.nav?.active && (
        <NavHud
          mode={app.nav.mode}
          route={app.nav.route}
          destinationName={app.nav.destination.name}
          remainingMeters={navTrack.remainingMeters}
          remainingSeconds={navTrack.remainingSeconds}
          etaLabel={navTrack.etaLabel}
          maneuver={navTrack.maneuver}
          onStop={() => {
            app.stopNav();
            setPreviewRoute(null);
          }}
        />
      )}

      {/* Ficha rápida / landmark não-sponsor */}
      {!app.nav?.active &&
        !app.routeTarget &&
        (landmark || ramp || (place && !place.isSponsor) || shower) &&
        !showSponsor &&
        !app.showerRitual && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>
            {place?.name ?? shower?.name ?? landmark?.name ?? ramp?.name}
          </Text>
          <Text style={styles.sheetSub}>
            {place?.guaraTip ?? shower?.detail ?? landmark?.detail ?? ramp?.detail}
          </Text>
          <View style={styles.sheetRow}>
            <Pressable
              style={styles.routeBtn}
              onPress={() => {
                const t = place || shower || landmark || ramp;
                if (!t) return;
                app.setRouteTarget({
                  id: t.id,
                  lat: t.lat,
                  lng: t.lng,
                  name: "name" in t ? t.name : "Destino",
                });
              }}
            >
              <Text style={styles.routeBtnText}>Como chegar</Text>
            </Pressable>
            <Pressable onPress={() => app.setSelectedId(null)}>
              <Text style={styles.closeSheetText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!app.nav?.active && !app.routeTarget && place && place.isSponsor && (
        <SponsorSheet
          kind="place"
          place={place}
          skyPhase={app.sky.phase}
          onClose={() => app.setSelectedId(null)}
          onRoute={() =>
            app.setRouteTarget({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
          }
        />
      )}
      {!app.nav?.active && !app.routeTarget && vendor && (
        <SponsorSheet
          kind="vendor"
          vendor={vendor}
          onClose={() => app.setSelectedId(null)}
          onRoute={() =>
            app.setRouteTarget({ id: vendor.id, lat: vendor.lat, lng: vendor.lng, name: vendor.name })
          }
        />
      )}
      {!app.nav?.active &&
        !app.routeTarget &&
        (app.selectedId === ESCUNA_POINT.id || app.selectedId === "escunas") && (
        <SponsorSheet
          kind="escuna"
          onClose={() => app.setSelectedId(null)}
          onRoute={() =>
            app.setRouteTarget({
              id: ESCUNA_POINT.id,
              lat: ESCUNA_POINT.lat,
              lng: ESCUNA_POINT.lng,
              name: ESCUNA_POINT.name,
            })
          }
        />
      )}

      {app.routeTarget && !app.nav?.active && (
        <RoutePreviewSheet
          visible
          from={origin}
          to={app.routeTarget}
          onClose={() => {
            app.setRouteTarget(null);
            setPreviewRoute(null);
          }}
          onPreview={(_mode, route) => {
            setPreviewRoute(route);
            mapRef.current?.fitRoute(route);
          }}
          onStart={(mode, route) => {
            const dest = app.routeTarget!;
            app.setSelectedId(null);
            app.startNav(mode, route, dest);
            setPreviewRoute(route);
            // Enquadra a rota inteira; o follow em perspectiva começa ~1.8s depois.
            requestAnimationFrame(() => mapRef.current?.fitRoute(route));
          }}
        />
      )}

      <TipTourModal
        visible={Boolean(app.tipTour)}
        title={app.tipTour?.title ?? ""}
        subtitle={app.tipTour?.subtitle}
        steps={app.tipTour?.steps ?? []}
        stepIndex={app.tipTour?.stepIndex ?? 0}
        accent={app.tipTour?.accent}
        onNext={app.tipNext}
        onClose={app.tipClose}
      />

      <ShowerRitualModal
        visible={Boolean(app.showerRitual) && (app.showerRitual?.stepIndex ?? 0) < SHOWER_RITUAL_STEPS.length}
        name={app.showerRitual?.name ?? "Ducha"}
        stepIndex={app.showerRitual?.stepIndex ?? 0}
        onNext={() => {
          if ((app.showerRitual?.stepIndex ?? 0) >= SHOWER_RITUAL_STEPS.length - 1) app.showerClose();
          else app.showerNext();
        }}
        onClose={app.showerClose}
      />

      <SoftPrompt
        visible={locPrompt}
        kind="location"
        onAccept={() => {
          void writeLocationSoftChoice("accepted");
          setLocPrompt(false);
          void Location.requestForegroundPermissionsAsync();
        }}
        onDecline={() => {
          void writeLocationSoftChoice("declined");
          setLocPrompt(false);
        }}
      />
      <SoftPrompt
        visible={notifyPrompt && !locPrompt}
        kind="notify"
        onAccept={() => {
          void writeNotifySoftChoice("accepted").then(() => requestNativeNotifyPermission());
          setNotifyPrompt(false);
        }}
        onDecline={() => {
          void writeNotifySoftChoice("declined");
          setNotifyPrompt(false);
        }}
      />

      <Modal visible={app.guaraOpen} animationType="slide" transparent onRequestClose={() => app.setGuaraOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.guaraSheet, { paddingBottom: insets.bottom + 20 }]}>
            <GuaraChat
              surface="map"
              weather={app.weather.data}
              tide={app.tide.data}
              onGuide={onGuide}
              compact
            />
            <Pressable style={styles.primary} onPress={() => app.setGuaraOpen(false)}>
              <Text style={styles.primaryText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {mapTour.on && (
        <TourOverlay
          steps={MAP_STEPS}
          index={mapTour.i}
          onNext={() => setMapTour((t) => ({ ...t, i: t.i + 1 }))}
          onDone={() => {
            void storageSet(MAP_TOUR_KEY, "1");
            setMapTour({ on: false, i: 0 });
          }}
        />
      )}

      {muroTalk ? null : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0b2a48" },
  back: {
    position: "absolute",
    left: 12,
    zIndex: 50,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: { color: "#fff", fontWeight: "700" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    gap: 8,
    zIndex: 45,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sheetSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  routeBtn: {
    backgroundColor: "#0ea5e9",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  routeBtnText: { color: "#fff", fontWeight: "800" },
  closeSheetText: { color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  guaraSheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 12,
  },
  primary: {
    marginTop: 4,
    backgroundColor: "#38bdf8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#0f172a", fontWeight: "800" },
});
