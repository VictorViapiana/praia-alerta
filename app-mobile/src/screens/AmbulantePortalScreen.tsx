import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ShoppingBag, Wifi, WifiOff } from "lucide-react-native";
import { useAmbulanteLive } from "../context/AmbulanteLiveContext";
import {
  catalogChoices,
  giftCodeFor,
  loginAmbulante,
  logoutAmbulante,
  registerAmbulante,
} from "../data/ambulante-hub";
import type { RootStackParamList } from "../navigation/types";
import { pulseSoft } from "../utils/haptics";
import { useApp } from "../context/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "AmbulantePortal">;
type Mode = "login" | "register";

export function AmbulantePortalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sky } = useApp();
  const live = useAmbulanteLive();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [catalogId, setCatalogId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void live.refreshAccount();
  }, [live]);

  const choices = catalogChoices();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        const res = await loginAmbulante(phone, pin);
        if (!res.ok) {
          setError(res.error);
          return;
        }
      } else {
        const res = await registerAmbulante({
          name,
          tag,
          phone,
          pin,
          catalogId: catalogId || undefined,
          walks: true,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      void pulseSoft();
      await live.refreshAccount();
    } finally {
      setBusy(false);
    }
  };

  if (live.account) {
    const online = live.online;
    return (
      <LinearGradient colors={[sky.themeColor, "#081828"]} style={styles.fill}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 18,
            gap: 14,
          }}
        >
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Voltar</Text>
          </Pressable>
          <View style={styles.hero}>
            <ShoppingBag color="#fdba74" size={28} />
            <Text style={styles.title}>Painel do ambulante</Text>
            <Text style={styles.sub}>{live.account.name}</Text>
            <Text style={styles.meta}>{live.account.tag}</Text>
          </View>

          <View style={[styles.card, online ? styles.cardOn : styles.cardOff]}>
            <Text style={styles.statusLabel}>{online ? "Você está na areia" : "Você está offline"}</Text>
            <Text style={styles.statusHint}>
              {online
                ? "Seu pin aparece no mapa para os banhistas em tempo real."
                : "Ao ficar online, o pin surge na areia. Ao desconectar, some."}
            </Text>
            <Pressable
              style={[styles.toggle, online ? styles.toggleOff : styles.toggleOn]}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  void pulseSoft();
                  if (online) await live.goOffline();
                  else await live.goOnline();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : online ? (
                <>
                  <WifiOff color="#fff" size={20} />
                  <Text style={styles.toggleText}>Ficar Offline</Text>
                </>
              ) : (
                <>
                  <Wifi color="#fff" size={20} />
                  <Text style={styles.toggleText}>Ficar Online</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.kicker}>Código da areia</Text>
            <Text style={styles.code}>{giftCodeFor(live.account.catalogId)}</Text>
            <Text style={styles.hint}>O banhista menciona este código no WhatsApp.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.kicker}>Carrinho</Text>
            <Text style={styles.line}>Telefone · {live.account.phone}</Text>
            <Text style={styles.line}>Id do mapa · {live.account.catalogId}</Text>
            {live.presence?.online ? (
              <Text style={styles.line}>
                GPS · {live.presence.lat.toFixed(5)}, {live.presence.lng.toFixed(5)}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={styles.secondary}
            onPress={async () => {
              await logoutAmbulante();
              await live.refreshAccount();
            }}
          >
            <Text style={styles.secondaryText}>Sair da conta</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[sky.themeColor, "#081828"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 18,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Sou ambulante</Text>
        <Text style={styles.sub}>Registre o carrinho e controle o pin na areia.</Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "login" && styles.tabOn]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextOn]}>Entrar</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "register" && styles.tabOn]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.tabText, mode === "register" && styles.tabTextOn]}>Registrar</Text>
          </Pressable>
        </View>

        {mode === "register" && (
          <>
            <Field label="Nome do carrinho" value={name} onChange={setName} placeholder="Ex.: Milho Verde" />
            <Field label="Tag" value={tag} onChange={setTag} placeholder="Ex.: Espiga na brasa" />
            <Text style={styles.kicker}>Ligar a um pin do catálogo (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              <Pressable
                style={[styles.chip, !catalogId && styles.chipOn]}
                onPress={() => setCatalogId("")}
              >
                <Text style={styles.chipText}>Novo pin</Text>
              </Pressable>
              {choices.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.chip, catalogId === c.id && styles.chipOn]}
                  onPress={() => {
                    setCatalogId(c.id);
                    if (!name) setName(c.label.split(" · ")[0] ?? "");
                  }}
                >
                  <Text style={styles.chipText}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Field
          label="Telefone (WhatsApp)"
          value={phone}
          onChange={setPhone}
          placeholder="27999999999"
          keyboardType="phone-pad"
        />
        <Field
          label="PIN (4–6 dígitos)"
          value={pin}
          onChange={setPin}
          placeholder="••••"
          keyboardType="number-pad"
          secure
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} disabled={busy} onPress={() => void submit()}>
          {busy ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.primaryText}>{mode === "login" ? "Entrar" : "Criar conta"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.kicker}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.input}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 4 },
  hero: { alignItems: "flex-start", gap: 4 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900" },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  meta: { color: "#fdba74", fontWeight: "700" },
  card: {
    backgroundColor: "rgba(15,23,42,0.55)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 8,
  },
  cardOn: { borderColor: "rgba(34,197,94,0.55)", backgroundColor: "rgba(22,101,52,0.35)" },
  cardOff: { borderColor: "rgba(148,163,184,0.35)" },
  statusLabel: { color: "#fff", fontSize: 18, fontWeight: "900" },
  statusHint: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
  toggle: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    paddingVertical: 14,
  },
  toggleOn: { backgroundColor: "#16a34a" },
  toggleOff: { backgroundColor: "#ef4444" },
  toggleText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  kicker: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  code: { color: "#fde68a", fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  hint: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  line: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  tabs: { flexDirection: "row", gap: 8, marginTop: 8 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabOn: { backgroundColor: "#f97316" },
  tabText: { color: "rgba(255,255,255,0.7)", fontWeight: "800" },
  tabTextOn: { color: "#fff" },
  input: {
    backgroundColor: "rgba(15,23,42,0.55)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chipOn: { backgroundColor: "#f97316" },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  error: { color: "#fecaca", fontWeight: "700" },
  primary: {
    marginTop: 8,
    backgroundColor: "#fdba74",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  secondary: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
});
