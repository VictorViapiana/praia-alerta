import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  /** Chamado ao escolher modo — pai desenha polyline e pode fitar câmera. */
  onPreview: (mode: TravelMode, route: WalkRoute) => void;
  /** Inicia navegação turn-by-turn. */
  onStart: (mode: TravelMode, route: WalkRoute) => void;
};

/**
 * Painel inferior estilo Waze: tempo, distância, modo e CTA Iniciar Rota.
 */
export function RoutePreviewSheet({ visible, from, to, onClose, onPreview, onStart }: Props) {
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

  const pick = (next: TravelMode) => {
    void pulseSoft();
    setMode(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Pressable style={styles.x} onPress={onClose}>
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
                <Pressable key={m} style={[styles.mode, on && styles.modeOn]} onPress={() => pick(m)}>
                  <Icon color={on ? "#fff" : "#0369a1"} size={18} />
                  <Text style={[styles.modeLabel, on && styles.modeLabelOn]}>{modeLabel(m)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.metrics}>
            {loading || !route ? (
              <ActivityIndicator color="#0284c7" />
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
            <Navigation color="#fff" size={18} />
            <Text style={styles.startText}>Iniciar Rota</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginBottom: 4,
  },
  x: { position: "absolute", right: 14, top: 14, padding: 8, zIndex: 2 },
  to: { color: "#0f172a", fontSize: 22, fontWeight: "900", paddingRight: 36 },
  from: { color: "#64748b", fontSize: 13, marginTop: -6 },
  modes: { flexDirection: "row", gap: 8 },
  mode: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  modeOn: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  modeLabel: { fontSize: 11, fontWeight: "800", color: "#0369a1" },
  modeLabelOn: { color: "#fff" },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingVertical: 14,
    minHeight: 72,
  },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { color: "#0f172a", fontSize: 18, fontWeight: "900" },
  metricKey: { color: "#94a3b8", fontSize: 11, fontWeight: "700", marginTop: 2, textTransform: "uppercase" },
  divider: { width: 1, height: 36, backgroundColor: "#e2e8f0" },
  start: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 999,
    paddingVertical: 16,
    shadowColor: "#16a34a",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  startDisabled: { opacity: 0.45 },
  startText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
