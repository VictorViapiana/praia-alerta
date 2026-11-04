import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { pulseSoft } from "../utils/haptics";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

/**
 * Moldura “Eu amo Guarapari” — paridade com tourist-camera do web.
 * Usa preview da orla + share nativo (câmera ao vivo via Expo Camera na próxima build nativa).
 */
export function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [flip, setFlip] = useState(false);
  const shot = useRef(0);
  const [flash, setFlash] = useState(false);

  return (
    <View style={styles.fill}>
      <Image
        source={require("../assets/guarapari/praia-vista.jpg")}
        style={[styles.preview, flip && { transform: [{ scaleX: -1 }] }]}
        resizeMode="cover"
      />
      <View style={styles.frame} pointerEvents="none">
        <View style={styles.frameInner}>
          <Text style={styles.frameBrand}>Eu amo Guarapari</Text>
          <Text style={styles.frameSub}>Praia do Morro · Praia Alerta Guará</Text>
        </View>
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.topBtn}>Fechar</Text>
        </Pressable>
        <Pressable onPress={() => setFlash((f) => !f)}>
          <Text style={styles.topBtn}>{flash ? "Flash ligado" : "Flash"}</Text>
        </Pressable>
      </View>

      <View style={[styles.dock, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable
          style={styles.side}
          onPress={() => {
            setFlip((f) => !f);
            void pulseSoft();
          }}
        >
          <Text style={styles.sideText}>Virar</Text>
        </Pressable>
        <Pressable
          style={styles.shutter}
          onPress={() => {
            shot.current += 1;
            void pulseSoft();
            void Share.share({
              message: `Eu amo Guarapari 💛 Praia do Morro — foto ${shot.current} pelo Praia Alerta Guará.`,
            });
          }}
        />
        <Pressable
          style={styles.side}
          onPress={() =>
            void Share.share({
              message: "Eu amo Guarapari — Praia do Morro no Praia Alerta Guará.",
            })
          }
        >
          <Text style={styles.sideText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  preview: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  frame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 18,
    borderColor: "rgba(253,224,71,0.85)",
    justifyContent: "flex-end",
  },
  frameInner: {
    backgroundColor: "rgba(15,23,42,0.55)",
    padding: 16,
    paddingBottom: 120,
  },
  frameBrand: { color: "#fde68a", fontSize: 28, fontWeight: "900" },
  frameSub: { color: "#fff", fontWeight: "600", marginTop: 4 },
  top: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBtn: { color: "#fff", fontWeight: "800" },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: "rgba(253,224,71,0.95)",
  },
  side: {
    width: 64,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sideText: { color: "#fff", fontWeight: "800" },
});
