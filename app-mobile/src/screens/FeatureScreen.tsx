import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Droplets, Sun, Wind, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { FEATURES } from "../data/catalog";
import { meters, uvLabel, weatherMark } from "../data/coast";
import { mareGuaraPose, weatherGuaraPose } from "../data/guara-poses";
import { ALERT_CARDS } from "../data/orla-stories";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { hourInSaoPaulo } from "../data/sky-phase";

type Props = NativeStackScreenProps<RootStackParamList, "Feature">;

export function FeatureScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { weather, tide } = useApp();
  const feature = FEATURES.find((f) => f.id === route.params.id) ?? FEATURES[0];
  const night = hourInSaoPaulo() >= 19 || hourInSaoPaulo() < 5;
  const [picked, setPicked] = useState(0);
  const climaPose = weatherGuaraPose(weather.data?.code ?? 0, night);
  const marePose = mareGuaraPose(tide.data?.wave ?? 0);

  return (
    <LinearGradient colors={["#9ecceb", "#6eb0db", "#3f8ec4", "#246ea8"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
          gap: 14,
        }}
      >
        <View style={styles.topBar}>
          <View style={styles.topTitle}>
            <View style={styles.topIcon}>
              {feature.id === "clima" ? (
                <Sun color="#facc15" size={22} strokeWidth={1.7} />
              ) : feature.id === "mare" ? (
                <Droplets color="#67e8f9" size={22} strokeWidth={1.7} />
              ) : (
                <Sun color="#fff" size={22} />
              )}
            </View>
            <View>
              <Text style={styles.title}>{feature.title}</Text>
              <Text style={styles.sub}>{feature.subtitle}</Text>
            </View>
          </View>
          <Pressable style={styles.close} onPress={() => navigation.goBack()} accessibilityLabel="Fechar">
            <X color="#fff" size={18} />
          </Pressable>
        </View>

        {feature.id === "clima" && (
          <>
            {/* Paridade web LiveClima: Guará dentro do card, não acima */}
            <View style={styles.heroCard}>
              <GuaraPose pose={climaPose} size={116} style={styles.heroGuara} />
              <Text style={styles.heroMark} accessibilityElementsHidden>
                {weatherMark(weather.data?.code ?? 0)}
              </Text>
              <Text style={styles.heroTemp}>{weather.data ? `${Math.round(weather.data.temp)}°` : "—"}</Text>
              <Text style={styles.heroLine}>
                {weather.data?.summary ?? "…"} · Praia do Morro
              </Text>
              {weather.data?.days?.[0] ? (
                <Text style={styles.heroMeta}>
                  Máx. {Math.round(weather.data.days[0].max)}° · mín. {Math.round(weather.data.days[0].min)}° · UV
                  do dia {weather.data.days[0].uv.toFixed(1).replace(".", ",")}{" "}
                  {uvLabel(weather.data.days[0].uv)}
                </Text>
              ) : null}
            </View>

            <View style={styles.row2}>
              {[
                { icon: Sun, label: "Sensação", value: weather.data ? `${Math.round(weather.data.feels)}°` : "—" },
                {
                  icon: Wind,
                  label: `Vento ${weather.data?.windDir ?? ""}`.trim(),
                  value: weather.data ? `${Math.round(weather.data.wind)} km/h` : "—",
                },
                {
                  icon: Droplets,
                  label: "Umidade",
                  value: weather.data ? `${Math.round(weather.data.humidity)}%` : "—",
                },
                {
                  icon: Sun,
                  label: "UV agora",
                  value: weather.data
                    ? `${weather.data.uv.toFixed(1).replace(".", ",")} ${uvLabel(weather.data.uv)}`
                    : "—",
                },
              ].map((stat) => (
                <View key={stat.label} style={styles.mini}>
                  <stat.icon color="rgba(224,242,254,0.85)" size={16} />
                  <Text style={styles.miniVal}>{stat.value}</Text>
                  <Text style={styles.kicker}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionKicker}>Sete dias · toque para abrir</Text>
            {(weather.data?.days ?? []).slice(0, 7).map((day, index) => {
              const on = index === picked;
              return (
                <Pressable
                  key={day.date}
                  style={[styles.dayCard, on && styles.dayCardOn]}
                  onPress={() => setPicked(index)}
                >
                  <View style={styles.dayRow}>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    <Text style={styles.dayMark}>{day.mark}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.daySum} numberOfLines={1}>
                        {day.summary}
                      </Text>
                      <View style={styles.rainTrack}>
                        <View style={[styles.rainFill, { width: `${Math.max(4, Math.min(100, day.rain))}%` }]} />
                      </View>
                    </View>
                    <View style={styles.dayTempCol}>
                      <Text style={styles.dayMax}>{Math.round(day.max)}°</Text>
                      <Text style={styles.dayMin}>{Math.round(day.min)}°</Text>
                    </View>
                  </View>
                  {on ? (
                    <View style={styles.dayDetail}>
                      <Text style={styles.line}>Mínima {Math.round(day.min)}°</Text>
                      <Text style={styles.line}>Máxima {Math.round(day.max)}°</Text>
                      <Text style={styles.line}>Chuva {Math.round(day.rain)}%</Text>
                      <Text style={styles.line}>Vento {Math.round(day.wind)} km/h</Text>
                      <Text style={styles.line}>
                        UV {day.uv.toFixed(1)} {uvLabel(day.uv)}
                      </Text>
                      <Text style={styles.line}>Céu {day.summary}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            <Text style={styles.footerNote}>Open-Meteo · Guarapari, previsão de 7 dias.</Text>
          </>
        )}

        {feature.id === "mare" && (
          <>
            <View style={styles.heroCard}>
              <GuaraPose pose={marePose} size={116} style={styles.heroGuara} />
              <Text style={styles.kicker}>Nível do mar agora</Text>
              <Text style={styles.heroTemp}>{tide.data ? meters(tide.data.level) : "—"}</Text>
              <Text style={styles.heroLine}>Tendência: {tide.data?.trend ?? "…"}</Text>
              <Text style={styles.heroMeta}>
                Onda {tide.data ? `${tide.data.wave.toFixed(1)} m` : "—"} · Mar{" "}
                {tide.data?.seaTemp != null ? `${tide.data.seaTemp}°C` : "—"}
              </Text>
              <Text style={styles.heroMeta}>{tide.data?.note ?? "Carregando maré…"}</Text>
            </View>
            <View style={styles.row2}>
              {tide.data?.nextHigh ? (
                <View style={styles.mini}>
                  <Text style={styles.kicker}>Preamar</Text>
                  <Text style={styles.miniVal}>{tide.data.nextHigh.label}</Text>
                  <Text style={styles.line}>{meters(tide.data.nextHigh.level)}</Text>
                </View>
              ) : null}
              {tide.data?.nextLow ? (
                <View style={styles.mini}>
                  <Text style={styles.kicker}>Baixa-mar</Text>
                  <Text style={styles.miniVal}>{tide.data.nextLow.label}</Text>
                  <Text style={styles.line}>{meters(tide.data.nextLow.level)}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.kicker}>Dicas do Guará</Text>
              <Text style={styles.line}>
                {(tide.data?.wave ?? 0) < 0.7
                  ? "Banho confortável no raso entre os postos."
                  : (tide.data?.wave ?? 0) < 1.3
                    ? "Banho com atenção: ondas picadas no raso."
                    : "Prefira a areia se a bandeira apertar."}
              </Text>
              <Text style={styles.line}>
                {tide.data?.trend === "Vazante"
                  ? "Boa hora para caminhar na faixa molhada."
                  : "Faixa molhada mais estreita — caminhe perto do calçadão."}
              </Text>
            </View>
          </>
        )}

        {feature.id === "alertas" && (
          <>
            <View style={styles.heroCard}>
              <GuaraPose pose="avisos" size={100} style={styles.heroGuara} />
              <Text style={styles.heroLine}>Avisos da orla agora</Text>
            </View>
            {ALERT_CARDS.map((a) => (
              <View
                key={a.title}
                style={[
                  styles.card,
                  a.tone === "amber" && { borderColor: "rgba(251,191,36,0.45)" },
                  a.tone === "violet" && { borderColor: "rgba(167,139,250,0.45)" },
                  a.tone === "sky" && { borderColor: "rgba(56,189,248,0.45)" },
                ]}
              >
                <Text style={styles.offerTitle}>{a.title}</Text>
                <Text style={styles.line}>{a.text}</Text>
              </View>
            ))}
            <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("Story", { id: "bandeiras" })}>
              <Text style={styles.linkBtnText}>Ver léxico de bandeiras →</Text>
            </Pressable>
          </>
        )}

        {feature.id === "rampa" && (
          <View style={styles.card}>
            <Text style={styles.line}>
              As rampas ligam o calçadão à areia. O corredor fica livre para ambulantes e banhistas — sem
              guarda-sol, cadeira ou barraca no caminho.
            </Text>
            <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("Map")}>
              <Text style={styles.linkBtnText}>Abrir mapa das rampas →</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  topTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(8,47,73,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(8,47,73,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  heroCard: {
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    gap: 4,
  },
  heroGuara: {
    marginBottom: 2,
  },
  heroMark: { fontSize: 28, marginTop: 2 },
  heroTemp: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "300",
    lineHeight: 60,
  },
  heroLine: { color: "rgba(255,255,255,0.78)", fontSize: 14, textAlign: "center" },
  heroMeta: { color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center", marginTop: 2 },
  card: {
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 6,
  },
  kicker: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionKicker: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  line: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  row2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mini: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  miniVal: { color: "#fff", fontSize: 18, fontWeight: "700" },
  dayCard: {
    backgroundColor: "rgba(15,23,42,0.22)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayCardOn: {
    backgroundColor: "rgba(15,23,42,0.35)",
    borderRadius: 22,
    borderColor: "rgba(255,255,255,0.18)",
  },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayLabel: { width: 56, color: "rgba(255,255,255,0.7)", fontSize: 13 },
  dayMark: { width: 24, textAlign: "center", fontSize: 16 },
  daySum: { color: "rgba(255,255,255,0.88)", fontSize: 13 },
  rainTrack: {
    marginTop: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  rainFill: { height: "100%", borderRadius: 999, backgroundColor: "rgba(165,243,252,0.85)" },
  dayTempCol: { alignItems: "flex-end" },
  dayMax: { color: "#fff", fontSize: 14, fontWeight: "700" },
  dayMin: { color: "rgba(255,255,255,0.45)", fontSize: 11 },
  dayDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  offerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  linkBtn: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    alignItems: "center",
  },
  linkBtnText: { color: "#fff", fontWeight: "700" },
  footerNote: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});
