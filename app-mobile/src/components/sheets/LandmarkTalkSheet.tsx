import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Volume2 } from "lucide-react-native";
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
  onRoute: () => void;
};

/** Ficha de landmark com capa + Alertas + Convivência (paridade web `landmarkTalk`). */
export function LandmarkTalkSheet({ landmark, onClose, onRoute }: Props) {
  const alerts = landmark.tips.filter((t) => t.kind === "alerta");
  const conviv = landmark.tips.filter((t) => t.kind === "convivencia");

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.cover}>
            <Image source={mediaImage(landmark.cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.coverShade} />
            <View style={styles.tone}>
              <Text style={styles.toneText}>{TONE_LABEL[landmark.tone] ?? "Orla"}</Text>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 8 }} bounces={false}>
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
              >
                <Volume2 color="#0f766e" size={14} />
                <Text style={styles.ouvirText}>Ouvir</Text>
              </Pressable>
              <Pressable
                style={styles.route}
                onPress={() => {
                  stopSpeaking();
                  onRoute();
                }}
              >
                <Text style={styles.routeText}>Como chegar</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.done}
              onPress={() => {
                stopSpeaking();
                onClose();
              }}
            >
              <Text style={styles.doneText}>Entendi, Guará</Text>
            </Pressable>
          </ScrollView>
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
  card: {
    width: "100%",
    maxWidth: 320,
    maxHeight: "82%",
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
  },
  cover: { height: 88, position: "relative" },
  coverShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
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
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  body: { paddingHorizontal: 14, paddingTop: 10 },
  name: { color: "#1c120c", fontSize: 15, fontWeight: "700" },
  detail: { color: "#737373", fontSize: 12, marginTop: 2 },
  secAlert: {
    marginTop: 12,
    color: "rgba(220,38,38,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  secGood: {
    marginTop: 12,
    color: "rgba(4,120,87,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  alertBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "rgba(254,242,242,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  goodBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "rgba(236,253,245,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertTitle: { color: "#b91c1c", fontSize: 12, fontWeight: "700" },
  goodTitle: { color: "#065f46", fontSize: 12, fontWeight: "700" },
  tipText: { color: "#404040", fontSize: 12, marginTop: 2, lineHeight: 16 },
  listen: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  listenAlert: { color: "rgba(185,28,28,0.8)", fontSize: 11, fontWeight: "700" },
  listenGood: { color: "rgba(6,95,70,0.8)", fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
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
  route: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  routeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  done: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: "#0f766e",
    alignItems: "center",
    paddingVertical: 11,
  },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
