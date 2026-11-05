import { Pressable, StyleSheet, Text, View } from "react-native";
import { Navigation } from "lucide-react-native";

type Props = {
  name: string;
  subtitle: string;
  bottom: number;
  onRoute: () => void;
  onClose: () => void;
};

/** Ficha branca do pin comum — paridade web `MarkerPopup` não-patrocinador. */
export function PlaceTeaser({ name, subtitle, bottom, onRoute, onClose }: Props) {
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
        <Pressable style={styles.route} onPress={onRoute}>
          <View style={styles.routeIcon}>
            <Navigation color="#fff" size={14} fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.routeTitle}>Ir até aqui</Text>
            <Text style={styles.routeSub}>A pé, bicicleta ou carro</Text>
          </View>
        </Pressable>
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Fechar</Text>
        </Pressable>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 48,
    alignItems: "center",
  },
  card: {
    width: 232,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#1c1917",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: { color: "#171717", fontSize: 14, fontWeight: "700" },
  sub: { color: "#525252", fontSize: 12, marginTop: 2 },
  route: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1c1917",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  routeIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  routeTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  routeSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 },
  close: { marginTop: 8, alignItems: "center" },
  closeText: { color: "#737373", fontWeight: "700", fontSize: 12 },
  tail: {
    marginTop: -5,
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e5e5e5",
    transform: [{ rotate: "45deg" }],
  },
});
