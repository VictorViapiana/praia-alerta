import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
        cover: p.cover,
        gold: p.isSponsor,
      });
    }
  }
  for (const s of SHOWERS) {
    if (score(s.name, q) || fold(q).includes("ducha")) {
      hits.push({ id: s.id, title: s.name, subtitle: s.detail, kind: "Ducha", lat: s.lat, lng: s.lng });
    }
  }
  for (const v of vendors.length ? vendors : AMBULANTES) {
    if (!(v.isSponsor && v.isOnline)) continue;
    if (score(v.name, q) || score(v.tag, q) || fold(q).includes("ambulante")) {
      hits.push({
        id: v.id,
        title: v.name,
        subtitle: v.tag,
        kind: "Ambulante",
        lat: v.lat,
        lng: v.lng,
        cover: v.cover,
        gold: true,
      });
    }
  }
  for (const r of RAMPS) {
    if (score(r.name, q) || fold(q).includes("rampa")) {
      hits.push({ id: r.id, title: r.name, subtitle: r.detail, kind: "Rampa", lat: r.lat, lng: r.lng });
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
        cover: "cover" in l ? String(l.cover) : undefined,
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
      <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
        {unique.map((hit) => (
          <Pressable
            key={hit.id}
            style={[styles.row, hit.gold && styles.rowGold]}
            onPress={() => onPick(hit)}
          >
            {hit.cover ? (
              <Image source={mediaImage(hit.cover)} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{hit.title}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {hit.subtitle}
              </Text>
            </View>
            <Text style={[styles.kind, hit.gold && styles.kindGold]}>{hit.kind}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
    overflow: "hidden",
    marginBottom: 4,
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
  rowGold: {
    backgroundColor: "rgba(253,230,138,0.22)",
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  thumbEmpty: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  title: { color: "#142018", fontWeight: "800", fontSize: 14 },
  sub: { color: "rgba(20,32,24,0.55)", fontSize: 12, marginTop: 2 },
  kind: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  kindGold: { color: "#b45309" },
  empty: { color: "rgba(20,32,24,0.65)", padding: 14, fontSize: 13 },
});
