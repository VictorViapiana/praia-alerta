import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GuaraPose } from "../components/guara/GuaraPose";
import { useSkyPhase } from "../data/sky-phase";

type Props = { onDone: () => void };

export function SplashScreen({ onDone }: Props) {
  const sky = useSkyPhase();

  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <LinearGradient colors={[sky.themeColor, "#0b2a48", "#041525"]} style={styles.fill}>
      <View style={styles.center}>
        <GuaraPose pose="full" size={180} />
        <Image source={require("../assets/images/logo-splash.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>Praia Alerta Guará</Text>
        <Text style={styles.sub}>Praia do Morro · Guarapari</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: 10, paddingHorizontal: 28 },
  logo: { width: 72, height: 72, marginTop: 8 },
  brand: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: 0.2 },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
});
