import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { FEATURES } from "../data/catalog";
import { meters } from "../data/coast";
import { mareGuaraPose, weatherGuaraPose } from "../data/guara-poses";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { hourInSaoPaulo } from "../data/sky-phase";

type Props = NativeStackScreenProps<RootStackParamList, "Feature">;

export function FeatureScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { weather, tide, sky } = useApp();
  const feature = FEATURES.find((f) => f.id === route.params.id) ?? FEATURES[0];
  const night = hourInSaoPaulo() >= 19 || hourInSaoPaulo() < 5;

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 14 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <GuaraPose
            pose={
              feature.id === "mare"
                ? mareGuaraPose(tide.data?.wave ?? 0)
                : feature.id === "clima"
                  ? weatherGuaraPose(weather.data?.code ?? 0, night)
                  : feature.id === "alertas"
                    ? "avisos"
                    : "bust"
            }
            size={88}
          />
          <Text style={styles.title}>{feature.title}</Text>
          <Text style={styles.sub}>{feature.subtitle}</Text>
        </View>

        {feature.id === "mare" && (
          <View style={styles.card}>
            <Text style={styles.kicker}>Agora</Text>
            <Text style={styles.big}>{tide.data ? meters(tide.data.level) : "—"}</Text>
            <Text style={styles.line}>Tendência: {tide.data?.trend ?? "…"}</Text>
            <Text style={styles.line}>Onda: {tide.data ? `${tide.data.wave.toFixed(1)} m` : "—"}</Text>
            <Text style={styles.line}>Mar: {tide.data?.seaTemp != null ? `${tide.data.seaTemp}°C` : "—"}</Text>
            <Text style={styles.note}>{tide.data?.note ?? "Carregando maré…"}</Text>
          </View>
        )}

        {feature.id === "clima" && (
          <View style={styles.card}>
            <Text style={styles.kicker}>Agora</Text>
            <Text style={styles.big}>{weather.data ? `${Math.round(weather.data.temp)}°` : "—"}</Text>
            <Text style={styles.line}>{weather.data?.summary ?? "…"} · sensação {weather.data ? Math.round(weather.data.feels) : "—"}°</Text>
            <Text style={styles.line}>UV {weather.data?.uv ?? "—"} · vento {weather.data?.wind ?? "—"} km/h</Text>
            <Text style={[styles.kicker, { marginTop: 14 }]}>Próximos dias</Text>
            {(weather.data?.days ?? []).slice(0, 7).map((day) => (
              <View key={day.date} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Text style={styles.dayMark}>{day.mark}</Text>
                <Text style={styles.dayTemp}>
                  {day.max}° / {day.min}°
                </Text>
              </View>
            ))}
          </View>
        )}

        {feature.id === "alertas" && (
          <View style={styles.card}>
            <Text style={styles.line}>🟡 Bandeira amarela — mar agitado em alguns trechos.</Text>
            <Text style={styles.line}>🟣 Aviso de raios ao longe — saia da água se ouvir trovões.</Text>
            <Text style={styles.note}>Alertas locais serão enriquecidos com feed ao vivo na Fase 2.1.</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 8 },
  hero: { alignItems: "center", gap: 6, marginBottom: 4 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.7)" },
  card: {
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 6,
  },
  kicker: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  big: { color: "#fff", fontSize: 40, fontWeight: "800" },
  line: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 },
  note: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 8, lineHeight: 18 },
  dayRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8 },
  dayLabel: { color: "#fff", width: 40, fontWeight: "700" },
  dayMark: { flex: 1, color: "rgba(255,255,255,0.75)" },
  dayTemp: { color: "#fff", fontWeight: "600" },
});
