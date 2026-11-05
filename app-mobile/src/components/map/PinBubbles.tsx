import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BadgeCheck, ChevronRight, Navigation } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mediaImage } from "../../assets/media";

/** Card branco pequeno ancorado no pin — paridade web MarkerPopup não-sponsor. */
export function PlacePinBubble({
  name,
  hours,
  onRoute,
}: {
  name: string;
  hours: string;
  onRoute: () => void;
}) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.whiteCard}>
        <Text style={styles.whiteTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.whiteHours}>{hours}</Text>
        <Pressable style={styles.darkRoute} onPress={onRoute}>
          <View style={styles.navDot}>
            <Navigation color="#fff" size={11} fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.darkRouteTitle}>Ir até aqui</Text>
            <Text style={styles.darkRouteSub}>A pé, bicicleta ou carro</Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.whiteTail} />
    </View>
  );
}

/** Card ouro pequeno ancorado no pin — paridade web MarkerPopup sponsor. */
export function SponsorPinBubble({
  name,
  hours,
  tag,
  cover,
  onOpen,
  onRoute,
}: {
  name: string;
  hours: string;
  tag?: string;
  cover?: string;
  onOpen: () => void;
  onRoute: () => void;
}) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <LinearGradient colors={["#fde68a", "#fb923c", "#f59e0b"]} style={styles.goldRing}>
        <View style={styles.goldCard}>
          <View style={styles.goldCover}>
            <Image source={mediaImage(cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(28,18,8,0.05)", "rgba(28,18,8,0.55)", "#1c1208"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badge}>
              <BadgeCheck color="#fcd34d" size={11} />
              <Text style={styles.badgeText}>Patrocinador</Text>
            </View>
          </View>
          <View style={styles.goldBody}>
            <Text style={styles.goldTitle} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.goldHours}>{hours}</Text>
            {tag ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ) : null}
            <Pressable style={styles.cta} onPress={onOpen}>
              <LinearGradient colors={["#fde68a", "#fdba74"]} style={styles.ctaGrad}>
                <Text style={styles.ctaText}>Ver cardápio e fotos</Text>
                <ChevronRight color="#3a2208" size={13} />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.goldRoute} onPress={onRoute}>
              <View style={styles.navDot}>
                <Navigation color="#fff" size={11} fill="#fff" />
              </View>
              <View>
                <Text style={styles.goldRouteTitle}>Ir até aqui</Text>
                <Text style={styles.goldRouteSub}>A pé, bicicleta ou carro</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.goldTail} />
    </View>
  );
}

export function VendorPinBubble({
  name,
  tag,
  onRoute,
}: {
  name: string;
  tag: string;
  onRoute: () => void;
}) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.vendorCard}>
        <Text style={styles.vendorEyebrow}>Credenciado</Text>
        <Text style={styles.whiteTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.whiteHours}>{tag}</Text>
        <Text style={styles.online}>● Na areia agora</Text>
        <Pressable style={styles.darkRoute} onPress={onRoute}>
          <View style={styles.navDot}>
            <Navigation color="#fff" size={11} fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.darkRouteTitle}>Ir até aqui</Text>
            <Text style={styles.darkRouteSub}>A pé, bicicleta ou carro</Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.vendorTail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 6, width: 232 },
  whiteCard: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#1c1917",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  whiteTitle: { color: "#171717", fontSize: 14, fontWeight: "700" },
  whiteHours: { color: "#525252", fontSize: 12, marginTop: 2 },
  whiteTail: {
    marginTop: -5,
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e5e5e5",
    transform: [{ rotate: "45deg" }],
  },
  darkRoute: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1c1917",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  darkRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 12 },
  darkRouteSub: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  goldRing: { width: 232, borderRadius: 20, padding: 1.5 },
  goldCard: { borderRadius: 18, overflow: "hidden", backgroundColor: "#1c1208" },
  goldCover: { height: 44 },
  badge: {
    position: "absolute",
    left: 8,
    top: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(28,18,8,0.85)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { color: "#fffbeb", fontSize: 10, fontWeight: "800" },
  goldBody: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 6, gap: 3 },
  goldTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  goldHours: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  tag: {
    alignSelf: "flex-start",
    marginTop: 2,
    backgroundColor: "rgba(252,211,77,0.15)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: { color: "#fffbeb", fontSize: 11, fontWeight: "600" },
  cta: { marginTop: 6, borderRadius: 999, overflow: "hidden" },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 9,
  },
  ctaText: { color: "#3a2208", fontSize: 12, fontWeight: "700" },
  goldRoute: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  goldRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 12 },
  goldRouteSub: { color: "rgba(255,255,255,0.55)", fontSize: 10 },
  goldTail: {
    marginTop: -5,
    width: 10,
    height: 10,
    backgroundColor: "#fb923c",
    transform: [{ rotate: "45deg" }],
  },
  vendorCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffedd5",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  vendorEyebrow: { color: "#c2410c", fontSize: 10, fontWeight: "800" },
  online: { color: "#047857", fontSize: 10, fontWeight: "600", marginTop: 4 },
  vendorTail: {
    marginTop: -5,
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ffedd5",
    transform: [{ rotate: "45deg" }],
  },
});
