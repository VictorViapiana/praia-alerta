import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Volume2 } from "lucide-react-native";
import { GuaraPose } from "../guara/GuaraPose";
import { mediaImage } from "../../assets/media";
import type { OrlaLandmark } from "../../data/places";
import { pulseSoft } from "../../utils/haptics";
import { speakGuara, stopSpeaking } from "../../utils/speech";

const TONE_LABEL: Record<OrlaLandmark["tone"], string> = {
  pier: "Costão",
  park: "Parque",
  banheiro: "Banheiro",
  esporte: "Esporte",
  academia: "Academia",
  praca: "Praça",
  acesso: "Acesso",
  abrigo: "Bancos",
  playground: "Playground",
  salva: "Salva-vidas",
  golfinho: "Golfinho",
};

type Props = {
  landmark: OrlaLandmark;
  onClose: () => void;
};

/** Ficha landmark — paridade web `page.tsx` landmarkTalk (sem “Como chegar” no sheet). */
export function LandmarkTalkSheet({ landmark, onClose }: Props) {
  const alerts = landmark.tips.filter((t) => t.kind === "alerta");
  const conviv = landmark.tips.filter((t) => t.kind === "convivencia");

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.stack}>
          <View style={styles.card}>
            <View style={styles.cover}>
              <Image source={mediaImage(landmark.cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(255,255,255,0.25)", "#ffffff"]}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tone}>
                <Text style={styles.toneText}>{TONE_LABEL[landmark.tone] ?? "Orla"}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: 14 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.name}>{landmark.name}</Text>
              <Text style={styles.detail}>{landmark.detail}</Text>

              {alerts.length > 0 ? (
                <>
                  <Text style={styles.secAlert}>Alertas</Text>
                  {alerts.map((tip) => (
                    <View key={tip.title} style={styles.alertBox}>
                      <Text style={styles.alertTitle}>{tip.title}</Text>
                      <Text style={styles.tipText}>{tip.text}</Text>
                      <Pressable
                        onPress={() => {
                          void pulseSoft();
                          speakGuara(`${tip.title}. ${tip.text}`);
                        }}
                        style={styles.listen}
                        hitSlop={10}
                      >
                        <Volume2 color="#b91c1c" size={12} />
                        <Text style={styles.listenAlert}>Ouvir</Text>
                      </Pressable>
                    </View>
                  ))}
                </>
              ) : null}

              {conviv.length > 0 ? (
                <>
                  <Text style={styles.secGood}>Boa convivência</Text>
                  {conviv.map((tip) => (
                    <View key={tip.title} style={styles.goodBox}>
                      <Text style={styles.goodTitle}>{tip.title}</Text>
                      <Text style={styles.tipText}>{tip.text}</Text>
                      <Pressable
                        onPress={() => {
                          void pulseSoft();
                          speakGuara(`${tip.title}. ${tip.text}`);
                        }}
                        style={styles.listen}
                        hitSlop={10}
                      >
                        <Volume2 color="#065f46" size={12} />
                        <Text style={styles.listenGood}>Ouvir</Text>
                      </Pressable>
                    </View>
                  ))}
                </>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  style={styles.ouvir}
                  onPress={() => {
                    void pulseSoft();
                    speakGuara(landmark.speak);
                  }}
                  hitSlop={8}
                >
                  <Volume2 color="#0f766e" size={14} />
                  <Text style={styles.ouvirText}>Ouvir</Text>
                </Pressable>
                <Pressable
                  style={styles.done}
                  onPress={() => {
                    stopSpeaking();
                    onClose();
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.doneText}>Entendi, Guará</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          <GuaraPose pose="full" size={132} style={styles.guara} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  stack: { width: "100%", maxWidth: 312, alignItems: "center" },
  card: {
    width: "100%",
    maxHeight: "78%",
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cover: { height: 88, position: "relative", backgroundColor: "#0c4a6e" },
  tone: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  toneText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  body: { paddingHorizontal: 14, paddingTop: 8 },
  name: { color: "#1c120c", fontSize: 15, fontWeight: "700" },
  detail: { color: "#737373", fontSize: 12, marginTop: 2 },
  secAlert: {
    marginTop: 12,
    color: "rgba(220,38,38,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  secGood: {
    marginTop: 12,
    color: "rgba(4,120,87,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  alertBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  goodBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertTitle: { color: "#b91c1c", fontSize: 12, fontWeight: "700" },
  goodTitle: { color: "#065f46", fontSize: 12, fontWeight: "700" },
  tipText: { color: "#404040", fontSize: 12, marginTop: 2, lineHeight: 16 },
  listen: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  listenAlert: { color: "rgba(185,28,28,0.85)", fontSize: 11, fontWeight: "700" },
  listenGood: { color: "rgba(6,95,70,0.85)", fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  ouvir: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.25)",
    backgroundColor: "rgba(15,118,110,0.1)",
    paddingVertical: 10,
  },
  ouvirText: { color: "#0f766e", fontWeight: "700", fontSize: 13 },
  done: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  guara: { marginTop: 8 },
});
