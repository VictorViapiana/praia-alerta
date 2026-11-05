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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BEACH_PHOTOS,
  FLAGS,
  MARLIN_CARES,
  MARLIN_PHOTOS,
  type StoryId,
} from "../data/orla-stories";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Story">;

export function StoryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const id = route.params.id as StoryId;
  const [zoom, setZoom] = useState<{ src: number; title: string; credit?: string } | null>(null);

  return (
    <LinearGradient
      colors={id === "bandeiras" ? ["#0369a1", "#0c4a6e"] : ["#0b2a48", "#041018"]}
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
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Voltar</Text>
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
                      colors={["#ef4444", "#ef4444", "#f59e0b", "#f59e0b"]}
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

        {id === "marlin" && (
          <>
            <Text style={styles.kicker}>Patrimônio</Text>
            <Text style={styles.title}>Marlin Azul</Text>
            <Text style={styles.lead}>O peixe da orla — foto, cuidado e respeito.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MARLIN_PHOTOS.map((p) => (
                <Pressable
                  key={p.title}
                  style={styles.photoCard}
                  onPress={() => setZoom({ src: p.src, title: p.title })}
                >
                  <Image source={p.src} style={styles.photo} />
                  <Text style={styles.photoTitle}>{p.title}</Text>
                  <Text style={styles.photoCap}>{p.caption}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {MARLIN_CARES.map((c) => (
              <View key={c.title} style={styles.care}>
                <Text style={styles.careTitle}>{c.title}</Text>
                <Text style={styles.careText}>{c.text}</Text>
              </View>
            ))}
          </>
        )}

        {id === "fotos" && (
          <>
            <Text style={styles.kicker}>Galeria</Text>
            <Text style={styles.title}>Fotos da orla</Text>
            <Text style={styles.lead}>A Praia do Morro em olhares abertos.</Text>
            {BEACH_PHOTOS.map((p) => (
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

      <Modal visible={Boolean(zoom)} animationType="fade" onRequestClose={() => setZoom(null)}>
        <View style={styles.zoom}>
          {zoom ? <Image source={zoom.src} style={styles.zoomImg} resizeMode="contain" /> : null}
          <Pressable style={[styles.zoomClose, { top: insets.top + 12 }]} onPress={() => setZoom(null)}>
            <Text style={styles.zoomCloseText}>Fechar</Text>
          </Pressable>
          {zoom ? (
            <View style={[styles.zoomCap, { bottom: insets.bottom + 20 }]}>
              <Text style={styles.photoTitle}>{zoom.title}</Text>
              {zoom.credit ? <Text style={styles.credit}>{zoom.credit}</Text> : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { color: "#fff", fontWeight: "700", fontSize: 16 },
  kicker: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 8,
  },
  title: { color: "#fff", fontSize: 32, fontWeight: "900" },
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
  photoCard: {
    width: 220,
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
  },
  photo: { width: 220, height: 140 },
  photoTitle: { color: "#fff", fontWeight: "800", fontSize: 14, paddingHorizontal: 10, paddingTop: 8 },
  photoCap: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  care: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  careTitle: { color: "#fde68a", fontWeight: "800", marginBottom: 4 },
  careText: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
  beachCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 4,
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
