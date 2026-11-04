import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { answerGuara, HOME_PROMPTS, MAP_PROMPTS, type GuaraGuide } from "../../data/guara-guide";
import type { TideNow, WeatherNow } from "../../data/coast";
import { GuaraPose } from "./GuaraPose";
import { speakGuara } from "../../utils/speech";

type Props = {
  surface: "home" | "map";
  weather: WeatherNow | null;
  tide: TideNow | null;
  onGuide?: (guide: GuaraGuide) => void;
  compact?: boolean;
};

export function GuaraChat({ surface, weather, tide, onGuide, compact }: Props) {
  const [ask, setAsk] = useState("");
  const [answer, setAnswer] = useState(
    surface === "home"
      ? "Oi, sou o Guará! Como posso te ajudar na Praia do Morro hoje?"
      : "Pode perguntar: ducha, Marlin, quiosque, onde estou…",
  );
  const prompts = surface === "home" ? HOME_PROMPTS : MAP_PROMPTS;

  const run = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const guide = answerGuara(q, { tide, weather });
    setAnswer(guide.answer);
    setAsk("");
    speakGuara(guide.answer);
    onGuide?.(guide);
  };

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.row}>
        <GuaraPose pose="bust" size={compact ? 44 : 56} />
        <Text style={styles.answer}>{answer}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {prompts.map((p) => (
          <Pressable key={p.label} style={styles.chip} onPress={() => run(p.ask)}>
            <Text style={styles.chipText}>
              {p.emoji} {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={ask}
          onChangeText={setAsk}
          placeholder="Pergunte ao Guará…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
          onSubmitEditing={() => run(ask)}
          returnKeyType="send"
        />
        <Pressable style={styles.send} onPress={() => run(ask)}>
          <Text style={styles.sendText}>OK</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, width: "100%" },
  compact: { gap: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  answer: { flex: 1, color: "#fff", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  send: {
    backgroundColor: "#38bdf8",
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  sendText: { color: "#0f172a", fontWeight: "900" },
});
