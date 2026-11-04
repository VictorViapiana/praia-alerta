import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CornerUpLeft, CornerUpRight, ArrowUp, Volume2, X } from "lucide-react-native";
import {
  formatDistance,
  formatWalk,
  modeLabel,
  type TravelMode,
  type WalkRoute,
} from "../../data/walk-route";
import { speakGuara, stopSpeaking } from "../../utils/speech";

type Maneuver = {
  instruction: string;
  street: string;
  modifier: string;
  meters: number;
  speech?: string;
} | null;

type Props = {
  mode: TravelMode;
  route: WalkRoute;
  destinationName: string;
  remainingMeters: number;
  remainingSeconds: number;
  etaLabel: string;
  maneuver: Maneuver;
  onStop: () => void;
};

function ManeuverIcon({ modifier }: { modifier?: string }) {
  const m = (modifier || "").toLowerCase();
  if (m.includes("left")) return <CornerUpLeft color="#fff" size={28} />;
  if (m.includes("right")) return <CornerUpRight color="#fff" size={28} />;
  return <ArrowUp color="#fff" size={28} />;
}

/**
 * HUD Waze: cartão de manobra no topo + painel ETA flutuante embaixo.
 */
export function NavHud({
  mode,
  route,
  destinationName,
  remainingMeters,
  remainingSeconds,
  etaLabel,
  maneuver,
  onStop,
}: Props) {
  const insets = useSafeAreaInsets();
  const instruction = maneuver?.instruction || "Siga a linha azul";
  const street = maneuver?.street;
  const lastSpoken = useRef<string>("");

  useEffect(() => {
    const key = `${maneuver?.instruction ?? ""}|${maneuver?.street ?? ""}`;
    if (!key || key === "|" || key === lastSpoken.current) return;
    if (maneuver && maneuver.meters > 120) return;
    lastSpoken.current = key;
    speakGuara(maneuver?.speech || instruction);
  }, [maneuver, instruction]);

  useEffect(() => () => stopSpeaking(), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.maneuver}>
          <View style={styles.iconBox}>
            <ManeuverIcon modifier={maneuver?.modifier} />
            {maneuver?.meters != null ? (
              <Text style={styles.maneuverDist}>{formatDistance(maneuver.meters)}</Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.instruction} numberOfLines={2}>
              {instruction}
            </Text>
            {street ? (
              <Text style={styles.street} numberOfLines={1}>
                {street}
              </Text>
            ) : null}
          </View>
          <Pressable
            style={styles.speak}
            onPress={() => speakGuara(maneuver?.speech || instruction)}
          >
            <Volume2 color="#fff" size={18} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.etaCard}>
          <View style={styles.etaBlock}>
            <Text style={styles.etaBig}>{formatWalk(remainingSeconds)}</Text>
            <Text style={styles.etaSub}>{formatDistance(remainingMeters)}</Text>
          </View>
          <View style={styles.etaMid}>
            <Text style={styles.dest} numberOfLines={1}>
              {destinationName}
            </Text>
            <Text style={styles.meta}>
              {modeLabel(mode)} · chega {etaLabel}
            </Text>
            <Text style={styles.metaSoft}>
              {route.via === "ruas" ? "Traçado pelas ruas" : "Linha direta"}
            </Text>
          </View>
          <Pressable
            style={styles.stop}
            onPress={() => {
              stopSpeaking();
              onStop();
            }}
          >
            <X color="#fff" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 12, right: 12, top: 0, zIndex: 60 },
  maneuver: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  iconBox: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A3FF",
    borderRadius: 16,
    paddingVertical: 10,
    gap: 2,
  },
  maneuverDist: { color: "#fff", fontWeight: "900", fontSize: 11 },
  instruction: { color: "#fff", fontSize: 17, fontWeight: "800", lineHeight: 22 },
  street: { color: "#7dd3fc", fontSize: 13, marginTop: 2, fontWeight: "600" },
  speak: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 60,
  },
  etaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  etaBlock: { minWidth: 72, alignItems: "flex-start" },
  etaBig: { color: "#16a34a", fontSize: 26, fontWeight: "900" },
  etaSub: { color: "#0f172a", fontWeight: "800", fontSize: 13 },
  etaMid: { flex: 1, gap: 2 },
  dest: { color: "#0f172a", fontWeight: "900", fontSize: 15 },
  meta: { color: "#475569", fontSize: 12, fontWeight: "600" },
  metaSoft: { color: "#94a3b8", fontSize: 11 },
  stop: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
