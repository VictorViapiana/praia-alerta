import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Map as MapIcon, ShoppingBag, Waves, Sun, Baby, ShieldAlert } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraChat } from "../components/guara/GuaraChat";
import { MissionModal } from "../components/guara/MissionModal";
import { TourOverlay } from "../components/guara/TourOverlay";
import { FEATURES, type FeatureId } from "../data/catalog";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { SosSlider } from "../components/overlays/SosSlider";
import { HOME_STEPS, HOME_TOUR_KEY } from "../data/onboarding";
import { storageGet, storageSet } from "../utils/storage";
import type { GuaraGuide } from "../data/guara-guide";
import { FLAGS } from "../data/orla-stories";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ICONS: Record<FeatureId, typeof Waves> = {
  mare: Waves,
  clima: Sun,
  crianca: Baby,
  alertas: ShieldAlert,
  rampa: MapIcon,
};

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sky, weather, tide, setFeatureId, openSos, missionOpen, setMissionOpen, setFilter, setSearchQuery } =
    useApp();
  const [tour, setTour] = useState({ on: false, i: 0 });
  const [islandOpen, setIslandOpen] = useState(false);

  useEffect(() => {
    void storageGet(HOME_TOUR_KEY).then((v) => {
      if (v !== "1") setTour({ on: true, i: 0 });
    });
  }, []);

  const onGuide = (guide: GuaraGuide) => {
    if (guide.filter) setFilter(guide.filter);
    if (guide.query) setSearchQuery(guide.query);
    if (guide.sheet === "clima" || guide.filter === undefined) {
      /* home Q&A may open map */
    }
    const askMap =
      /quiosque|ducha|mapa|areia|escuna|marlin|ambulante|hotel|sorvete|banheiro|praia/i.test(
        guide.answer + (guide.query || "") + (guide.openId || ""),
      ) || Boolean(guide.fly || guide.openId || guide.route || guide.filter);
    if (askMap && (guide.fly || guide.openId || guide.route || guide.filter || guide.locate)) {
      navigation.navigate("Map");
    }
  };

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.island} onPress={() => setIslandOpen(true)}>
          {!islandOpen ? (
            <>
              <Text style={styles.brand}>Praia Alerta Guará</Text>
              <Text style={styles.tap}>Toque p/ abrir</Text>
              <Text style={styles.meta}>
                {weather.data ? `${Math.round(weather.data.temp)}° · ${weather.data.summary}` : "Carregando clima…"}
                {" · "}
                {sky.label}
              </Text>
            </>
          ) : (
            <>
              <GuaraChat surface="home" weather={weather.data} tide={tide.data} onGuide={onGuide} />
              <View style={styles.islandActions}>
                <Pressable style={styles.mission} onPress={() => setMissionOpen(true)}>
                  <Text style={styles.missionText}>Nossa Missão</Text>
                </Pressable>
                <Pressable
                  style={styles.replay}
                  onPress={() => {
                    void storageSet(HOME_TOUR_KEY, "0");
                    setTour({ on: true, i: 0 });
                  }}
                >
                  <Text style={styles.replayText}>Passeio (Refazer)</Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>

        <Pressable style={styles.mapCta} onPress={() => navigation.navigate("Map")}>
          <MapIcon color="#0f172a" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mapTitle}>Mapa & Localização</Text>
            <Text style={styles.mapSub}>Orla ao vivo · pins · muro · rotas</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.flagChip}
          onPress={() => navigation.navigate("Story", { id: "bandeiras" })}
        >
          <View style={[styles.flagDot, { backgroundColor: FLAGS.find((f) => f.now)?.cloth ?? "#facc15" }]} />
          <Text style={styles.flagChipText}>Bandeira amarela agora · ver sinalização</Text>
        </Pressable>

        <View style={styles.storyRow}>
          <Pressable style={styles.storyCard} onPress={() => navigation.navigate("Story", { id: "marlin" })}>
            <Image source={require("../assets/guarapari/marlin-rochas.png")} style={styles.storyImg} />
            <Text style={styles.storyTitle}>Marlin Azul</Text>
          </Pressable>
          <Pressable style={styles.storyCard} onPress={() => navigation.navigate("Story", { id: "fotos" })}>
            <Image source={require("../assets/guarapari/praia-verao.jpg")} style={styles.storyImg} />
            <Text style={styles.storyTitle}>Fotos da orla</Text>
          </Pressable>
        </View>

        <View style={styles.extraRow}>
          <Pressable style={styles.extra} onPress={() => navigation.navigate("Camera")}>
            <Camera color="#fde68a" size={18} />
            <Text style={styles.extraText}>Eu amo Guarapari</Text>
          </Pressable>
          <Pressable style={styles.extra} onPress={() => navigation.navigate("AmbulantePortal")}>
            <ShoppingBag color="#fdba74" size={18} />
            <Text style={styles.extraText}>Sou ambulante</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Serviços da praia</Text>
        <View style={styles.grid}>
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.id];
            return (
              <Pressable
                key={feature.id}
                style={styles.card}
                onPress={() => {
                  if (feature.id === "crianca") {
                    navigation.navigate("Crianca");
                    return;
                  }
                  setFeatureId(feature.id);
                  navigation.navigate("Feature", { id: feature.id });
                }}
              >
                <View style={[styles.iconWash, { backgroundColor: `${feature.accent}33` }]}>
                  <Icon color={feature.accent} size={22} />
                </View>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardSub}>{feature.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.sosDock, { paddingBottom: insets.bottom + 10 }]}>
        <SosSlider
          onTrigger={() => {
            openSos();
            navigation.navigate("Sos");
          }}
        />
      </View>

      <MissionModal visible={missionOpen} onClose={() => setMissionOpen(false)} />

      {tour.on && (
        <TourOverlay
          steps={HOME_STEPS}
          index={tour.i}
          onNext={() => setTour((t) => ({ ...t, i: t.i + 1 }))}
          onDone={() => {
            void storageSet(HOME_TOUR_KEY, "1");
            setTour({ on: false, i: 0 });
            setIslandOpen(true);
          }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  island: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    gap: 8,
  },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  tap: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  meta: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  islandActions: { flexDirection: "row", gap: 8, marginTop: 4, width: "100%" },
  mission: {
    flex: 1,
    backgroundColor: "rgba(34,211,238,0.25)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.35)",
  },
  missionText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  replay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  replayText: { color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 12 },
  mapCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
  },
  mapTitle: { color: "#0f172a", fontWeight: "800", fontSize: 16 },
  mapSub: { color: "#475569", fontSize: 12, marginTop: 2 },
  flagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(253,224,71,0.18)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(253,224,71,0.35)",
  },
  flagDot: { width: 14, height: 14, borderRadius: 4 },
  flagChipText: { color: "#fef9c3", fontWeight: "700", fontSize: 13, flex: 1 },
  storyRow: { flexDirection: "row", gap: 10 },
  storyCard: {
    flex: 1,
    height: 140,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  storyImg: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  storyTitle: {
    position: "absolute",
    left: 10,
    bottom: 10,
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
  },
  extraRow: { flexDirection: "row", gap: 10 },
  extra: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  extraText: { color: "#fff", fontWeight: "800", fontSize: 12, flex: 1 },
  section: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minWidth: "46%",
  },
  iconWash: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 },
  sosDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
