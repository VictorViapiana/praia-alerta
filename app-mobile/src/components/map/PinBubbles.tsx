import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BadgeCheck, ChevronRight, Navigation } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mediaImage } from "../../assets/media";
import { ShineSweep } from "../ui/ShineSweep";

/**
 * Card branco ancorado no pin — exatamente o MarkerPopup não-sponsor do web
 * (screenshot Quiosque 13).
 */
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
    <View style={styles.wrap} pointerEvents="box-none" collapsable={false}>
      <View style={styles.whiteCard} collapsable={false}>
        <Text style={styles.whiteTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.whiteHours}>{hours}</Text>
        <Pressable style={styles.darkRoute} onPress={onRoute} collapsable={false}>
          <View style={styles.navDot}>
            <Navigation color="#fff" size={12} fill="#fff" />
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

/**
 * Card ouro ancorado no pin — MarkerPopup sponsor do web
 * (screenshot Quiosque 18: faixa cover + Patrocinador + CTA + Ir até aqui).
 */
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
    <View style={styles.wrap} pointerEvents="box-none" collapsable={false}>
      <LinearGradient colors={["#fde68a", "#fb923c", "#f59e0b"]} style={styles.goldRing}>
        <View style={styles.goldCard} collapsable={false}>
          <View style={styles.goldCover}>
            <Image source={mediaImage(cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(28,18,8,0.08)", "rgba(28,18,8,0.45)", "#1c1208"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badge}>
              <BadgeCheck color="#fcd34d" size={12} />
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
            <Pressable style={styles.cta} onPress={onOpen} collapsable={false}>
              <LinearGradient colors={["#fde68a", "#fdba74"]} style={styles.ctaGrad}>
                <ShineSweep bandWidth={90} travel={220} />
                <Text style={styles.ctaText}>Ver cardápio e fotos</Text>
                <ChevronRight color="#3a2208" size={14} />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.goldRoute} onPress={onRoute} collapsable={false}>
              <View style={styles.navDot}>
                <Navigation color="#fff" size={12} fill="#fff" />
              </View>
              <View style={{ flex: 1 }}>
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
    <View style={styles.wrap} pointerEvents="box-none" collapsable={false}>
      <View style={styles.vendorCard} collapsable={false}>
        <Text style={styles.vendorEyebrow}>Credenciado</Text>
        <Text style={styles.whiteTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.whiteHours}>{tag}</Text>
        <Text style={styles.online}>● Na areia agora</Text>
        <Pressable style={styles.darkRoute} onPress={onRoute} collapsable={false}>
          <View style={styles.navDot}>
            <Navigation color="#fff" size={12} fill="#fff" />
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
  wrap: { alignItems: "center", marginBottom: 2, width: 232 },
  whiteCard: {
    width: 228,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#1c1917",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  whiteTitle: { color: "#171717", fontSize: 14, fontWeight: "600" },
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
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  navDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  darkRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  darkRouteSub: { color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 1 },
  goldRing: {
    width: 232,
    borderRadius: 22,
    padding: 1.5,
    shadowColor: "#b45309",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  goldCard: { borderRadius: 20, overflow: "hidden", backgroundColor: "#1c1208" },
  goldCover: { height: 52 },
  badge: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28,18,8,0.8)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: "#fffbeb", fontSize: 11, fontWeight: "800" },
  goldBody: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 6, gap: 2 },
  goldTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  goldHours: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  tag: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "rgba(252,211,77,0.15)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { color: "#fffbeb", fontSize: 12, fontWeight: "500" },
  cta: { marginTop: 8, borderRadius: 999, overflow: "hidden" },
  ctaGrad: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 11,
  },
  ctaText: { color: "#3a2208", fontSize: 13, fontWeight: "600", zIndex: 1 },
  goldRoute: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  goldRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  goldRouteSub: { color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 1 },
  goldTail: {
    marginTop: -5,
    width: 12,
    height: 12,
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
