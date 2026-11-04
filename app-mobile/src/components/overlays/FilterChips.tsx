import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MAP_FILTERS, type MapFilter } from "../../data/catalog";
import { DAY_LAYER_CHIPS, type DayLayer } from "../../data/day-layers";
import { pulseSoft } from "../../utils/haptics";

type Props = {
  filter: MapFilter;
  onFilter: (f: MapFilter) => void;
  dayLayer: DayLayer;
  onDayLayer: (l: DayLayer) => void;
};

export function FilterChips({ filter, onFilter, dayLayer, onDayLayer }: Props) {
  return (
    <View style={styles.stack}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {MAP_FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void pulseSoft();
                onFilter(item.id);
              }}
              style={[styles.chip, active && styles.chipOn]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.label, active && styles.labelOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DAY_LAYER_CHIPS.map((item) => {
          const active = dayLayer === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void pulseSoft();
                onDayLayer(item.id);
              }}
              style={[styles.chipSoft, active && styles.chipSoftOn]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.labelSoft, active && styles.labelOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  row: { gap: 8, paddingHorizontal: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipOn: { backgroundColor: "rgba(14,165,233,0.92)", borderColor: "rgba(255,255,255,0.35)" },
  chipSoft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipSoftOn: { backgroundColor: "rgba(250,204,21,0.85)", borderColor: "rgba(255,255,255,0.4)" },
  emoji: { fontSize: 13 },
  label: { color: "rgba(255,255,255,0.88)", fontSize: 12, fontWeight: "600" },
  labelSoft: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" },
  labelOn: { color: "#0f172a" },
});
