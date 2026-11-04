import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { pulseSoft } from "../utils/haptics";

type Props = NativeStackScreenProps<RootStackParamList, "Crianca">;

export function CriancaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sky } = useApp();
  const [mode, setMode] = useState<"perdi" | "achei">("perdi");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 12 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <View style={styles.hero}>
          <GuaraPose pose="crianca" size={84} />
          <Text style={styles.title}>Criança Perdida</Text>
          <Text style={styles.sub}>Perdi ou achei — o Guará ajuda a reunir.</Text>
        </View>

        <View style={styles.tabs}>
          {(["perdi", "achei"] as const).map((id) => (
            <Pressable
              key={id}
              style={[styles.tab, mode === id && styles.tabOn]}
              onPress={() => {
                void pulseSoft();
                setMode(id);
              }}
            >
              <Text style={[styles.tabText, mode === id && styles.tabTextOn]}>
                {id === "perdi" ? "Perdi uma criança" : "Achei uma criança"}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome ou apelido"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="Boné, óculos, mochila, onde foi visto…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={[styles.input, { minHeight: 96, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable
          style={styles.send}
          onPress={() => {
            void pulseSoft();
            setSent(true);
          }}
        >
          <Text style={styles.sendText}>{sent ? "Alerta registrado" : "Enviar alerta ao posto"}</Text>
        </Pressable>
        {sent && (
          <Text style={styles.ok}>
            Fique no local visível. A equipe da orla e o Guará foram notificados (fluxo local — integração completa na Fase 2.1).
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hero: { alignItems: "center", gap: 6 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.7)", textAlign: "center" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  tabOn: { backgroundColor: "rgba(251,146,60,0.9)", borderColor: "rgba(255,255,255,0.35)" },
  tabText: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 12, textAlign: "center" },
  tabTextOn: { color: "#0f172a" },
  input: {
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  send: {
    marginTop: 4,
    backgroundColor: "#fb923c",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendText: { color: "#0f172a", fontWeight: "800" },
  ok: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 },
});
