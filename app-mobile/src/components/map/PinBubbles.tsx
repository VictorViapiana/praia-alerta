import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BadgeCheck, ChevronRight, Navigation } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mediaImage } from "../../assets/media";
import { ShineSweep } from "../ui/ShineSweep";

/**
 * Card branco ancorado no pin — MarkerPopup não-sponsor do web.
 * Só cores opacas: Marker no RN Maps fura se tiver rgba baixo.
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
    <View style={styles.wrap} collapsable={false}>
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
 * Card ouro — MarkerPopup sponsor do web (Quiosque 12/18).
 * Camadas 100% opacas para o bitmap do Marker não “furar” o mapa.
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
    <View style={styles.wrap} collapsable={false}>
      <LinearGradient
        colors={["#fde68a", "#fb923c", "#f59e0b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goldRing}
      >
        <View style={styles.goldCard} collapsable={false}>
          <View style={styles.goldCover} collapsable={false}>
            <Image source={mediaImage(cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {/* Opaco — sem alpha baixo (mapa vaza no Marker) */}
            <LinearGradient
              colors={["#2a1a0c", "#1c1208", "#1c1208"]}
              locations={[0, 0.55, 1]}
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
              <LinearGradient
                colors={["#fde68a", "#fdba74"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
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
    <View style={styles.wrap} collapsable={false}>
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
  wrap: { alignItems: "center", marginBottom: 2, width: 232, backgroundColor: "transparent" },
  whiteCard: {
    width: 228,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  whiteTitle: { color: "#171717", fontSize: 14, fontWeight: "600" },
  whiteHours: { color: "#525252", fontSize: 12, marginTop: 2 },
  whiteTail: {
    marginTop: -5,
    width: 10,
    height: 10,
    backgroundColor: "#ffffff",
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
    backgroundColor: "#142018",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  navDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  darkRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  darkRouteSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 1 },
  goldRing: {
    width: 232,
    borderRadius: 22,
    padding: 1.5,
    overflow: "hidden",
  },
  goldCard: { borderRadius: 20, overflow: "hidden", backgroundColor: "#1c1208" },
  goldCover: { height: 52, backgroundColor: "#1c1208", overflow: "hidden" },
  badge: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1c1208",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: "#fffbeb", fontSize: 11, fontWeight: "800" },
  goldBody: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 6,
    gap: 2,
    backgroundColor: "#1c1208",
  },
  goldTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  goldHours: { color: "#d4d4d4", fontSize: 12, marginTop: 2 },
  tag: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#3a2a14",
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
    backgroundColor: "#0a0704",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  goldRouteTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  goldRouteSub: { color: "#a3a3a3", fontSize: 10, marginTop: 1 },
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
