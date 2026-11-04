import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { FEATURES } from "../data/catalog";
import { meters, uvLabel } from "../data/coast";
import { mareGuaraPose, weatherGuaraPose } from "../data/guara-poses";
import { ALERT_CARDS } from "../data/orla-stories";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { hourInSaoPaulo } from "../data/sky-phase";

type Props = NativeStackScreenProps<RootStackParamList, "Feature">;

export function FeatureScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { weather, tide, sky } = useApp();
  const feature = FEATURES.find((f) => f.id === route.params.id) ?? FEATURES[0];
  const night = hourInSaoPaulo() >= 19 || hourInSaoPaulo() < 5;
  const [picked, setPicked] = useState(0);

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
          gap: 14,
        }}
      >
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
          <>
            <View style={styles.card}>
              <Text style={styles.kicker}>Nível do mar agora</Text>
              <Text style={styles.big}>{tide.data ? meters(tide.data.level) : "—"}</Text>
              <Text style={styles.line}>Tendência: {tide.data?.trend ?? "…"}</Text>
              <Text style={styles.line}>Onda: {tide.data ? `${tide.data.wave.toFixed(1)} m` : "—"}</Text>
              <Text style={styles.line}>
                Mar: {tide.data?.seaTemp != null ? `${tide.data.seaTemp}°C` : "—"}
              </Text>
              <Text style={styles.note}>{tide.data?.note ?? "Carregando maré…"}</Text>
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

        {feature.id === "clima" && (
          <>
            <View style={styles.card}>
              <Text style={styles.kicker}>Agora · Praia do Morro</Text>
              <Text style={styles.big}>{weather.data ? `${Math.round(weather.data.temp)}°` : "—"}</Text>
              <Text style={styles.line}>
                {weather.data?.summary ?? "…"} · sensação{" "}
                {weather.data ? Math.round(weather.data.feels) : "—"}°
              </Text>
              <Text style={styles.line}>
                UV {weather.data ? `${weather.data.uv.toFixed(1)} ${uvLabel(weather.data.uv)}` : "—"} ·
                vento {weather.data?.wind ?? "—"} km/h {weather.data?.windDir ?? ""}
              </Text>
              <Text style={styles.line}>Umidade {weather.data?.humidity ?? "—"}%</Text>
            </View>
            <View style={styles.row2}>
              {[
                ["Sensação", weather.data ? `${Math.round(weather.data.feels)}°` : "—"],
                ["Vento", weather.data ? `${Math.round(weather.data.wind)} km/h` : "—"],
                ["Umidade", weather.data ? `${Math.round(weather.data.humidity)}%` : "—"],
                ["UV", weather.data ? weather.data.uv.toFixed(1) : "—"],
              ].map(([k, v]) => (
                <View key={k} style={styles.mini}>
                  <Text style={styles.kicker}>{k}</Text>
                  <Text style={styles.miniVal}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.kicker}>Sete dias · toque para abrir</Text>
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
                    <Text style={styles.daySum} numberOfLines={1}>
                      {day.summary}
                    </Text>
                    <Text style={styles.dayTemp}>
                      {Math.round(day.max)}°/{Math.round(day.min)}°
                    </Text>
                  </View>
                  {on ? (
                    <View style={styles.dayDetail}>
                      <Text style={styles.line}>Chuva {Math.round(day.rain)}%</Text>
                      <Text style={styles.line}>Vento {Math.round(day.wind)} km/h</Text>
                      <Text style={styles.line}>
                        UV {day.uv.toFixed(1)} {uvLabel(day.uv)}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </>
        )}

        {feature.id === "alertas" && (
          <>
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
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("Story", { id: "bandeiras" })}
            >
              <Text style={styles.linkBtnText}>Ver léxico de bandeiras →</Text>
            </Pressable>
          </>
        )}

        {feature.id === "rampa" && (
          <View style={styles.card}>
            <Text style={styles.line}>
              As rampas ligam o calçadão à areia. O corredor fica livre para ambulantes e banhistas —
              sem guarda-sol, cadeira ou barraca no caminho.
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
  kicker: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  big: { color: "#fff", fontSize: 48, fontWeight: "900" },
  line: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  note: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4 },
  row2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mini: {
    width: "47%",
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  miniVal: { color: "#fff", fontSize: 18, fontWeight: "800" },
  dayCard: {
    backgroundColor: "rgba(15,23,42,0.35)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dayCardOn: { borderColor: "rgba(56,189,248,0.45)", backgroundColor: "rgba(14,165,233,0.15)" },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayLabel: { color: "rgba(255,255,255,0.7)", width: 42, fontSize: 13 },
  dayMark: { fontSize: 16 },
  daySum: { flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 13 },
  dayTemp: { color: "#fff", fontWeight: "800" },
  dayDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", gap: 4 },
  offerTitle: { color: "#fde68a", fontWeight: "800", fontSize: 16 },
  linkBtn: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  linkBtnText: { color: "#fff", fontWeight: "800" },
});
