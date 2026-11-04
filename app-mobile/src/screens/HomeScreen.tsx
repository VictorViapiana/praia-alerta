import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Map as MapIcon, Waves, Sun, Baby, ShieldAlert } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { FEATURES, GUARA_SPEECH, type FeatureId } from "../data/catalog";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { SosSlider } from "../components/overlays/SosSlider";

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
  const { sky, weather, setFeatureId, openSos } = useApp();

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.island}>
          <GuaraPose pose="bust" size={88} />
          <Text style={styles.brand}>Praia Alerta Guará</Text>
          <Text style={styles.speech}>{GUARA_SPEECH}</Text>
          <Text style={styles.meta}>
            {weather.data ? `${Math.round(weather.data.temp)}° · ${weather.data.summary}` : "Carregando clima…"}
            {" · "}
            {sky.label}
          </Text>
        </View>

        <Pressable style={styles.mapCta} onPress={() => navigation.navigate("Map")}>
          <MapIcon color="#0f172a" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mapTitle}>Mapa & Localização</Text>
            <Text style={styles.mapSub}>Orla ao vivo · pins · muro · rampas</Text>
          </View>
        </Pressable>

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
  },
  brand: { marginTop: 8, color: "#fff", fontSize: 22, fontWeight: "800" },
  speech: { marginTop: 8, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 20, fontSize: 14 },
  meta: { marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 12 },
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
  section: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
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
  iconWash: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 3 },
  sosDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
});
