import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bike, Car, Footprints, Navigation, X } from "lucide-react-native";
import {
  formatDistance,
  formatWalk,
  modeLabel,
  planRoute,
  type TravelMode,
  type WalkPoint,
  type WalkRoute,
} from "../../data/walk-route";
import { pulseSoft } from "../../utils/haptics";

type Props = {
  visible: boolean;
  from: WalkPoint;
  to: WalkPoint;
  onClose: () => void;
  onPreview: (mode: TravelMode, route: WalkRoute) => void;
  onStart: (mode: TravelMode, route: WalkRoute) => void;
};

/**
 * Painel inferior flutuante (mapa permanece visível) — tempo, distância, Iniciar Rota.
 */
export function RoutePreviewSheet({ visible, from, to, onClose, onPreview, onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<TravelMode>("foot");
  const [route, setRoute] = useState<WalkRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoading(true);
    void planRoute(
      [
        { lat: from.lat, lng: from.lng, name: from.name },
        { lat: to.lat, lng: to.lng, name: to.name },
      ],
      mode,
    ).then((r) => {
      if (!alive) return;
      setRoute(r);
      setLoading(false);
      onPreview(mode, r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode, from.lat, from.lng, to.lat, to.lng]);

  if (!visible) return null;

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Pressable style={styles.x} onPress={onClose} hitSlop={12}>
          <X color="#0f172a" size={18} />
        </Pressable>

        <Text style={styles.to} numberOfLines={1}>
          {to.name}
        </Text>
        <Text style={styles.from} numberOfLines={1}>
          de {from.name}
        </Text>

        <View style={styles.modes}>
          {(["foot", "bike", "car"] as TravelMode[]).map((m) => {
            const Icon = m === "foot" ? Footprints : m === "bike" ? Bike : Car;
            const on = mode === m;
            return (
              <Pressable
                key={m}
                style={[styles.mode, on && styles.modeOn]}
                onPress={() => {
                  void pulseSoft();
                  setMode(m);
                }}
              >
                <Icon color={on ? "#fff" : "#0369a1"} size={18} />
                <Text style={[styles.modeLabel, on && styles.modeLabelOn]}>{modeLabel(m)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.metrics}>
          {loading || !route ? (
            <ActivityIndicator color="#00A3FF" />
          ) : (
            <>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatWalk(route.seconds)}</Text>
                <Text style={styles.metricKey}>tempo</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatDistance(route.meters)}</Text>
                <Text style={styles.metricKey}>distância</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{route.arrivalLabel}</Text>
                <Text style={styles.metricKey}>chegada</Text>
              </View>
            </>
          )}
        </View>

        <Pressable
          style={[styles.start, (!route || loading) && styles.startDisabled]}
          disabled={!route || loading}
          onPress={() => {
            if (!route) return;
            void pulseSoft();
            onStart(mode, route);
          }}
        >
          <Navigation color="#fff" size={20} />
          <Text style={styles.startText}>Iniciar Rota</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 70,
    paddingHorizontal: 12,
  },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -6 },
    elevation: 24,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  x: { position: "absolute", right: 12, top: 12, padding: 8, zIndex: 2 },
  to: { color: "#0f172a", fontSize: 22, fontWeight: "900", paddingRight: 36, marginTop: 4 },
  from: { color: "#64748b", fontSize: 13, marginTop: -6 },
  modes: { flexDirection: "row", gap: 8 },
  mode: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  modeOn: {
    backgroundColor: "#00A3FF",
    borderColor: "#0284c7",
    shadowColor: "#00A3FF",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  modeLabel: { fontSize: 11, fontWeight: "800", color: "#0369a1" },
  modeLabelOn: { color: "#fff" },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    paddingVertical: 14,
    minHeight: 74,
  },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { color: "#0f172a", fontSize: 19, fontWeight: "900" },
  metricKey: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  divider: { width: 1, height: 36, backgroundColor: "#e2e8f0" },
  start: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#16a34a",
    borderRadius: 999,
    paddingVertical: 16,
    shadowColor: "#16a34a",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  startDisabled: { opacity: 0.4 },
  startText: { color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: 0.2 },
});
