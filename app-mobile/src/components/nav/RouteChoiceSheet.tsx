import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Bike, Car, Footprints, X } from "lucide-react-native";
import {
  formatDistance,
  formatWalk,
  modeLabel,
  planRoute,
  type TravelMode,
  type WalkPoint,
  type WalkRoute,
} from "../../data/walk-route";
import { useState } from "react";

type Props = {
  visible: boolean;
  from: WalkPoint;
  to: WalkPoint;
  onClose: () => void;
  onStart: (mode: TravelMode, route: WalkRoute) => void;
};

export function RouteChoiceSheet({ visible, from, to, onClose, onStart }: Props) {
  const [loading, setLoading] = useState<TravelMode | null>(null);

  const pick = async (mode: TravelMode) => {
    setLoading(mode);
    try {
      const route = await planRoute(
        [
          { lat: from.lat, lng: from.lng, name: from.name },
          { lat: to.lat, lng: to.lng, name: to.name },
        ],
        mode,
      );
      onStart(mode, route);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.x} onPress={onClose}>
            <X color="#0f172a" size={20} />
          </Pressable>
          <Text style={styles.title}>Como chegar</Text>
          <Text style={styles.sub}>
            {from.name} → {to.name}
          </Text>
          {(["foot", "bike", "car"] as TravelMode[]).map((mode) => {
            const Icon = mode === "foot" ? Footprints : mode === "bike" ? Bike : Car;
            return (
              <Pressable key={mode} style={styles.row} onPress={() => void pick(mode)} disabled={!!loading}>
                <View style={styles.icon}>
                  <Icon color="#0369a1" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mode}>{modeLabel(mode)}</Text>
                  <Text style={styles.hint}>Traçado pelas ruas · OSRM</Text>
                </View>
                {loading === mode ? <ActivityIndicator color="#0284c7" /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

/** Preview helpers used by nav HUD */
export function routeSummary(route: WalkRoute) {
  return `${formatDistance(route.meters)} · ${formatWalk(route.seconds)} · chega ${route.arrivalLabel}`;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  x: { position: "absolute", right: 14, top: 14, zIndex: 2, padding: 8 },
  title: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  sub: { color: "#64748b", marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  mode: { fontWeight: "800", color: "#0f172a", fontSize: 16 },
  hint: { color: "#64748b", fontSize: 12, marginTop: 2 },
});
