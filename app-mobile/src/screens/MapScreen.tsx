import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BeachMapView } from "../components/map/BeachMapView";
import { MapChrome } from "../components/overlays/MapChrome";
import { GuaraPose } from "../components/guara/GuaraPose";
import { useApp } from "../context/AppContext";
import { MURO_TALK_SUBTITLE, MURO_TALK_TEXT, MURO_TALK_TITLE } from "../data/orla-muro";
import { landmarkById, PLACES, SHOWERS, AMBULANTES } from "../data/places";
import type { RootStackParamList } from "../navigation/types";
import { useState } from "react";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export function MapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedId, setSelectedId, setGuaraOpen, guaraOpen, openSos } = useApp();
  const [muroTalk, setMuroTalk] = useState(false);

  const place = PLACES.find((p) => p.id === selectedId) ?? null;
  const shower = SHOWERS.find((s) => s.id === selectedId) ?? null;
  const vendor = AMBULANTES.find((v) => v.id === selectedId) ?? null;
  const landmark = landmarkById(selectedId);

  return (
    <View style={styles.fill}>
      <BeachMapView onMuroPress={() => setMuroTalk(true)} />
      <MapChrome
        onOpenGuara={() => setGuaraOpen(true)}
        onOpenSos={() => {
          openSos();
          navigation.navigate("Sos");
        }}
      />

      <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>

      {/* Ficha rápida do pin */}
      {(place || shower || vendor || landmark) && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {place?.name ?? shower?.name ?? vendor?.name ?? landmark?.name}
          </Text>
          <Text style={styles.sheetSub}>
            {place?.about ?? place?.guaraTip ?? shower?.detail ?? vendor?.tag ?? landmark?.detail}
          </Text>
          {landmark?.tips?.[0] ? (
            <Text style={styles.tip}>💡 {landmark.tips[0].text}</Text>
          ) : null}
          <Pressable style={styles.closeSheet} onPress={() => setSelectedId(null)}>
            <Text style={styles.closeSheetText}>Fechar</Text>
          </Pressable>
        </View>
      )}

      {/* Guará map sheet */}
      <Modal visible={guaraOpen} animationType="slide" transparent onRequestClose={() => setGuaraOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.guaraSheet, { paddingBottom: insets.bottom + 20 }]}>
            <GuaraPose pose="busca" size={72} />
            <Text style={styles.guaraTitle}>Guará no mapa</Text>
            <Text style={styles.guaraBody}>
              Toque nos pins para abrir fichas. Use os filtros de cima para Quiosques, Duchas, Ambulantes e as camadas Sol/Maré.
              O guarda-corpo marrom aparece quando você aproxima o zoom.
            </Text>
            <Pressable style={styles.primary} onPress={() => setGuaraOpen(false)}>
              <Text style={styles.primaryText}>Entendi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={muroTalk} animationType="fade" transparent onRequestClose={() => setMuroTalk(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.guaraSheet, { paddingBottom: insets.bottom + 20 }]}>
            <GuaraPose pose="avisos" size={72} />
            <Text style={styles.guaraTitle}>{MURO_TALK_TITLE}</Text>
            <Text style={styles.sheetSub}>{MURO_TALK_SUBTITLE}</Text>
            <Text style={styles.guaraBody}>{MURO_TALK_TEXT}</Text>
            <Pressable style={styles.primary} onPress={() => setMuroTalk(false)}>
              <Text style={styles.primaryText}>Ok, Guará</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0b2a48" },
  back: {
    position: "absolute",
    left: 12,
    zIndex: 50,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: { color: "#fff", fontWeight: "700" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    gap: 8,
    zIndex: 45,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 6,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sheetSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
  tip: { color: "rgba(250,204,21,0.95)", fontSize: 13, lineHeight: 18, marginTop: 4 },
  closeSheet: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  closeSheetText: { color: "#fff", fontWeight: "600" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  guaraSheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  guaraTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  guaraBody: { color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20, fontSize: 14 },
  primary: {
    marginTop: 8,
    backgroundColor: "#38bdf8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryText: { color: "#0f172a", fontWeight: "800" },
});
