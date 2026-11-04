import { StyleSheet, Text, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import type { WalkRoute } from "../../data/walk-route";
import { toLatLngList } from "../../utils/geo";

type Props = {
  route: WalkRoute | null;
  active?: boolean;
  /** Trecho já percorrido (cinza) durante nav. */
  traveled?: Array<[number, number]>;
  /** Trecho restante (azul vivo). */
  remaining?: Array<[number, number]>;
};

/**
 * Polyline premium estilo Waze:
 * glow externo → casing escuro → traço ciano/azul grosso.
 */
export function RouteLayer({ route, active, traveled, remaining }: Props) {
  if (!route || route.line.length < 2) return null;

  const full = toLatLngList(route.line);
  const done = traveled && traveled.length > 1 ? toLatLngList(traveled) : null;
  const left = remaining && remaining.length > 1 ? toLatLngList(remaining) : full;
  const end = full[full.length - 1];
  const start = full[0];
  const vivid = active ? "#00A3FF" : "#38bdf8";
  const glow = active ? "rgba(0,163,255,0.35)" : "rgba(56,189,248,0.28)";

  return (
    <>
      {/* Glow */}
      <Polyline coordinates={left} strokeColor={glow} strokeWidth={active ? 22 : 18} zIndex={28} lineCap="round" lineJoin="round" />
      {/* Casing */}
      <Polyline coordinates={left} strokeColor="rgba(7,30,60,0.55)" strokeWidth={active ? 14 : 11} zIndex={29} lineCap="round" lineJoin="round" />
      {/* Core */}
      <Polyline coordinates={left} strokeColor={vivid} strokeWidth={active ? 8 : 6} zIndex={30} lineCap="round" lineJoin="round" />

      {done ? (
        <Polyline
          coordinates={done}
          strokeColor="rgba(148,163,184,0.85)"
          strokeWidth={7}
          zIndex={27}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}

      {start ? (
        <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.origin} />
        </Marker>
      ) : null}

      {end ? (
        <Marker coordinate={end} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <View style={styles.destWrap}>
            <View style={styles.destPin}>
              <Text style={styles.destText}>B</Text>
            </View>
            <View style={styles.destStem} />
          </View>
        </Marker>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  origin: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#00A3FF",
  },
  destWrap: { alignItems: "center" },
  destPin: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  destText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  destStem: {
    width: 3,
    height: 8,
    backgroundColor: "#ef4444",
    marginTop: -1,
  },
});
