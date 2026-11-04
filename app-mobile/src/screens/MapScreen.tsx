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
  reopenLocationSoftPrompt,
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
import { FAR_FROM_BEACH_M, PRAIA_MORRO_VIEW } from "../data/guara-guide";
import { metersBetween } from "../utils/geo";

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
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const [beachInvite, setBeachInvite] = useState(false);
  const beachInviteAsked = useRef(false);
  /** Teaser tipo MarkerPopup — sheet completo só após “Ver cardápio”. */
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const locChoiceRef = useRef<"unset" | "accepted" | "declined">("unset");

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
      locChoiceRef.current = loc;
      const n = await readNotifySoftChoice();
      // Sequência do web: avisos ~0.9s, localização ~2.8s — e só depois do tour.
      if (n === "unset") {
        setTimeout(() => setNotifyPrompt(true), 900);
      }
      if (loc === "unset") {
        setTimeout(() => setLocPrompt(true), 2800);
      }
      const pending = await takePendingSpot();
      if (pending) app.setSelectedId(pending);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao trocar o pin selecionado, fecha o portal e volta ao teaser.
  useEffect(() => {
    setSponsorOpen(false);
  }, [app.selectedId]);

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
          accent: "ocean",
        });
        return;
      }
      const lm = landmarkById(id);
      if (lm?.tips?.length) {
        app.openTipTour({
          title: lm.name,
          subtitle: lm.detail,
          steps: lm.tips,
          accent: lm.tone === "salva" ? "amber" : lm.tone === "banheiro" ? "ocean" : "teal",
        });
      }
    },
    [app],
  );

  useEffect(() => {
    if (!app.selectedId) return;
    openSelectedExperience(app.selectedId);
  }, [app.selectedId, openSelectedExperience]);

  const showPraiaDoMorro = useCallback(() => {
    setBeachInvite(false);
    mapRef.current?.animateTo(PRAIA_MORRO_VIEW.lat, PRAIA_MORRO_VIEW.lng, 0.0055);
  }, []);

  const runLocate = useCallback(() => {
    void (async () => {
      const stored = await readLocationSoftChoice();
      const choice = locChoiceRef.current === "accepted" ? "accepted" : stored;
      locChoiceRef.current = choice;
      if (choice !== "accepted") {
        await reopenLocationSoftPrompt();
        locChoiceRef.current = "unset";
        setLocPrompt(true);
        setLocateNote(null);
        return;
      }
      setLocating(true);
      setLocateNote(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocateNote("Permita a localização para centralizar o mapa.");
          setLocating(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const far =
          metersBetween(next, { lat: PRAIA_MORRO_VIEW.lat, lng: PRAIA_MORRO_VIEW.lng }) >=
          FAR_FROM_BEACH_M;
        if (far && !beachInviteAsked.current) {
          beachInviteAsked.current = true;
          setBeachInvite(true);
        }
        mapRef.current?.animateTo(next.lat, next.lng, 0.0045);
      } catch {
        setLocateNote("Este aparelho não informou a localização.");
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const onGuide = useCallback(
    (guide: GuaraGuide) => {
      if (guide.filter) app.setFilter(guide.filter);
      if (guide.basemap) app.setBasemap(guide.basemap);
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
      if (guide.locate) {
        if (fix) mapRef.current?.animateTo(fix.lat, fix.lng);
        else runLocate();
      }
    },
    [app, fix, runLocate],
  );

  const showSponsor =
    (place && place.isSponsor) || vendor || app.selectedId === ESCUNA_POINT.id || app.selectedId === "escunas";
  const softBlocked =
    mapTour.on || Boolean(app.tipTour) || Boolean(app.showerRitual) || app.guaraOpen || Boolean(app.routeTarget);

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
          onOpenGuara={() => {
            setBeachInvite(false);
            app.setGuaraOpen(true);
          }}
          onOpenSos={() => {
            app.openSos();
            navigation.navigate("Sos");
          }}
          onLocate={runLocate}
          onOpenCamera={() => navigation.navigate("Camera")}
          onMarkHit={(hit) => mapRef.current?.animateTo(hit.lat, hit.lng, 0.004)}
          locating={locating}
          locateNote={locateNote}
          beachInvite={beachInvite && !app.searchOpen && !app.tipTour && !app.showerRitual && !mapTour.on}
          onAcceptBeach={showPraiaDoMorro}
          onDeclineBeach={() => setBeachInvite(false)}
        />
      )}

      {!app.nav?.active && (
        <Pressable
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Fechar mapa"
        >
          <Text style={styles.closeBtnText}>✕</Text>
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

      {/* Ficha rápida — só quando não abriu ritual/tour do Guará (landmarks com tips usam TipTour). */}
      {!app.nav?.active &&
        !app.routeTarget &&
        !app.tipTour &&
        !app.showerRitual &&
        (ramp || (place && !place.isSponsor) || (landmark && !landmark.tips?.length)) &&
        !showSponsor && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>
            {place?.name ?? landmark?.name ?? ramp?.name}
          </Text>
          <Text style={styles.sheetSub}>
            {place?.guaraTip ?? landmark?.detail ?? ramp?.detail}
          </Text>
          <View style={styles.sheetRow}>
            <Pressable
              style={styles.routeBtn}
              onPress={() => {
                const t = place || landmark || ramp;
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

      {/* Teaser estilo MarkerPopup — antes do portal completo */}
      {!app.nav?.active &&
        !app.routeTarget &&
        !app.tipTour &&
        !app.showerRitual &&
        showSponsor &&
        !sponsorOpen && (
          <View style={[styles.teaser, { bottom: insets.bottom + 150 }]}>
            <Text style={styles.teaserTitle}>
              {place?.name ?? vendor?.name ?? ESCUNA_POINT.name}
            </Text>
            <Text style={styles.teaserSub}>
              {place?.guaraTip ?? vendor?.tag ?? "Passeios de escuna no canal"}
            </Text>
            <View style={styles.teaserRow}>
              <Pressable style={styles.teaserPrimary} onPress={() => setSponsorOpen(true)}>
                <Text style={styles.teaserPrimaryText}>Ver cardápio e fotos</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const t = place || vendor || ESCUNA_POINT;
                  app.setRouteTarget({ id: t.id, lat: t.lat, lng: t.lng, name: t.name });
                }}
              >
                <Text style={styles.teaserLink}>Como chegar</Text>
              </Pressable>
              <Pressable onPress={() => app.setSelectedId(null)}>
                <Text style={styles.teaserLink}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        )}

      {!app.nav?.active && !app.routeTarget && place && place.isSponsor && sponsorOpen && (
        <SponsorSheet
          kind="place"
          place={place}
          skyPhase={app.sky.phase}
          onClose={() => {
            setSponsorOpen(false);
            app.setSelectedId(null);
          }}
          onRoute={() =>
            app.setRouteTarget({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
          }
        />
      )}
      {!app.nav?.active && !app.routeTarget && vendor && sponsorOpen && (
        <SponsorSheet
          kind="vendor"
          vendor={vendor}
          onClose={() => {
            setSponsorOpen(false);
            app.setSelectedId(null);
          }}
          onRoute={() =>
            app.setRouteTarget({ id: vendor.id, lat: vendor.lat, lng: vendor.lng, name: vendor.name })
          }
        />
      )}
      {!app.nav?.active &&
        !app.routeTarget &&
        (app.selectedId === ESCUNA_POINT.id || app.selectedId === "escunas") &&
        sponsorOpen && (
        <SponsorSheet
          kind="escuna"
          onClose={() => {
            setSponsorOpen(false);
            app.setSelectedId(null);
          }}
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
        onNext={() => {
          const cur = app.tipTour;
          if (cur && cur.stepIndex >= cur.steps.length - 1) {
            app.tipClose();
            app.setSelectedId(null);
            return;
          }
          app.tipNext();
        }}
        onClose={() => {
          app.tipClose();
          app.setSelectedId(null);
        }}
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
        visible={notifyPrompt && !locPrompt && !softBlocked}
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
      <SoftPrompt
        visible={locPrompt && !softBlocked}
        kind="location"
        onAccept={() => {
          void writeLocationSoftChoice("accepted");
          locChoiceRef.current = "accepted";
          setLocPrompt(false);
          runLocate();
        }}
        onDecline={() => {
          void writeLocationSoftChoice("declined");
          locChoiceRef.current = "declined";
          setLocPrompt(false);
          setLocateNote("Sem localização — toque de novo se mudar de ideia.");
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
  closeBtn: {
    position: "absolute",
    right: 14,
    zIndex: 60,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, marginTop: -1 },
  teaser: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 48,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  teaserTitle: { color: "#142018", fontSize: 15, fontWeight: "800" },
  teaserSub: { color: "rgba(20,32,24,0.65)", fontSize: 12, lineHeight: 16 },
  teaserRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" },
  teaserPrimary: {
    backgroundColor: "#f59e0b",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  teaserPrimaryText: { color: "#142018", fontWeight: "800", fontSize: 12 },
  teaserLink: { color: "#0e7490", fontWeight: "700", fontSize: 12 },
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
