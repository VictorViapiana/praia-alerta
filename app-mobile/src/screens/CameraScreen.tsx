import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Check, Download, Heart, Share2, SwitchCamera, X, Zap } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/types";
import { composeFramedPhoto } from "../utils/frame-photo";
import { pulseSoft } from "../utils/haptics";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

const FRAME = require("../assets/frames/eu-amo-guarapari.png");

/**
 * Câmera real do celular + moldura PNG do web (`/frames/eu-amo-guarapari.png`).
 * Paridade `TouristCamera`: preview ao vivo, captura, composição da moldura, salvar/compartilhar.
 */
export function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const camRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [torch, setTorch] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [phase, setPhase] = useState<"live" | "review">("live");
  const [shotUri, setShotUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const take = async () => {
    if (busy || !camRef.current) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setFlashOn(true);
      setTimeout(() => setFlashOn(false), 160);
      const photo = await camRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
        mirror: facing === "front",
        shutterSound: false,
      });
      if (!photo?.uri) throw new Error("empty");
      const framed = await composeFramedPhoto(photo.uri);
      setShotUri(framed);
      setSaved(false);
      setPhase("review");
      void pulseSoft();
    } catch {
      setError("Não deu pra capturar. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!shotUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setNotice("Permita o acesso à galeria para salvar.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(shotUri);
      setSaved(true);
      setNotice(null);
      void pulseSoft();
    } catch {
      setNotice("Não consegui salvar na galeria.");
    }
  };

  const share = async () => {
    if (!shotUri) return;
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setNotice("Este celular não abriu o compartilhar.");
        return;
      }
      await Sharing.shareAsync(shotUri, {
        mimeType: "image/jpeg",
        dialogTitle: "Eu amo Guarapari",
      });
    } catch {
      setNotice("Este celular não abriu a foto para compartilhar.");
    }
  };

  const retake = () => {
    setShotUri(null);
    setPhase("live");
    setNotice(null);
    setSaved(false);
    setError(null);
    void pulseSoft();
  };

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.permTitle}>Preciso da câmera</Text>
        <Text style={styles.permBody}>
          Permita o acesso para tirar sua foto com a moldura Eu amo Guarapari.
        </Text>
        <Pressable style={styles.permBtn} onPress={() => void requestPermission()}>
          <Text style={styles.permBtnText}>Permitir câmera</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.permCancel}>Fechar</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "review" && shotUri) {
    return (
      <View style={[styles.fill, styles.reviewBg]}>
        <View style={[styles.reviewTop, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.topBtn} onPress={() => navigation.goBack()} accessibilityLabel="Fechar">
            <X color="#fff" size={20} />
          </Pressable>
          <View style={styles.capturedPill}>
            <Check color="#6ee7b7" size={16} />
            <Text style={styles.capturedText}>Foto capturada!</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.reviewStage}>
          <Image source={{ uri: shotUri }} style={styles.reviewImg} resizeMode="contain" />
        </View>

        <View style={[styles.reviewDock, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable style={styles.saveBtn} onPress={() => void save()}>
            <Download color="#fff" size={20} />
            <Text style={styles.saveText}>{saved ? "Foto salva" : "Salvar na Galeria"}</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={() => void share()}>
            <Share2 color="#fff" size={20} />
            <Text style={styles.shareText}>Compartilhar</Text>
          </Pressable>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <Pressable onPress={retake}>
            <Text style={styles.retake}>← Tirar outra foto</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <View style={styles.stage}>
        <CameraView
          ref={camRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torch && facing === "back"}
          mirror={facing === "front"}
        />
        {/* Moldura PNG idêntica ao web — object-fill */}
        <Image source={FRAME} style={styles.frame} resizeMode="stretch" pointerEvents="none" />
      </View>

      {flashOn ? <View style={styles.flash} pointerEvents="none" /> : null}

      <Pressable
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Fechar câmera"
      >
        <X color="#fff" size={18} />
      </Pressable>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>A câmara ficou quieta</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable style={styles.permBtn} onPress={() => setError(null)}>
            <Text style={styles.permBtnText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busy} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.busyText}>Aplicando moldura…</Text>
        </View>
      ) : null}

      <View style={[styles.liveDock, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable
          style={[styles.roundBtn, torch && styles.roundBtnOn]}
          onPress={() => setTorch((t) => !t)}
          accessibilityLabel="Flash"
        >
          <Zap color={torch ? "#3a2208" : "#fff"} size={20} fill={torch ? "#3a2208" : "transparent"} />
        </Pressable>

        <Pressable
          style={[styles.shutterOuter, (busy || !!error) && { opacity: 0.4 }]}
          onPress={() => void take()}
          disabled={busy || !!error}
          accessibilityLabel="Capturar foto"
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable
          style={styles.roundBtn}
          onPress={() => {
            setFacing((f) => (f === "front" ? "back" : "front"));
            setTorch(false);
            void pulseSoft();
          }}
          accessibilityLabel="Alternar câmera"
        >
          <SwitchCamera color="#fff" size={20} />
        </Pressable>
      </View>

      <View style={[styles.brandFloat, { top: insets.top + 14 }]} pointerEvents="none">
        <Heart color="#fda4af" fill="#fb7185" size={11} />
        <Text style={styles.brandText}>Eu amo Guarapari</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  stage: { flex: 1, overflow: "hidden" },
  frame: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    zIndex: 2,
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 40,
  },
  closeBtn: {
    position: "absolute",
    left: 16,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandFloat: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 45,
  },
  brandText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  liveDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    zIndex: 50,
  },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnOn: { backgroundColor: "#fbbf24" },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 999,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  busy: {
    ...StyleSheet.absoluteFill,
    zIndex: 60,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  busyText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  errorCard: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "32%",
    zIndex: 55,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  errorTitle: { color: "#fff", fontSize: 22, fontWeight: "700", fontStyle: "italic" },
  errorBody: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center" },
  reviewBg: { backgroundColor: "#075985" },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  capturedPill: { flexDirection: "row", alignItems: "center", gap: 6 },
  capturedText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewStage: { flex: 1, paddingHorizontal: 12, minHeight: 0 },
  reviewImg: { width: "100%", height: "100%" },
  reviewDock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#22c55e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  shareBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  notice: { color: "rgba(255,255,255,0.7)", textAlign: "center", fontSize: 12 },
  retake: { color: "rgba(255,255,255,0.7)", textAlign: "center", fontSize: 14, paddingVertical: 6 },
  permTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  permBody: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center", lineHeight: 20 },
  permBtn: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permBtnText: { color: "#082f49", fontWeight: "800" },
  permCancel: { color: "rgba(255,255,255,0.6)", fontWeight: "700", marginTop: 8 },
});
