import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Star } from "lucide-react-native";
import { mediaImage } from "../../assets/media";
import { PIN_IMAGES } from "../../assets/pins";
import { fold } from "../../data/coast";
import type { MapFilter } from "../../data/catalog";
import {
  ACADEMIA_ORLA,
  AMBULANTES,
  ESCUNA_POINT,
  GOLFINHO,
  MARLIN,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
  escunasPatrocinadoras,
} from "../../data/places";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { RAMPS, RAMPA_NOTE } from "../../data/rampas";
import { GuaraPose } from "../guara/GuaraPose";

export type SearchHit = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  kind: string;
  lat: number;
  lng: number;
  cover?: string;
  tag?: string;
  gold?: boolean;
  vendor?: boolean;
};

type Props = {
  query: string;
  filter?: MapFilter;
  onPick: (hit: SearchHit) => void;
};

const FALLBACK_COVER = "/guarapari/praia-orla.jpg";

function score(name: string, query: string) {
  const n = fold(name);
  const q = fold(query);
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 60;
  return 0;
}

function GoldSheen() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: 6500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: ["-130%", "130%"] });
  return (
    <Animated.View pointerEvents="none" style={[styles.sheen, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.22)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function MarkChip({ gold, onPress }: { gold?: boolean; onPress: () => void }) {
  if (gold) {
    return (
      <Pressable onPress={onPress} style={styles.markGoldWrap}>
        <LinearGradient colors={["#fde68a", "#fdba74"]} style={styles.markGold}>
          <MapPin color="#3a2208" size={11} />
          <Text style={styles.markGoldText}>Marcar no mapa</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.markFree}>
      <MapPin color="#fff" size={11} />
      <Text style={styles.markFreeText}>Marcar no mapa</Text>
    </Pressable>
  );
}

function SponsorCard({ hit, onPick }: { hit: SearchHit; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} style={styles.goldCard}>
      <LinearGradient
        colors={["#3a2712", "#241608", "#120d08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GoldSheen />
      <View style={styles.goldInner}>
        <View style={styles.goldThumbBox}>
          <Image source={mediaImage(hit.cover ?? FALLBACK_COVER)} style={styles.goldThumb} />
          <View style={styles.starBadge}>
            <Star color="#fcd34d" size={10} fill="#fcd34d" />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.goldEyebrow}>Patrocinador</Text>
          <Text style={styles.goldTitle} numberOfLines={1}>
            {hit.title}
          </Text>
          <Text style={styles.goldSub} numberOfLines={1}>
            {hit.tag ? `${hit.tag} · ` : ""}
            {hit.subtitle}
          </Text>
          {hit.detail ? (
            <Text style={styles.goldDetail} numberOfLines={1}>
              {hit.detail}
            </Text>
          ) : null}
          <View style={{ marginTop: 6 }}>
            <MarkChip gold onPress={onPick} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function VendorCard({ hit, onPick }: { hit: SearchHit; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} style={styles.vendorCard}>
      <View style={styles.vendorRow}>
        <View style={styles.vendorIconWrap}>
          <Image source={PIN_IMAGES.carrinho} style={styles.vendorIcon} />
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.vendorTitle} numberOfLines={1}>
            {hit.title}
          </Text>
          <Text style={styles.vendorSub} numberOfLines={1}>
            {hit.tag ? `${hit.tag} · ` : ""}
            {hit.detail || hit.subtitle}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <MarkChip onPress={onPick} />
      </View>
    </Pressable>
  );
}

function FreeCard({ hit, onPick }: { hit: SearchHit; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} style={styles.freeCard}>
      <Text style={styles.freeTitle} numberOfLines={1}>
        {hit.title}
      </Text>
      <Text style={styles.freeSub} numberOfLines={2}>
        {hit.subtitle}
        {hit.detail ? ` · ${hit.detail}` : ""}
      </Text>
      <View style={{ marginTop: 8 }}>
        <MarkChip onPress={onPick} />
      </View>
    </Pressable>
  );
}

export function MapSearchHits({ query, filter = "neutro", onPick }: Props) {
  const { vendors: liveVendors } = useAmbulanteLive();
  const q = query.trim();
  const qFold = fold(q);

  const hits = useMemo(() => {
    if (!qFold) return [] as SearchHit[];
    const list: SearchHit[] = [];

    for (const p of PLACES) {
      if (filter !== "neutro" && p.mapKind !== filter) continue;
      const blob = fold(`${p.name} ${p.tag ?? ""} ${p.hours}`);
      if (!blob.includes(qFold) && score(p.name, q) <= 0) continue;
      list.push({
        id: p.id,
        title: p.name,
        subtitle: p.hours,
        detail: p.mapKind,
        kind: p.isSponsor ? "Patrocinador" : "Ponto",
        lat: p.lat,
        lng: p.lng,
        cover: p.cover ?? FALLBACK_COVER,
        tag: p.tag,
        gold: p.isSponsor,
      });
    }

    if (filter === "neutro" || filter === "duchas") {
      for (const s of SHOWERS) {
        if (!(score(s.name, q) || qFold.includes("ducha"))) continue;
        list.push({
          id: s.id,
          title: s.name,
          subtitle: "Pública",
          detail: s.detail,
          kind: "Ducha",
          lat: s.lat,
          lng: s.lng,
        });
      }
    }

    if (filter === "neutro" || filter === "ambulantes") {
      const pool = liveVendors.length ? liveVendors : AMBULANTES;
      for (const v of pool) {
        if (!(v.isSponsor && v.isOnline)) continue;
        if (!(score(v.name, q) || score(v.tag, q) || qFold.includes("ambulante"))) continue;
        list.push({
          id: v.id,
          title: v.name,
          subtitle: "Na areia agora",
          detail: "Ambulante credenciado",
          kind: "Patrocinador",
          lat: v.lat,
          lng: v.lng,
          cover: v.cover ?? FALLBACK_COVER,
          tag: v.tag,
          gold: true,
          vendor: true,
        });
      }
    }

    if (filter === "neutro") {
      const escunaBlob = fold(
        `ponto das escunas canal passeio barco ${escunasPatrocinadoras.map((item) => `${item.name} ${item.roteiro}`).join(" ")}`,
      );
      if (escunaBlob.includes(qFold)) {
        list.push({
          id: ESCUNA_POINT.id,
          title: ESCUNA_POINT.name,
          subtitle: "Passeios no canal",
          detail: escunasPatrocinadoras.map((item) => item.name).join(" · "),
          kind: "Patrocinador",
          lat: ESCUNA_POINT.lat,
          lng: ESCUNA_POINT.lng,
          cover: "/guarapari/praia-enseada.jpg",
          tag: "Patrocinador",
          gold: true,
        });
      }

      for (const l of [MARLIN, GOLFINHO, ACADEMIA_ORLA, ...ORLA_LANDMARKS]) {
        const blob = fold(
          `${l.name} ${"detail" in l ? l.detail : ""} ${"search" in l && typeof l.search === "string" ? l.search : ""}`,
        );
        if (!(blob.includes(qFold) || score(l.name, q))) continue;
        list.push({
          id: l.id,
          title: l.name,
          subtitle: "detail" in l ? String(l.detail) : "Landmark",
          detail: "Orla",
          kind: "Orla",
          lat: l.lat,
          lng: l.lng,
          cover: "cover" in l ? String(l.cover) : FALLBACK_COVER,
        });
      }
    }

    for (const r of RAMPS) {
      if (!(score(r.name, q) || fold(`${r.detail} rampa acesso`).includes(qFold))) continue;
      list.push({
        id: r.id,
        title: r.name,
        subtitle: "Acesso à areia",
        detail: RAMPA_NOTE,
        kind: "Rampa",
        lat: r.lat,
        lng: r.lng,
      });
    }

    list.sort(
      (a, b) =>
        Number(!!b.gold) - Number(!!a.gold) ||
        Number(!!a.vendor) - Number(!!b.vendor) ||
        score(b.title, q) - score(a.title, q) ||
        a.title.localeCompare(b.title, "pt"),
    );

    return list.filter((h, i, arr) => arr.findIndex((x) => x.id === h.id) === i).slice(0, 16);
  }, [filter, liveVendors, q, qFold]);

  const sponsors = hits.filter((h) => h.gold && !h.vendor);
  const vendors = hits.filter((h) => h.vendor);
  const rest = hits.filter((h) => !h.gold && !h.vendor);

  return (
    <View style={styles.box}>
      <View style={styles.headRow}>
        <Text style={styles.count}>{hits.length === 0 ? "Busca" : `${hits.length} na orla`}</Text>
        {sponsors.length > 0 ? (
          <Text style={styles.sponsorCount}>
            {sponsors.length === 1 ? "1 patrocinador" : `${sponsors.length} patrocinadores`}
          </Text>
        ) : null}
      </View>

      {hits.length === 0 ? (
        <View style={styles.empty}>
          <GuaraPose pose="busca" size={96} />
          <Text style={styles.emptyTitle}>Nada com esse nome na orla</Text>
          <Text style={styles.emptyBody}>
            Tente outro nome, um quiosque ou um ambulante. Ou volte ao mapa.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
          {sponsors.map((hit) => (
            <SponsorCard key={hit.id} hit={hit} onPick={() => onPick(hit)} />
          ))}
          {vendors.length > 0 ? <Text style={styles.sectionViolet}>Ambulantes na areia</Text> : null}
          {vendors.map((hit) => (
            <VendorCard key={hit.id} hit={hit} onPick={() => onPick(hit)} />
          ))}
          {rest.length > 0 ? <Text style={styles.sectionMuted}>Demais locais</Text> : null}
          {rest.map((hit) => (
            <FreeCard key={hit.id} hit={hit} onPick={() => onPick(hit)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "rgba(7,89,133,0.9)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    marginBottom: 6,
    paddingBottom: 10,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  count: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  sponsorCount: { color: "#fde68a", fontSize: 10, fontWeight: "600" },
  sectionViolet: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    color: "rgba(221,214,254,0.8)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  sectionMuted: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  goldCard: {
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.45)",
    overflow: "hidden",
    padding: 10,
  },
  goldInner: { flexDirection: "row", gap: 10 },
  goldThumbBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#3a2208",
  },
  goldThumb: { width: "100%", height: "100%" },
  starBadge: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#1c1208",
    alignItems: "center",
    justifyContent: "center",
  },
  goldEyebrow: {
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  goldTitle: { color: "#fff", fontWeight: "700", fontSize: 14, marginTop: 2 },
  goldSub: { color: "rgba(254,243,199,0.8)", fontSize: 11, marginTop: 2 },
  goldDetail: { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 1 },
  sheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "55%",
  },
  vendorCard: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.4)",
    backgroundColor: "rgba(46,16,101,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vendorIconWrap: { width: 32, height: 32 },
  vendorIcon: { width: 32, height: 32, resizeMode: "contain" },
  onlineDot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#34d399",
    borderWidth: 1,
    borderColor: "#fff",
  },
  vendorTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  vendorSub: { color: "rgba(237,233,254,0.75)", fontSize: 11, marginTop: 2 },
  freeCard: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  freeTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  freeSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2, lineHeight: 15 },
  markGoldWrap: { alignSelf: "flex-start", borderRadius: 999, overflow: "hidden" },
  markGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markGoldText: { color: "#3a2208", fontSize: 11, fontWeight: "700" },
  markFree: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markFreeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 20, gap: 8 },
  emptyTitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", textAlign: "center" },
  emptyBody: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 260,
  },
});
