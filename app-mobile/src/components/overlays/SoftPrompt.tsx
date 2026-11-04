import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GuaraPose } from "../guara/GuaraPose";

type Props = {
  visible: boolean;
  kind: "location" | "notify";
  onAccept: () => void;
  onDecline: () => void;
};

export function SoftPrompt({ visible, kind, onAccept, onDecline }: Props) {
  const isLoc = kind === "location";
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <GuaraPose pose={isLoc ? "busca" : "avisos"} size={72} />
          <Text style={styles.title}>{isLoc ? "Posso te achar na orla?" : "Quer avisos da orla?"}</Text>
          <Text style={styles.body}>
            {isLoc
              ? "Com a localização, eu centro o mapa em você, aviso perto do Marlin e ajudo no SOS. Sem isso, o mapa ainda funciona — só sem o seu ponto."
              : "Quando você passar perto do Marlin, de uma ducha ou da rampa, eu mando um toque local. Sem spam. Você controla nas configurações do celular."}
          </Text>
          <Pressable style={styles.accept} onPress={onAccept}>
            <Text style={styles.acceptText}>{isLoc ? "Permitir localização" : "Quero avisos"}</Text>
          </Pressable>
          <Pressable style={styles.decline} onPress={onDecline}>
            <Text style={styles.declineText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#0f172a", borderRadius: 28, padding: 22, alignItems: "center", gap: 10 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  body: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 20, textAlign: "center" },
  accept: {
    marginTop: 8,
    width: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptText: { color: "#0f172a", fontWeight: "800" },
  decline: { paddingVertical: 10 },
  declineText: { color: "rgba(255,255,255,0.65)", fontWeight: "600" },
});
