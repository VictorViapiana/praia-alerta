import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, Ban, Trash2, Volume2, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BEACH_PHOTOS,
  FLAGS,
  MARLIN_CARES,
  MARLIN_HISTORY,
  MARLIN_INTRO,
  MARLIN_PHOTOS,
  MARLIN_STATS,
  type StoryId,
} from "../data/orla-stories";
import type { RootStackParamList } from "../navigation/types";
import { speakGuara } from "../utils/speech";

type Props = NativeStackScreenProps<RootStackParamList, "Story">;

const CARE_ICONS = {
  alert: AlertTriangle,
  trash: Trash2,
  ban: Ban,
} as const;

export function StoryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const id = route.params.id as StoryId;
  const [zoom, setZoom] = useState<{ src: number; title: string; credit?: string } | null>(null);

  if (id === "marlin") {
    return (
      <View style={[styles.fill, { backgroundColor: "#0369a1" }]}>
        <Pressable
          style={[styles.closeFab, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Fechar"
        >
          <X color="#fff" size={18} />
        </Pressable>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={require("../assets/guarapari/marlin-por-do-sol.jpg")}
              style={styles.heroImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(6,16,24,0.1)", "#061018"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>Praia do Morro · Guarapari</Text>
              <Text style={styles.heroTitle}>Marlin Azul</Text>
            </View>
          </View>

          <View style={styles.marlinBody}>
            <Text style={styles.intro}>{MARLIN_INTRO}</Text>

            <View style={{ gap: 10 }}>
              <View>
                <Text style={styles.secKicker}>No costão</Text>
                <Text style={styles.secTitle}>Três cuidados</Text>
              </View>
              {MARLIN_CARES.map((care) => {
                const Icon = CARE_ICONS[care.icon];
                return (
                  <View key={care.index} style={styles.careCard}>
                    <View style={styles.careIcon}>
                      <Icon color="#fff" size={18} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.careIndex}>{care.index}</Text>
                      <Text style={styles.careTitle}>{care.title}</Text>
                      <Text style={styles.careText}>{care.text}</Text>
                      <Pressable
                        style={styles.listenBtn}
                        onPress={() => speakGuara(`${care.title}. ${care.text}`)}
                      >
                        <Volume2 color="#ecfeff" size={12} />
                        <Text style={styles.listenText}>Ouvir com o Guará</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ gap: 12 }}>
              <Text style={styles.histKicker}>A história</Text>
              <Text style={styles.secTitle}>O peixe que virou marco</Text>
              {MARLIN_HISTORY.map((p) => (
                <Text key={p.slice(0, 24)} style={styles.histText}>
                  {p}
                </Text>
              ))}
              <View style={styles.statsRow}>
                {MARLIN_STATS.map(([value, label]) => (
                  <View key={label} style={styles.stat}>
                    <Text style={styles.statVal}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.photoGrid}>
              {MARLIN_PHOTOS.map((p) => (
                <Pressable
                  key={p.title}
                  style={styles.gridCell}
                  onPress={() => setZoom({ src: p.src, title: p.title })}
                >
                  <Image source={p.src} style={styles.gridImg} />
                  <Text style={styles.gridCap}>{p.title}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.footerLei}>
              Patrimônio cultural e afetivo · Lei municipal 4.407/2020 · Praia do Morro, Guarapari.
            </Text>
          </View>
        </ScrollView>

        <ZoomModal zoom={zoom} onClose={() => setZoom(null)} top={insets.top} bottom={insets.bottom} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={id === "bandeiras" ? ["#0369a1", "#0c4a6e"] : ["#0369a1", "#075985"]}
      style={styles.fill}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Pressable
          style={[styles.closeInline]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Fechar"
        >
          <X color="#fff" size={18} />
        </Pressable>

        {id === "bandeiras" && (
          <>
            <Text style={styles.kicker}>Sinalização</Text>
            <Text style={styles.title}>Bandeiras</Text>
            <Text style={styles.lead}>
              Na Praia do Morro a bandeira vale mais do que o aspecto do mar. Leia antes de entrar na água.
            </Text>
            {FLAGS.map((flag) => (
              <View key={flag.id} style={styles.flagRow}>
                {flag.id === "vigiada" ? (
                  <View style={styles.flagCloth}>
                    <LinearGradient
                      colors={["#ef4444", "#ef4444", "#facc15", "#facc15"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ) : (
                  <View style={[styles.flagCloth, { backgroundColor: flag.cloth }]} />
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.flagHead}>
                    <Text style={styles.flagName}>{flag.name}</Text>
                    {flag.now ? (
                      <View style={styles.now}>
                        <Text style={styles.nowText}>Agora</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.flagMeaning}>{flag.meaning}</Text>
                  <Text style={styles.flagDetail}>{flag.detail}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {id === "fotos" && (
          <>
            <View style={styles.fotosHero}>
              <Image source={BEACH_PHOTOS[0].src} style={styles.fotosHeroImg} />
              <LinearGradient
                colors={["rgba(0,0,0,0.25)", "transparent", "#07131c"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.fotosHeroCopy}>
                <Text style={styles.heroKicker}>Guarapari · ES</Text>
                <Text style={styles.heroTitle}>Praia do Morro</Text>
              </View>
            </View>
            <Text style={styles.lead}>
              Uma faixa longa de areia entre a cidade e o Morro da Pescaria. De manhã a orla está clara. No
              verão, a areia enche. No fim da tarde, o morro fecha a baía.
            </Text>
            <Text style={styles.credit}>{BEACH_PHOTOS[0].credit}</Text>
            {BEACH_PHOTOS.slice(1).map((p) => (
              <Pressable
                key={p.title}
                style={styles.beachCard}
                onPress={() => setZoom({ src: p.src, title: p.title, credit: p.credit })}
              >
                <Image source={p.src} style={styles.beachImg} />
                <View style={styles.beachMeta}>
                  <Text style={styles.photoTitle}>{p.title}</Text>
                  <Text style={styles.photoCap}>{p.caption}</Text>
                  <Text style={styles.credit}>{p.credit}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <ZoomModal zoom={zoom} onClose={() => setZoom(null)} top={insets.top} bottom={insets.bottom} />
    </LinearGradient>
  );
}

function ZoomModal({
  zoom,
  onClose,
  top,
  bottom,
}: {
  zoom: { src: number; title: string; credit?: string } | null;
  onClose: () => void;
  top: number;
  bottom: number;
}) {
  return (
    <Modal visible={Boolean(zoom)} animationType="fade" onRequestClose={onClose}>
      <View style={styles.zoom}>
        {zoom ? <Image source={zoom.src} style={styles.zoomImg} resizeMode="contain" /> : null}
        <Pressable style={[styles.zoomClose, { top: top + 12 }]} onPress={onClose}>
          <Text style={styles.zoomCloseText}>Fechar</Text>
        </Pressable>
        {zoom ? (
          <View style={[styles.zoomCap, { bottom: bottom + 20 }]}>
            <Text style={styles.photoTitle}>{zoom.title}</Text>
            {zoom.credit ? <Text style={styles.credit}>{zoom.credit}</Text> : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  closeFab: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeInline: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { height: 300, width: "100%" },
  heroImg: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  heroCopy: { position: "absolute", left: 20, right: 64, bottom: 16 },
  heroKicker: {
    color: "rgba(207,250,254,0.8)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 4,
    color: "#fff",
    fontSize: 36,
    fontWeight: "600",
    fontFamily: "Georgia",
    lineHeight: 40,
  },
  marlinBody: { paddingHorizontal: 20, gap: 18, paddingTop: 4 },
  intro: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 22 },
  secKicker: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  secTitle: {
    marginTop: 4,
    color: "#fff",
    fontSize: 26,
    fontWeight: "600",
    fontFamily: "Georgia",
    lineHeight: 30,
  },
  careCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 14,
  },
  careIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  careIndex: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  careTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 2 },
  careText: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 19, marginTop: 4 },
  listenBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listenText: { color: "#ecfeff", fontSize: 11, fontWeight: "700" },
  histKicker: {
    color: "rgba(207,250,254,0.7)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  histText: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
  },
  statVal: { color: "#fff", fontSize: 18, fontWeight: "600", fontFamily: "Georgia" },
  statLabel: {
    marginTop: 4,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridCell: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  gridImg: { width: "100%", height: 144 },
  gridCap: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footerLei: { color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 },
  kicker: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 8,
  },
  title: { color: "#fff", fontSize: 32, fontWeight: "600", fontFamily: "Georgia" },
  lead: { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20, marginBottom: 6 },
  flagRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  flagCloth: { width: 56, height: 36, borderRadius: 6, marginTop: 4, overflow: "hidden" },
  flagHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  flagName: { color: "#fff", fontWeight: "800", fontSize: 15 },
  now: { backgroundColor: "#fde68a", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  nowText: { color: "#3a2a08", fontWeight: "800", fontSize: 10 },
  flagMeaning: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  flagDetail: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18, marginTop: 4 },
  fotosHero: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: -4,
  },
  fotosHeroImg: { width: "100%", height: "100%" },
  fotosHeroCopy: { position: "absolute", left: 16, right: 16, bottom: 14 },
  photoTitle: { color: "#fff", fontWeight: "800", fontSize: 14, paddingHorizontal: 10, paddingTop: 8 },
  photoCap: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  beachCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  beachImg: { width: "100%", height: 180 },
  beachMeta: { padding: 12 },
  credit: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 },
  zoom: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  zoomImg: { width: "100%", height: "80%" },
  zoomClose: { position: "absolute", right: 16, zIndex: 2 },
  zoomCloseText: { color: "#fff", fontWeight: "800" },
  zoomCap: { position: "absolute", left: 16, right: 16 },
});
