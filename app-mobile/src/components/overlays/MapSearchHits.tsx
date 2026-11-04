import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fold } from "../../data/coast";
import {
  ACADEMIA_ORLA,
  AMBULANTES,
  ESCUNA_POINT,
  GOLFINHO,
  MARLIN,
  PLACES,
  SHOWERS,
} from "../../data/places";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { RAMPS } from "../../data/rampas";

type Hit = {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
};

type Props = {
  query: string;
  onPick: (id: string) => void;
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

  const hits: Hit[] = [];

  for (const p of PLACES) {
    const s = score(p.name, q) || score(p.tag || "", q);
    if (s > 0) hits.push({ id: p.id, title: p.name, subtitle: p.hours, kind: p.isSponsor ? "Patrocinador" : "Ponto" });
  }
  for (const s of SHOWERS) {
    if (score(s.name, q) || fold(q).includes("ducha")) {
      hits.push({ id: s.id, title: s.name, subtitle: s.detail, kind: "Ducha" });
    }
  }
  for (const v of vendors.length ? vendors : AMBULANTES) {
    if (!(v.isSponsor && v.isOnline)) continue;
    if (score(v.name, q) || score(v.tag, q) || fold(q).includes("ambulante")) {
      hits.push({ id: v.id, title: v.name, subtitle: v.tag, kind: "Ambulante" });
    }
  }
  for (const r of RAMPS) {
    if (score(r.name, q) || fold(q).includes("rampa")) {
      hits.push({ id: r.id, title: r.name, subtitle: r.detail, kind: "Rampa" });
    }
  }
  for (const l of [MARLIN, GOLFINHO, ACADEMIA_ORLA, ESCUNA_POINT]) {
    if (score(l.name, q)) hits.push({ id: l.id, title: l.name, subtitle: "Landmark", kind: "Orla" });
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
      <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
        {unique.map((hit) => (
          <Pressable key={hit.id} style={styles.row} onPress={() => onPick(hit.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{hit.title}</Text>
              <Text style={styles.sub}>{hit.subtitle}</Text>
            </View>
            <Text style={styles.kind}>{hit.kind}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 8,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 14 },
  sub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  kind: { color: "#7dd3fc", fontSize: 11, fontWeight: "800" },
  empty: { color: "rgba(255,255,255,0.65)", padding: 14, fontSize: 13 },
});
