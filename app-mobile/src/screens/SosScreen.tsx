import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { pulseEmergency } from "../utils/haptics";

type Props = NativeStackScreenProps<RootStackParamList, "Sos">;

export function SosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { closeSos } = useApp();
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    void pulseEmergency();
    const id = setTimeout(() => setSent(true), 1100);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    closeSos();
    navigation.goBack();
  };

  return (
    <LinearGradient colors={["#ef4444", "#b91c1c", "#4a0b0b"]} style={styles.fill}>
      <View style={[styles.body, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.pulseWrap}>
          <GuaraPose pose="emergencia" size={64} />
        </View>
        <Text style={styles.eyebrow}>Alerta crítico</Text>
        <Text style={styles.title}>{sent ? "Emergência enviada" : "Localizando você"}</Text>
        <Text style={styles.copy}>
          {sent
            ? "A equipe do Praia Alerta Guará foi notificada. Fique visível e aguarde o posto."
            : "Confirmando o ponto na areia antes de avisar o salva-vidas."}
        </Text>
        <Text style={styles.coords}>20.671° S · 40.497° W</Text>

        {sent && (
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="O que está acontecendo agora"
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            style={styles.note}
          />
        )}

        <Pressable
          style={styles.call}
          onPress={() => void Linking.openURL("tel:193")}
        >
          <Text style={styles.callText}>Ligar para o posto</Text>
        </Pressable>
        <Pressable style={styles.cancel} onPress={dismiss}>
          <Text style={styles.cancelText}>Cancelar alerta</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  pulseWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  eyebrow: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase" },
  title: { marginTop: 8, color: "#fff", fontSize: 34, fontStyle: "italic", fontWeight: "700", textAlign: "center" },
  copy: { marginTop: 12, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 280, lineHeight: 20 },
  coords: { marginTop: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Courier", fontSize: 11, letterSpacing: 2 },
  note: {
    marginTop: 18,
    width: "100%",
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.2)",
    color: "#fff",
    padding: 12,
    textAlignVertical: "top",
  },
  call: {
    marginTop: 22,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  callText: { color: "#b91c1c", fontWeight: "800", fontSize: 15 },
  cancel: {
    marginTop: 12,
    width: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
