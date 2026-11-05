import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
import { LandmarkTalkSheet } from "../components/sheets/LandmarkTalkSheet";
import { RoutePreviewSheet } from "../components/nav/RoutePreviewSheet";
import { NavHud } from "../components/nav/NavHud";
import { useApp } from "../context/AppContext";
import { speakGuara } from "../utils/speech";
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
import { RAMPS, RAMPA_RULE, RAMPA_WARN } from "../data/rampas";
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
import { useAmbulanteLive } from "../context/AmbulanteLiveContext";
import type { OrlaLandmark } from "../data/places";
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
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const [beachInvite, setBeachInvite] = useState(false);
  const beachInviteAsked = useRef(false);
  /** Teaser tipo MarkerPopup — sheet completo só após “Ver cardápio”. */
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [landmarkTalk, setLandmarkTalk] = useState<OrlaLandmark | null>(null);
  const [arrivedBanner, setArrivedBanner] = useState<string | null>(null);
  const [recalcNote, setRecalcNote] = useState<string | null>(null);
  const arrivedRef = useRef(false);
  const offStreakRef = useRef(0);
  const locChoiceRef = useRef<"unset" | "accepted" | "declined">("unset");

  const liveHeading = app.nav?.active ? navTrack.fix?.heading ?? heading : heading;
  const liveLat = app.nav?.active ? navTrack.fix?.lat ?? fix?.lat ?? null : fix?.lat ?? null;
  const liveLng = app.nav?.active ? navTrack.fix?.lng ?? fix?.lng ?? null : fix?.lng ?? null;

  // Chegada: fala + banner + encerra navegação.
  useEffect(() => {
    if (!app.nav?.active) {
      arrivedRef.current = false;
      offStreakRef.current = 0;
      return;
    }
    if (navTrack.remainingMeters > 28) return;
    if ((navTrack.progress?.offMeters ?? 0) > 40) return;
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    const name = app.nav.destination.name;
    speakGuara(`Você chegou. ${name} está aqui.`);
    setArrivedBanner(`Você chegou · ${name}`);
    setTimeout(() => setArrivedBanner(null), 4200);
    app.stopNav();
    setPreviewRoute(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.nav?.active, navTrack.remainingMeters, navTrack.progress?.offMeters]);

  // Fora da rota: aviso do Guará (paridade web).
  useEffect(() => {
    if (!app.nav?.active) return;
    const off = (navTrack.progress?.offMeters ?? 0) > 45 && navTrack.remainingMeters > 40;
    offStreakRef.current = off ? offStreakRef.current + 1 : 0;
    if (offStreakRef.current === 3) {
      speakGuara("Você saiu do caminho. Estou refazendo a rota.");
      setRecalcNote("Estou refazendo a rota…");
      setTimeout(() => setRecalcNote(null), 3500);
    }
  }, [app.nav?.active, navTrack.progress?.offMeters, navTrack.remainingMeters]);

  const place = PLACES.find((p) => p.id === app.selectedId) ?? null;
  const vendor =
    liveVendors.vendors.find((v) => v.id === app.selectedId) ??
    AMBULANTES.find((v) => v.id === app.selectedId) ??
    null;

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
      const pending = (await takePendingSpot()) ?? app.takePendingNotifySpot();
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
          title: "Marlin Azul",
          subtitle: "Patrimônio da orla · preserve e se cuide",
          steps: MARLIN_TIPS.map((t) => ({
            title: t.title,
            text: t.text,
            kind:
              t.title.toLowerCase().includes("lixo") || t.title.toLowerCase().includes("risque")
                ? ("convivencia" as const)
                : ("alerta" as const),
          })),
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
          title: "Corredor da rampa",
          steps: [
            { title: "3 minutos no corredor", text: RAMPA_WARN, kind: "aviso" },
            { title: "Passagem livre", text: RAMPA_RULE, kind: "alerta" },
            {
              title: "Vai pra areia",
              text: "Guarda-sol, cadeira e barraca ficam fora deste caminho. Libere a rampa e o trânsito da orla flui.",
              kind: "convivencia",
            },
          ],
          accent: "rose",
        });
      } else {
        app.setSelectedId(spot);
      }
    },
  });

  const { openShowerRitual, openTipTour, takePendingGuide, takePendingNotifySpot, setSelectedId } = app;
  const lastExperienceRef = useRef<string | null>(null);

  const openSelectedExperience = useCallback(
    (id: string) => {
      const showerHit = SHOWERS.find((s) => s.id === id);
      if (showerHit) {
        openShowerRitual(showerHit.detail || showerHit.name);
        return;
      }
      if (id === ACADEMIA_ORLA.id) {
        openTipTour({
          title: ACADEMIA_ORLA.name,
          subtitle: "Treino no calçadão · preserve o ferro da praia",
          steps: ACADEMIA_TOUR_STEPS,
          accent: "amber",
        });
        return;
      }
      if (id === GOLFINHO.id) {
        openTipTour({ title: GOLFINHO.name, subtitle: GOLFINHO.detail, steps: GOLFINHO.tips, accent: "teal" });
        return;
      }
      if (id === MARLIN.id) {
        openTipTour({
          title: "Marlin Azul",
          subtitle: "Patrimônio da orla · preserve e se cuide",
          steps: MARLIN_TIPS.map((t) => ({
            title: t.title,
            text: t.text,
            kind:
              t.title.toLowerCase().includes("lixo") || t.title.toLowerCase().includes("risque")
                ? ("convivencia" as const)
                : ("alerta" as const),
          })),
          accent: "ocean",
        });
        return;
      }
      const rampHit = RAMPS.find((r) => r.id === id);
      if (rampHit) {
        openTipTour({
          title: "Corredor da rampa",
          subtitle: rampHit.detail,
          steps: [
            { title: "3 minutos no corredor", text: RAMPA_WARN, kind: "aviso" },
            { title: "Passagem livre", text: RAMPA_RULE, kind: "alerta" },
            {
              title: "Vai pra areia",
              text: "Guarda-sol, cadeira e barraca ficam fora deste caminho. Libere a rampa e o trânsito da orla flui.",
              kind: "convivencia",
            },
          ],
          accent: "rose",
        });
        return;
      }
      const lm = landmarkById(id);
      if (lm?.tips?.length) {
        setLandmarkTalk(lm);
      }
    },
    [openShowerRitual, openTipTour],
  );

  // Só dispara uma vez por id — evita Maximum update depth (openTipTour mudava o contexto).
  useEffect(() => {
    if (!app.selectedId) {
      lastExperienceRef.current = null;
      return;
    }
    if (lastExperienceRef.current === app.selectedId) return;
    lastExperienceRef.current = app.selectedId;
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
        if (far) {
          // Longe da orla (ex.: Barra do Riacho): mantém a Praia do Morro no mapa
          // e convida o Guará a mostrar a praia — senão o usuário vê mapa sem pins.
          if (!beachInviteAsked.current) {
            beachInviteAsked.current = true;
            setBeachInvite(true);
          }
          mapRef.current?.animateTo(PRAIA_MORRO_VIEW.lat, PRAIA_MORRO_VIEW.lng, 0.0055);
        } else {
          mapRef.current?.animateTo(next.lat, next.lng, 0.0045);
        }
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
      if (guide.openId) {
        app.setSelectedId(guide.openId);
        openSelectedExperience(guide.openId);
      }
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
    [app, fix, runLocate, openSelectedExperience],
  );

  useFocusEffect(
    useCallback(() => {
      const guide = takePendingGuide();
      if (guide) onGuide(guide);
      const spot = takePendingNotifySpot();
      if (spot) {
        setSelectedId(spot);
        if (lastExperienceRef.current !== spot) {
          lastExperienceRef.current = spot;
          openSelectedExperience(spot);
        }
      }
      // callbacks estáveis via refs/destructure — não depender do objeto app inteiro
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const softBlocked =
    mapTour.on ||
    Boolean(app.tipTour) ||
    Boolean(app.showerRitual) ||
    Boolean(landmarkTalk) ||
    app.guaraOpen ||
    Boolean(app.routeTarget);

  // Escuna + ambulante no web abrem portal direto no toque.
  // Quiosque patrocinador só abre portal via “Ver cardápio” (onOpenSponsor).
  useEffect(() => {
    if (app.selectedId === ESCUNA_POINT.id || app.selectedId === "escunas") {
      setSponsorOpen(true);
      return;
    }
    if (vendor) {
      setSponsorOpen(true);
      return;
    }
    // Troca de pin / limpa: fecha portal (exceto se ainda for o mesmo place sponsor aberto via CTA).
    if (!app.selectedId || !place?.isSponsor) setSponsorOpen(false);
  }, [app.selectedId, vendor, place?.isSponsor]);

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
        onOpenSponsor={(id) => {
          app.setSelectedId(id);
          setSponsorOpen(true);
        }}
        onRouteToPin={(point) => {
          app.setRouteTarget(point);
        }}
        onMuroPress={() => {
          app.openTipTour({
            title: MURO_TALK_TITLE,
            subtitle: MURO_TALK_SUBTITLE,
            steps: [{ title: "Para-peito", text: MURO_TALK_TEXT, kind: "aviso" }],
            accent: "amber",
          });
        }}
      />

      {/* Esconde Locate/Satélite com card no pin — senão Satélite cola no Patrocinador (screenshot). */}
      {!app.nav?.active &&
        !app.routeTarget &&
        !sponsorOpen &&
        !app.selectedId &&
        !app.tipTour &&
        !app.showerRitual &&
        !landmarkTalk && (
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
          beachInvite={beachInvite && !app.searchOpen && !mapTour.on}
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

      {(arrivedBanner || recalcNote) && (
        <View style={[styles.arriveBanner, { top: insets.top + 56 }]}>
          <Text style={styles.arriveText}>{arrivedBanner ?? recalcNote}</Text>
        </View>
      )}

      {/* Portal completo — card pequeno fica no SelectedPinOverlay (fora do Marker). */}
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

      {landmarkTalk ? (
        <LandmarkTalkSheet
          landmark={landmarkTalk}
          onClose={() => {
            // Mantém selectedId — bubble “Ir até aqui” no pin (paridade web).
            setLandmarkTalk(null);
          }}
        />
      ) : null}

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
            // Mantém selectedId — bubble de rota fica no pin (paridade web closeTipTour).
            app.tipClose();
            return;
          }
          app.tipNext();
        }}
        onClose={() => {
          app.tipClose();
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
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0b2a48" },
  arriveBanner: {
    position: "absolute",
    alignSelf: "center",
    left: 24,
    right: 24,
    zIndex: 70,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  arriveText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 14 },
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
