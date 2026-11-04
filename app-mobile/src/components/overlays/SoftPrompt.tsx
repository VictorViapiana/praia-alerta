import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellOff, MapPinOff, X } from "lucide-react-native";
import { GuaraPose } from "../guara/GuaraPose";

type Props = {
  visible: boolean;
  kind: "location" | "notify";
  onAccept: () => void;
  onDecline: () => void;
};

/** Soft prompt em banner inferior (vidro), como no web — não é modal central. */
export function SoftPrompt({ visible, kind, onAccept, onDecline }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const isLoc = kind === "location";

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + 148 }]}
      pointerEvents="box-none"
      accessibilityRole="dialog"
      accessibilityLabel={isLoc ? "Ativar localização da orla" : "Ativar avisos da orla"}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <GuaraPose pose={isLoc ? "busca" : "avisos"} size={64} style={styles.pose} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isLoc ? "Quer que o Guará te ache na orla?" : "Quer avisos da orla?"}
            </Text>
            <Text style={styles.body}>
              {isLoc
                ? "Usamos localização e orientação só pra te mostrar no mapa e avisar perto dos pontos. Você escolhe — o celular só pergunta se você aceitar aqui."
                : "O Guará fica de olho no Marlim, Golfinho, duchas, quiosques e rampas. Você escolhe — só ativamos a permissão do celular se você aceitar."}
            </Text>
          </View>
          <Pressable
            onPress={onDecline}
            style={styles.xBtn}
            accessibilityLabel="Fechar"
            hitSlop={8}
          >
            <X color="#fff" size={14} />
          </Pressable>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.decline} onPress={onDecline}>
            {isLoc ? <MapPinOff color="rgba(255,255,255,0.9)" size={14} /> : <BellOff color="rgba(255,255,255,0.9)" size={14} />}
            <Text style={styles.declineText}>Agora não</Text>
          </Pressable>
          <Pressable style={[styles.accept, isLoc ? styles.acceptLoc : styles.acceptNotify]} onPress={onAccept}>
            <Text style={styles.acceptText}>{isLoc ? "Permitir localização" : "Quero avisos"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 90,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(16,32,40,0.96)",
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pose: { marginTop: 2 },
  title: { color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  body: { color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 15, marginTop: 4 },
  xBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: 8 },
  decline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  declineText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700" },
  accept: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLoc: { backgroundColor: "#e11d48" },
  acceptNotify: { backgroundColor: "#0e76a8" },
  acceptText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
