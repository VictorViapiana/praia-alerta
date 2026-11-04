import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Heart, LocateFixed, Search, X } from "lucide-react-native";
import { useApp } from "../../context/AppContext";
import { FilterChips } from "./FilterChips";
import { SosHoldButton } from "./SosHoldButton";
import { GuaraPose } from "../guara/GuaraPose";
import { MapSearchHits } from "./MapSearchHits";

type Props = {
  onOpenGuara: () => void;
  onOpenSos: () => void;
  onLocate: () => void;
  onOpenCamera: () => void;
  locating?: boolean;
  locateNote?: string | null;
};

/** Chrome do mapa alinhado ao web: título, localizar, satélite/limpo, busca embaixo, câmera. */
export function MapChrome({
  onOpenGuara,
  onOpenSos,
  onLocate,
  onOpenCamera,
  locating = false,
  locateNote = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const {
    filter,
    setFilter,
    dayLayer,
    setDayLayer,
    basemap,
    setBasemap,
    searchQuery,
    setSearchQuery,
    setSelectedId,
    setSearchOpen,
  } = useApp();

  const searchExpanded = searchQuery.trim().length > 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Título como no web */}
      <View style={[styles.titleBlock, { top: insets.top + 6 }]} pointerEvents="none">
        <Text style={styles.eyebrow}>Praia do Morro</Text>
        <Text style={styles.title}>Mapa & Localização</Text>
      </View>

      {/* Localizar + satélite/limpo — canto direito */}
      <View style={[styles.rightStack, { top: insets.top + 58 }]} pointerEvents="box-none">
        <Pressable
          onPress={onLocate}
          style={[styles.locateBtn, locating && styles.locateBtnBusy]}
          accessibilityLabel="Minha localização"
        >
          <LocateFixed color="#1d4ed8" size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.locateCaption}>Minha localização</Text>

        <View style={styles.basemapGroup}>
          {(
            [
              ["satellite", "Satélite"],
              ["clean", "Limpo"],
            ] as const
          ).map(([id, label]) => {
            const on = basemap === id;
            return (
              <Pressable
                key={id}
                onPress={() => setBasemap(id)}
                style={[styles.basemapBtn, on && styles.basemapBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.basemapText, on && styles.basemapTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {locateNote ? <Text style={styles.locateNote}>{locateNote}</Text> : null}
      </View>

      <SosHoldButton onTrigger={onOpenSos} top={insets.top + 210} />

      {/* Câmera Eu amo Guarapari */}
      <Pressable
        onPress={onOpenCamera}
        style={[styles.cameraFab, { bottom: insets.bottom + 168 }]}
        accessibilityLabel="Eu amo Guarapari. Abrir a câmera."
      >
        <View style={styles.cameraOrb}>
          <View style={styles.cameraInner}>
            <Camera color="#fff" size={22} strokeWidth={2.2} />
          </View>
        </View>
        <View style={styles.cameraLabel}>
          <Heart color="#fda4af" size={10} fill="#fb7185" />
          <Text style={styles.cameraLabelText}>Eu amo Guarapari</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onOpenGuara}
        style={[styles.guaraFab, { bottom: insets.bottom + 168 }]}
        accessibilityLabel="Abrir Guará"
      >
        <GuaraPose pose="bust" size={54} />
      </Pressable>

      {/* Busca + filtros — ancorados embaixo como no web */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        {searchExpanded && (
          <MapSearchHits
            query={searchQuery}
            onPick={(id) => {
              setSelectedId(id);
              setSearchQuery("");
              setSearchOpen(false);
            }}
          />
        )}
        <View style={[styles.searchBar, searchExpanded && styles.searchBarOpen]}>
          <Search color={searchExpanded ? "#a16207" : "rgba(255,255,255,0.7)"} size={14} />
          <TextInput
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setSearchOpen(t.length > 0);
            }}
            placeholder="Buscar estabelecimento"
            placeholderTextColor={searchExpanded ? "rgba(20,32,24,0.45)" : "rgba(255,255,255,0.45)"}
            style={[styles.searchInput, searchExpanded && styles.searchInputOpen]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <X color={searchExpanded ? "#142018" : "#fff"} size={14} />
            </Pressable>
          ) : null}
        </View>

        <FilterChips
          filter={filter}
          onFilter={(next) => setFilter(next === filter && next !== "neutro" ? "neutro" : next)}
          dayLayer={dayLayer}
          onDayLayer={setDayLayer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    position: "absolute",
    left: 20,
    right: 72,
    zIndex: 30,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 2 },
  },
  rightStack: {
    position: "absolute",
    right: 14,
    alignItems: "flex-end",
    gap: 4,
    zIndex: 40,
  },
  locateBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  locateBtnBusy: { opacity: 0.55 },
  locateCaption: {
    backgroundColor: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  basemapGroup: {
    marginTop: 4,
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 2,
  },
  basemapBtn: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  basemapBtnOn: { backgroundColor: "#fff" },
  basemapText: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700" },
  basemapTextOn: { color: "#142018" },
  locateNote: {
    maxWidth: 150,
    color: "#fff",
    fontSize: 10,
    textAlign: "right",
    lineHeight: 13,
  },
  cameraFab: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    gap: 6,
    zIndex: 50,
  },
  cameraOrb: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cameraLabelText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  guaraFab: {
    position: "absolute",
    left: 16,
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
    zIndex: 50,
  },
  bottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    gap: 8,
    zIndex: 55,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBarOpen: {
    backgroundColor: "#fff",
    borderColor: "rgba(253,230,138,0.7)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    padding: 0,
  },
  searchInputOpen: { color: "#142018" },
});
