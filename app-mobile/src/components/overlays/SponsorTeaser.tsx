import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mediaImage } from "../../assets/media";
import type { Place, Ambulante } from "../../data/places";
import { ESCUNA_POINT } from "../../data/places";

type Props = {
  place?: Place | null;
  vendor?: Ambulante | null;
  escuna?: boolean;
  bottom: number;
  onOpen: () => void;
  onRoute: () => void;
  onClose: () => void;
};

/** Paridade web `MarkerPopup` — card ouro/escuro do patrocinador. */
export function SponsorTeaser({ place, vendor, escuna, bottom, onOpen, onRoute, onClose }: Props) {
  const name = place?.name ?? vendor?.name ?? ESCUNA_POINT.name;
  const hours = place?.hours ?? vendor?.hours ?? "Canal de Guarapari · passeios";
  const tag = place?.tag ?? (vendor ? "Patrocinador na areia" : escuna ? "Passeios turísticos" : undefined);
  const cover = place?.cover ?? vendor?.cover ?? "/guarapari/praia-enseada.jpg";
  const tip = place?.guaraTip ?? vendor?.about ?? "Embarque com segurança no canal.";

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <LinearGradient colors={["#fde68a", "#fb923c", "#f59e0b"]} style={styles.ring}>
        <View style={styles.card}>
          <View style={styles.coverBox}>
            <Image source={mediaImage(cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(28,18,8,0.1)", "rgba(28,18,8,0.35)", "#1c1208"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badge}>
              <BadgeCheck color="#fcd34d" size={12} />
              <Text style={styles.badgeText}>Patrocinador</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.hours}>{hours}</Text>
            {tag ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ) : null}
            <Text style={styles.tip} numberOfLines={2}>
              {tip}
            </Text>

            <Pressable style={styles.cta} onPress={onOpen}>
              <LinearGradient colors={["#fde68a", "#fdba74"]} style={styles.ctaGrad}>
                <Text style={styles.ctaText}>Ver cardápio e fotos</Text>
                <ChevronRight color="#3a2208" size={14} />
              </LinearGradient>
            </Pressable>

            <View style={styles.links}>
              <Pressable onPress={onRoute}>
                <Text style={styles.link}>Como chegar</Text>
              </Pressable>
              <Pressable onPress={onClose}>
                <Text style={styles.linkMuted}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 48,
    alignItems: "center",
  },
  ring: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    padding: 1.5,
    shadowColor: "#b45309",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1c1208",
  },
  coverBox: { height: 56, justifyContent: "flex-start" },
  badge: {
    marginTop: 8,
    marginLeft: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28,18,8,0.82)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: "#fffbeb", fontSize: 11, fontWeight: "800" },
  body: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8, gap: 4 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  hours: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  tag: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "rgba(252,211,77,0.15)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { color: "#fffbeb", fontSize: 12, fontWeight: "600" },
  tip: { color: "rgba(255,255,255,0.62)", fontSize: 12, lineHeight: 16, marginTop: 2 },
  cta: { marginTop: 8, borderRadius: 999, overflow: "hidden" },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  ctaText: { color: "#3a2208", fontSize: 13, fontWeight: "700" },
  links: { flexDirection: "row", gap: 16, marginTop: 8, paddingHorizontal: 4 },
  link: { color: "#fde68a", fontSize: 12, fontWeight: "700" },
  linkMuted: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "700" },
  tail: {
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: "#fb923c",
    transform: [{ rotate: "45deg" }],
  },
});
