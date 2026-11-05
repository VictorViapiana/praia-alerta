import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { mediaImage } from "../../assets/media";
import { fold } from "../../data/coast";
import {
  ACADEMIA_ORLA,
  AMBULANTES,
  ESCUNA_POINT,
  GOLFINHO,
  MARLIN,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
} from "../../data/places";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { RAMPS } from "../../data/rampas";

export type SearchHit = {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  lat: number;
  lng: number;
  cover?: string;
  gold?: boolean;
};

type Props = {
  query: string;
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

export function MapSearchHits({ query, onPick }: Props) {
  const { vendors } = useAmbulanteLive();
  const q = query.trim();
  if (!q) return null;

  const hits: SearchHit[] = [];

  for (const p of PLACES) {
    const s = score(p.name, q) || score(p.tag || "", q);
    if (s > 0) {
      hits.push({
        id: p.id,
        title: p.name,
        subtitle: p.hours,
        kind: p.isSponsor ? "Patrocinador" : "Ponto",
        lat: p.lat,
        lng: p.lng,
        cover: p.cover ?? FALLBACK_COVER,
        gold: p.isSponsor,
      });
    }
  }
  for (const s of SHOWERS) {
    if (score(s.name, q) || fold(q).includes("ducha")) {
      hits.push({
        id: s.id,
        title: s.name,
        subtitle: s.detail,
        kind: "Ducha",
        lat: s.lat,
        lng: s.lng,
        cover: FALLBACK_COVER,
      });
    }
  }
  for (const v of vendors.length ? vendors : AMBULANTES) {
    if (!(v.isSponsor && v.isOnline)) continue;
    if (score(v.name, q) || score(v.tag, q) || fold(q).includes("ambulante")) {
      hits.push({
        id: v.id,
        title: v.name,
        subtitle: v.tag,
        kind: "Patrocinador",
        lat: v.lat,
        lng: v.lng,
        cover: v.cover ?? FALLBACK_COVER,
        gold: true,
      });
    }
  }
  for (const r of RAMPS) {
    if (score(r.name, q) || fold(q).includes("rampa")) {
      hits.push({
        id: r.id,
        title: r.name,
        subtitle: r.detail,
        kind: "Rampa",
        lat: r.lat,
        lng: r.lng,
        cover: FALLBACK_COVER,
      });
    }
  }
  for (const l of [MARLIN, GOLFINHO, ACADEMIA_ORLA, ESCUNA_POINT, ...ORLA_LANDMARKS]) {
    if (score(l.name, q) || ("search" in l && typeof l.search === "string" && fold(l.search).includes(fold(q)))) {
      hits.push({
        id: l.id,
        title: l.name,
        subtitle: "detail" in l ? String(l.detail) : "Landmark",
        kind: "Orla",
        lat: l.lat,
        lng: l.lng,
        cover: "cover" in l ? String(l.cover) : FALLBACK_COVER,
      });
    }
  }

  hits.sort((a, b) => score(b.title, q) - score(a.title, q));
  const unique = hits.filter((h, i, arr) => arr.findIndex((x) => x.id === h.id) === i).slice(0, 12);

  if (!unique.length) {
    return (
      <View style={styles.box}>
        <Text style={styles.empty}>Nada encontrado para “{q}”.</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.count}>{unique.length} na orla</Text>
      <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
        {unique.map((hit) =>
          hit.gold ? (
            <Pressable key={hit.id} style={styles.goldRow} onPress={() => onPick(hit)}>
              <Image source={mediaImage(hit.cover)} style={styles.goldThumb} />
              <View style={{ flex: 1 }}>
                <View style={styles.goldEyebrow}>
                  <Star color="#fbbf24" size={10} fill="#fbbf24" />
                  <Text style={styles.goldEyebrowText}>Patrocinador</Text>
                </View>
                <Text style={styles.goldTitle}>{hit.title}</Text>
                <Text style={styles.goldSub} numberOfLines={1}>
                  {hit.subtitle}
                </Text>
              </View>
            </Pressable>
          ) : (
            <Pressable key={hit.id} style={styles.row} onPress={() => onPick(hit)}>
              <Image source={mediaImage(hit.cover)} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{hit.title}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {hit.subtitle}
                </Text>
              </View>
              <Text style={styles.kind}>{hit.kind}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
    overflow: "hidden",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  count: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    color: "rgba(20,32,24,0.45)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(15,23,42,0.08)",
  },
  goldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 10,
    marginVertical: 6,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#241608",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  goldThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#3a2208",
  },
  title: { color: "#142018", fontWeight: "800", fontSize: 14 },
  sub: { color: "rgba(20,32,24,0.55)", fontSize: 12, marginTop: 2 },
  kind: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  goldEyebrow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  goldEyebrowText: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  goldTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  goldSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  empty: { color: "rgba(20,32,24,0.65)", padding: 14, fontSize: 13 },
});
