import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MAP_FILTERS, type MapFilter } from "../../data/catalog";
import { DAY_LAYER_CHIPS, type DayLayer } from "../../data/day-layers";
import { pulseSoft } from "../../utils/haptics";

type Props = {
  filter: MapFilter;
  onFilter: (f: MapFilter) => void;
  dayLayer: DayLayer;
  onDayLayer: (l: DayLayer) => void;
  sunAvailable?: boolean;
};

/** Filtros no estilo do web: faixa única arredondada + camadas do dia. */
export function FilterChips({ filter, onFilter, dayLayer, onDayLayer, sunAvailable = true }: Props) {
  return (
    <View style={styles.stack}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.bar}
      >
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
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.label, active && styles.labelOn]}>
                {item.emoji} {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.barSoft}
      >
        {DAY_LAYER_CHIPS.map((item) => {
          const active = dayLayer === item.id;
          const blocked = item.id === "sol" && !sunAvailable;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (blocked) return;
                void pulseSoft();
                onDayLayer(item.id);
              }}
              style={[styles.chipSoft, active && styles.chipSoftOn, blocked && styles.chipBlocked]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: blocked }}
              accessibilityHint={blocked ? "Sol disponível das 05:30 às 17:30" : undefined}
            >
              <Text style={[styles.labelSoft, active && styles.labelOn, blocked && styles.labelBlocked]}>
                {item.emoji} {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 6 },
  bar: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  barSoft: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(8,47,73,0.5)",
  },
  row: { gap: 4, paddingHorizontal: 6, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipOn: { backgroundColor: "#fff" },
  chipSoft: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipSoftOn: { backgroundColor: "rgba(250,204,21,0.9)" },
  chipBlocked: { opacity: 0.4 },
  label: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  labelSoft: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" },
  labelOn: { color: "#142018" },
  labelBlocked: { color: "rgba(255,255,255,0.45)" },
});
