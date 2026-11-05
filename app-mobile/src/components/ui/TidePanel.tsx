import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Compass, Thermometer, Waves, Wind } from "lucide-react-native";
import { compass, meters, tideDot, tidePath, type TideNow } from "../../data/coast";

type Props = { data: TideNow };

/** Gráfico + régua + pulsos — paridade `LiveMare` do web. */
export function TidePanel({ data }: Props) {
  const line = tidePath(data.series);
  const dot = tideDot(data.series);
  const span = Math.max(0.25, data.rangeMax - data.rangeMin);
  const fill = Math.max(0.08, Math.min(1, (data.level - data.rangeMin) / span));
  const fillPct = Math.round(fill * 100);
  const upcoming = data.extremes.slice(0, 5);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.kicker}>Nível do mar agora</Text>
        <View style={styles.levelRow}>
          <Text style={styles.level}>{meters(data.level)}</Text>
          <View style={styles.trendPill}>
            <Text style={styles.trendText}>{data.trend}</Text>
          </View>
        </View>
        <Text style={styles.meta}>Em relação ao nível médio do mar</Text>
        {line ? (
          <Svg width="100%" height={96} viewBox="0 0 320 92">
            <Path d={line} fill="none" stroke="rgba(165,243,252,0.95)" strokeWidth={3} strokeLinecap="round" />
            <Circle cx={dot.x} cy={dot.y} r={5} fill="#fff" />
          </Svg>
        ) : null}
        <Text style={styles.cyan}>Ondas de {meters(data.wave)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.reguaHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Régua da maré</Text>
            <Text style={styles.meta}>Onde estamos entre a baixa e a preamar desta janela.</Text>
          </View>
          <Waves color="rgba(207,250,254,0.7)" size={20} />
        </View>
        <View style={styles.reguaRow}>
          <View style={styles.tube}>
            <View style={[styles.tubeFill, { height: `${fillPct}%` }]} />
            <View style={[styles.tubeMark, { top: "18%" }]} />
            <View style={[styles.tubeMark, { top: "50%" }]} />
            <View style={[styles.tubeMark, { top: "82%" }]} />
            <View style={[styles.tubeDot, { bottom: Math.max(0, fillPct - 2) + "%" }]} />
          </View>
          <View style={styles.reguaSide}>
            <View style={styles.reguaLine}>
              <Text style={styles.meta}>Preamar da janela</Text>
              <Text style={styles.reguaVal}>{meters(data.rangeMax)}</Text>
            </View>
            <View style={styles.nowBox}>
              <Text style={styles.kicker}>Agora</Text>
              <Text style={styles.nowVal}>
                {meters(data.level)} · {data.trend}
              </Text>
            </View>
            <View style={styles.reguaLine}>
              <Text style={styles.meta}>Baixa da janela</Text>
              <Text style={styles.reguaVal}>{meters(data.rangeMin)}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.section}>Pulso do mar agora</Text>
      <View style={styles.grid}>
        {[
          {
            icon: Waves,
            label: "Onda",
            value: meters(data.wave),
            sub: `período ${data.wavePeriod.toFixed(1).replace(".", ",")} s`,
          },
          {
            icon: Thermometer,
            label: "Água",
            value: data.seaTemp != null ? `${data.seaTemp.toFixed(1).replace(".", ",")}°` : "—",
            sub: "temperatura da superfície",
          },
          {
            icon: Compass,
            label: "Direção",
            value: compass(data.waveDir),
            sub: `${Math.round(data.waveDir)}° · vinda da onda`,
          },
          {
            icon: Wind,
            label: "Corrente",
            value: `${data.currentSpeed.toFixed(1).replace(".", ",")} m/s`,
            sub: `rumo ${compass(data.currentDir)}`,
          },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <stat.icon color="rgba(207,250,254,0.85)" size={16} />
            <Text style={styles.statVal}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statSub}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {upcoming.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Próximas marés</Text>
          {upcoming.map((e) => (
            <View key={`${e.kind}-${e.time}`} style={styles.extremeRow}>
              <Text style={styles.extremeKind}>{e.kind === "high" ? "Preamar" : "Baixa-mar"}</Text>
              <Text style={styles.extremeLabel}>{e.label}</Text>
              <Text style={styles.reguaVal}>{meters(e.level)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 6,
  },
  kicker: {
    color: "rgba(207,250,254,0.7)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  levelRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  level: { color: "#fff", fontSize: 44, fontWeight: "300", lineHeight: 48 },
  trendPill: {
    backgroundColor: "rgba(103,232,249,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trendText: { color: "#cffafe", fontSize: 12, fontWeight: "700" },
  meta: { color: "rgba(255,255,255,0.45)", fontSize: 11 },
  cyan: { color: "rgba(207,250,254,0.8)", fontSize: 12 },
  reguaHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  reguaRow: { flexDirection: "row", alignItems: "flex-end", gap: 16, marginTop: 8 },
  tube: {
    width: 56,
    height: 144,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(6,38,58,0.7)",
    overflow: "hidden",
    position: "relative",
  },
  tubeFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#22d3ee",
    opacity: 0.85,
  },
  tubeMark: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  tubeDot: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  reguaSide: { flex: 1, gap: 12 },
  reguaLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reguaVal: { color: "#fff", fontWeight: "700", fontSize: 13 },
  nowBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(207,250,254,0.35)",
    backgroundColor: "rgba(8,47,73,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  nowVal: { color: "#fff", fontSize: 16, fontWeight: "700" },
  section: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 2,
  },
  statVal: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 6 },
  statLabel: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  statSub: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  extremeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  extremeKind: { color: "rgba(255,255,255,0.7)", fontSize: 13, width: 80 },
  extremeLabel: { color: "#fff", fontWeight: "700", flex: 1 },
});
