import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Baby, MapPin, ShieldAlert, ShoppingBag, Sun, Waves } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MissionModal } from "../components/guara/MissionModal";
import { TourOverlay } from "../components/guara/TourOverlay";
import { OceanWash } from "../components/ui/OceanWash";
import { FEATURES, GUARA_SPEECH, type FeatureId } from "../data/catalog";
import { answerGuara, HOME_PROMPTS } from "../data/guara-guide";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { SosSlider } from "../components/overlays/SosSlider";
import { HOME_STEPS, HOME_TOUR_KEY } from "../data/onboarding";
import { storageGet, storageSet } from "../utils/storage";
import { speakGuara, stopSpeaking } from "../utils/speech";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ICONS: Record<FeatureId, typeof Waves> = {
  mare: Waves,
  clima: Sun,
  crianca: Baby,
  alertas: ShieldAlert,
  rampa: MapPin,
};

const WASH: Record<FeatureId, string> = {
  mare: "rgba(34,211,238,0.4)",
  clima: "rgba(250,204,21,0.42)",
  crianca: "rgba(251,146,60,0.42)",
  alertas: "rgba(168,85,247,0.42)",
  rampa: "rgba(96,165,250,0.4)",
};

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sky, weather, tide, setFeatureId, openSos, missionOpen, setMissionOpen, setFilter, setSearchQuery } =
    useApp();
  const [tour, setTour] = useState({ on: false, i: 0 });
  const [open, setOpen] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [line, setLine] = useState(GUARA_SPEECH);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    void storageGet(HOME_TOUR_KEY).then((v) => {
      if (v !== "1") setTour({ on: true, i: 0 });
    });
  }, []);

  useEffect(() => {
    setTyped("");
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setTyped(line.slice(0, index));
      if (index >= line.length) clearInterval(id);
    }, line === GUARA_SPEECH ? 28 : 18);
    return () => clearInterval(id);
  }, [line]);

  const replay = () => {
    void storageSet(HOME_TOUR_KEY, "0");
    setOpen(false);
    setTour({ on: true, i: 0 });
  };

  return (
    <View style={styles.fill}>
      <OceanWash phase={sky.phase} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.island}>
          <Pressable style={styles.islandHead} onPress={() => setOpen((v) => !v)} accessibilityLabel="Falar com o Guará">
            <View style={styles.avatar}>
              <Image source={require("../assets/guara/guara.png")} style={styles.avatarImg} resizeMode="contain" />
              <View style={styles.liveDot} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>Praia Alerta Guará</Text>
                <Text style={styles.tap}>{open ? "Toque p/ fechar" : "Toque p/ abrir"}</Text>
              </View>
              <Text style={styles.speech}>
                {typed}
                {typed.length < line.length ? "▍" : ""}
              </Text>
            </View>
          </Pressable>

          {open && (
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelLabel}>Pergunte ao Guará</Text>
                <Pressable
                  style={[styles.listen, narrating && styles.listenOn]}
                  onPress={() => {
                    if (narrating) {
                      stopSpeaking();
                      setNarrating(false);
                      return;
                    }
                    setNarrating(true);
                    speakGuara(line, () => setNarrating(false));
                  }}
                >
                  <Text style={styles.listenText}>{narrating ? "Pausar" : "Ouvir"}</Text>
                </Pressable>
              </View>

              {picked ? (
                <View style={styles.picked}>
                  <Text style={styles.pickedLabel}>{picked}</Text>
                  <Text style={styles.pickedLine}>{line}</Text>
                </View>
              ) : null}

              <View style={styles.promptGrid}>
                {HOME_PROMPTS.map((prompt) => {
                  const on = picked === prompt.label;
                  return (
                    <Pressable
                      key={prompt.label}
                      style={[styles.prompt, on && styles.promptOn]}
                      onPress={() => {
                        const guide = answerGuara(prompt.ask, { tide: tide.data, weather: weather.data });
                        setPicked(prompt.label);
                        setLine(guide.answer);
                        stopSpeaking();
                        setNarrating(false);
                        if (guide.filter) setFilter(guide.filter);
                        if (guide.query) setSearchQuery(guide.query);
                        if (guide.fly || guide.openId || guide.route || guide.filter || guide.locate) {
                          navigation.navigate("Map");
                        }
                      }}
                    >
                      <Text style={styles.promptEmoji}>{prompt.emoji}</Text>
                      <Text style={styles.promptLabel}>{prompt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.rail}>
                <Pressable style={styles.railBtn} onPress={() => setMissionOpen(true)}>
                  <Text style={styles.railTitle}>Nossa Missão</Text>
                </Pressable>
                <Pressable style={styles.railBtn} onPress={replay} accessibilityLabel="Refazer tutorial">
                  <Text style={styles.railTitle}>Passeio</Text>
                  <Text style={styles.railSub}>Refazer tutorial</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Pressable style={styles.mapCard} onPress={() => navigation.navigate("Map")}>
          {/* CoastMap do web — tile satélite ArcGIS da orla */}
          <Image
            source={{
              uri: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/36612/25397",
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(8,47,73,0.15)", "rgba(12,74,110,0.4)", "rgba(8,47,73,0.88)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.mapTop}>
            <View style={styles.liveChip}>
              <View style={styles.liveChipDot} />
              <Text style={styles.liveChipText}>ao vivo</Text>
            </View>
            <MapPin color="#dbeafe" size={20} />
          </View>
          <View>
            <Text style={styles.mapKicker}>Praia do Morro</Text>
            <Text style={styles.mapTitle}>Mapa & Localização</Text>
            <Text style={styles.mapSub}>Você no calçadão · areia na frente, comércio atrás</Text>
          </View>
        </Pressable>

        <View style={styles.chips}>
          <Text style={styles.chip}>
            {weather.data ? `${Math.round(weather.data.temp)}° · ${weather.data.summary.toLowerCase()}` : "Lendo o clima"}
          </Text>
          <Text style={styles.chip}>{sky.label}</Text>
          <Pressable style={styles.flagChip} onPress={() => navigation.navigate("Story", { id: "bandeiras" })}>
            <Text style={styles.flagChipText}>Bandeira amarela</Text>
          </Pressable>
        </View>

        <View style={styles.storyRow}>
          <Pressable style={styles.storyCard} onPress={() => navigation.navigate("Story", { id: "marlin" })}>
            <Image source={require("../assets/guarapari/marlin-rochas.png")} style={styles.storyImg} />
            <LinearGradient colors={["transparent", "rgba(4,16,24,0.95)"]} style={styles.storyShade} />
            <Text style={styles.storyKicker}>Símbolo da orla</Text>
            <Text style={styles.storyTitle}>Marlin Azul</Text>
          </Pressable>
          <Pressable style={styles.storyCard} onPress={() => navigation.navigate("Story", { id: "fotos" })}>
            <Image source={require("../assets/guarapari/praia-verao.jpg")} style={styles.storyImg} />
            <LinearGradient colors={["transparent", "rgba(11,39,64,0.95)"]} style={styles.storyShade} />
            <Text style={styles.storyTitle}>Praia do Morro</Text>
            <Text style={styles.storySide}>Galeria</Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Serviços da praia</Text>
          <Text style={styles.sectionMeta}>ao vivo</Text>
        </View>
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
                <View style={[styles.wash, { backgroundColor: WASH[feature.id] }]} />
                {feature.id === "alertas" ? <View style={styles.ping} /> : null}
                <View style={[styles.glyphWrap, { shadowColor: feature.accent }]}>
                  <Icon color={feature.accent} size={36} strokeWidth={1.7} />
                </View>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardSub}>{feature.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.vendor} onPress={() => navigation.navigate("AmbulantePortal")}>
          <ShoppingBag color="#fdba74" size={16} />
          <Text style={styles.vendorText}>Sou ambulante</Text>
        </Pressable>
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
            setOpen(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#1d649c" },
  content: { paddingHorizontal: 14, gap: 12 },
  island: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(8,47,73,0.28)",
    overflow: "hidden",
    shadowColor: "#022c4a",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  islandHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(8,47,73,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 40, height: 40 },
  liveDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#6ee7b7",
    borderWidth: 2,
    borderColor: "#071820",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { color: "#ecfeff", fontSize: 13, fontWeight: "800" },
  tap: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(8,47,73,0.35)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  speech: { marginTop: 4, color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  panel: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    padding: 10,
    gap: 8,
  },
  panelHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  panelLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  listen: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(8,47,73,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listenOn: { backgroundColor: "rgba(255,107,87,0.3)", borderColor: "rgba(255,107,87,0.5)" },
  listenText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  picked: {
    borderRadius: 16,
    backgroundColor: "rgba(8,47,73,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickedLabel: { color: "rgba(207,250,254,0.8)", fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  pickedLine: { color: "#fff", fontSize: 13, marginTop: 4, lineHeight: 18 },
  promptGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  prompt: {
    width: "48.5%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(8,47,73,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  promptOn: { borderColor: "rgba(255,107,87,0.55)", backgroundColor: "rgba(255,107,87,0.28)" },
  promptEmoji: { fontSize: 16 },
  promptLabel: { color: "#fff", fontSize: 12, fontWeight: "700", flex: 1 },
  rail: { flexDirection: "row", gap: 6 },
  railBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(8,47,73,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  railTitle: { color: "#fff", fontSize: 12, fontWeight: "800" },
  railSub: { color: "rgba(207,250,254,0.8)", fontSize: 9, marginTop: 2 },
  mapCard: {
    height: 158,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "#0369a1",
    padding: 16,
    justifyContent: "space-between",
  },
  mapTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveChipDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#6ee7b7" },
  liveChipText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  mapKicker: { color: "rgba(207,250,254,0.9)", fontSize: 11, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  mapTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 4 },
  mapSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  flagChip: {
    backgroundColor: "rgba(245,158,11,0.35)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
  },
  flagChipText: { color: "#fffbeb", fontSize: 12, fontWeight: "800" },
  storyRow: { flexDirection: "row", gap: 10 },
  storyCard: {
    flex: 1,
    height: 176,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    justifyContent: "flex-end",
    padding: 12,
  },
  storyImg: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  storyShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 110 },
  storyKicker: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  storyTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 },
  storySide: { position: "absolute", right: 12, bottom: 16, color: "#e0f2fe", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  section: { color: "#fff", fontSize: 17, fontWeight: "800" },
  sectionMeta: { color: "rgba(207,250,254,0.85)", fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    flexGrow: 1,
    height: 122,
    borderRadius: 26,
    padding: 14,
    justifyContent: "space-between",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  wash: { position: "absolute", right: -24, top: -28, width: 96, height: 96, borderRadius: 99 },
  glyphWrap: {
    alignSelf: "flex-start",
    shadowOpacity: 0.85,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ping: { position: "absolute", right: 14, top: 14, width: 10, height: 10, borderRadius: 99, backgroundColor: "#f3e8ff" },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardSub: { color: "rgba(207,250,254,0.85)", fontSize: 11, marginTop: 2 },
  vendor: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  vendorText: { color: "#fdba74", fontWeight: "800", fontSize: 13 },
  sosDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
