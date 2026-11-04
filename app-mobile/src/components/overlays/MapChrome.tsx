import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X } from "lucide-react-native";
import { useApp } from "../../context/AppContext";
import { FilterChips } from "./FilterChips";
import { SosHoldButton } from "./SosHoldButton";
import { GuaraPose } from "../guara/GuaraPose";

type Props = {
  onOpenGuara: () => void;
  onOpenSos: () => void;
  onMuroTip?: () => void;
};

export function MapChrome({ onOpenGuara, onOpenSos }: Props) {
  const insets = useSafeAreaInsets();
  const {
    filter,
    setFilter,
    dayLayer,
    setDayLayer,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    weather,
    sky,
  } = useApp();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.weatherPill}>
            <Text style={styles.weatherTemp}>
              {weather.data ? `${Math.round(weather.data.temp)}°` : "··°"}
            </Text>
            <Text style={styles.weatherSub} numberOfLines={1}>
              {weather.data?.summary ?? "Clima"} · {sky.label}
            </Text>
          </View>
          <Pressable
            onPress={() => setSearchOpen(!searchOpen)}
            style={styles.iconBtn}
            accessibilityLabel="Buscar na orla"
          >
            {searchOpen ? <X color="#fff" size={18} /> : <Search color="#fff" size={18} />}
          </Pressable>
        </View>

        {searchOpen && (
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Quiosque 12, ducha, escuna…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.search}
            autoFocus
          />
        )}

        <FilterChips
          filter={filter}
          onFilter={setFilter}
          dayLayer={dayLayer}
          onDayLayer={setDayLayer}
        />
      </View>

      <SosHoldButton onTrigger={onOpenSos} top={insets.top + 168} />

      <Pressable
        onPress={onOpenGuara}
        style={[styles.guaraFab, { bottom: insets.bottom + 28 }]}
        accessibilityLabel="Abrir Guará"
      >
        <GuaraPose pose="bust" size={54} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 10,
    zIndex: 30,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weatherPill: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  weatherTemp: { color: "#fff", fontSize: 18, fontWeight: "800" },
  weatherSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  search: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  guaraFab: {
    position: "absolute",
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 40,
  },
});
