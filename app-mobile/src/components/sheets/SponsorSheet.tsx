import { useEffect, useState, type ReactNode } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Gift,
  MapPinned,
  Share2,
  Star,
  UtensilsCrossed,
  Waves,
  X,
} from "lucide-react-native";
import type { Place, Ambulante } from "../../data/places";
import { ESCUNA_POINT, escunasPatrocinadoras } from "../../data/places";
import { GuaraPose } from "../guara/GuaraPose";
import type { SkyPhase } from "../../data/sky-phase";
import { giftCodeFor } from "../../data/ambulante-hub";
import { storageGet, storageSet } from "../../utils/storage";
import { pulseSoft } from "../../utils/haptics";
import { mediaImage } from "../../assets/media";

const STAMP_KEY = "pa-sponsor-stamps-v1";

type Props =
  | { kind: "place"; place: Place; skyPhase: SkyPhase; onClose: () => void; onRoute?: () => void }
  | { kind: "vendor"; vendor: Ambulante; onClose: () => void; onRoute?: () => void }
  | { kind: "escuna"; onClose: () => void; onRoute?: () => void };

export function SponsorSheet(props: Props) {
  if (props.kind === "place") {
    return <PlacePortal place={props.place} skyPhase={props.skyPhase} onClose={props.onClose} onRoute={props.onRoute} />;
  }
  if (props.kind === "vendor") {
    return <VendorPortal vendor={props.vendor} onClose={props.onClose} onRoute={props.onRoute} />;
  }
  return <EscunaPortal onClose={props.onClose} onRoute={props.onRoute} />;
}

function placeMark(name: string) {
  const label = (name.split("·")[1] ?? name).trim();
  const words = label.split(/\s+/).filter((w) => !/^(d[aeo]s?|e)$/i.test(w));
  const letters = words.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return letters.length > 1 ? letters : label.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function PlacePortal({
  place,
  skyPhase,
  onClose,
  onRoute,
}: {
  place: Place;
  skyPhase: SkyPhase;
  onClose: () => void;
  onRoute?: () => void;
}) {
  const [tab, setTab] = useState<"cardapio" | "agora" | "presente" | "ir">("agora");
  const [stamped, setStamped] = useState(false);
  const offer = place.offers?.[skyPhase];

  useEffect(() => {
    void storageGet(STAMP_KEY).then((raw) => {
      try {
        const ids = raw ? (JSON.parse(raw) as string[]) : [];
        setStamped(ids.includes(place.id));
      } catch {
        setStamped(false);
      }
    });
  }, [place.id]);

  const stamp = async () => {
    const raw = await storageGet(STAMP_KEY);
    let ids: string[] = [];
    try {
      ids = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      ids = [];
    }
    if (!ids.includes(place.id)) ids.push(place.id);
    await storageSet(STAMP_KEY, JSON.stringify(ids));
    setStamped(true);
    void pulseSoft();
  };

  return (
    <PortalShell
      cover={place.cover}
      mark={placeMark(place.name)}
      eyebrow="Portal do patrocinador"
      title={place.name}
      subtitle={place.hours}
      tag={place.tag}
      stamped={stamped}
      onClose={onClose}
      footer={
        <Pressable
          style={styles.wa}
          onPress={() => {
            const digits = (place.phone ?? "").replace(/\D/g, "");
            const text = encodeURIComponent(`Oi! Vi o ${place.name} no Praia Alerta Guará.`);
            void Linking.openURL(digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`);
          }}
        >
          <Text style={styles.waText}>Chamar no WhatsApp</Text>
        </Pressable>
      }
    >
      <View style={styles.tabs}>
        {(
          [
            ["cardapio", "Cardápio", UtensilsCrossed],
            ["agora", "Agora", Waves],
            ["presente", "Presente", Gift],
            ["ir", "Ir", MapPinned],
          ] as const
        ).map(([id, label, Icon]) => {
          const on = tab === id;
          return (
            <Pressable key={id} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(id)}>
              <Icon color={on ? "#3a2208" : "rgba(255,255,255,0.55)"} size={14} />
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "cardapio" && (
        <>
          {place.about ? <Text style={styles.pLight}>{place.about}</Text> : null}
          {place.moments?.length ? (
            <>
              <Text style={styles.section}>Momentos da casa</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {place.moments.map((m) => (
                  <View key={m.caption} style={styles.moment}>
                    <Image source={mediaImage(m.photo)} style={styles.momentImg} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.momentShade} />
                    <Text style={styles.momentCap}>{m.caption}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
          {place.menu?.length ? (
            <>
              <Text style={styles.section}>Top do cardápio</Text>
              {place.menu.map((item) => (
                <View key={item.name} style={styles.menuRow}>
                  <Image source={mediaImage(item.photo)} style={styles.menuThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuNameLight}>{item.name}</Text>
                  </View>
                  <Text style={styles.menuPriceLight}>{item.price}</Text>
                </View>
              ))}
            </>
          ) : null}
          {place.guaraTip ? <Tip text={place.guaraTip} /> : null}
        </>
      )}

      {tab === "agora" && (
        <View style={styles.offerDark}>
          <Text style={styles.kicker}>Pulso da casa</Text>
          <Text style={styles.offerTitle}>{offer?.title ?? "Momento da orla"}</Text>
          <Text style={styles.pLight}>{offer?.detail ?? place.about}</Text>
          {offer?.code ? <Text style={styles.code}>Código {offer.code}</Text> : null}
        </View>
      )}

      {tab === "presente" && (
        <View style={styles.offerDark}>
          <GuaraPose pose="festa" size={88} />
          <Text style={styles.kicker}>Passaporte da orla</Text>
          <Text style={styles.offerTitle}>{place.gift?.title ?? "Selo do Guará"}</Text>
          <Text style={styles.pLight}>
            {place.gift?.detail ?? "Toque para carimbar esta casa. Três selos e você vira Amigo da Orla."}
          </Text>
          {place.gift?.code ? <Text style={styles.code}>{place.gift.code}</Text> : null}
          <Pressable style={styles.stampBtn} onPress={() => void stamp()}>
            <Text style={styles.stampText}>{stamped ? "Selo guardado ✓" : "Carimbar selo agora"}</Text>
          </Pressable>
        </View>
      )}

      {tab === "ir" && (
        <View style={{ gap: 10 }}>
          <View style={styles.offerDark}>
            <Text style={styles.kicker}>Mesa mágica</Text>
            <Text style={styles.offerTitle}>Segurar mesa 15 min</Text>
            <Text style={styles.pLight}>
              Reservamos mentalmente sua mesa e abrimos o WhatsApp com a mensagem pronta.
            </Text>
          </View>
          <Pressable style={styles.routeBtn} onPress={onRoute}>
            <MapPinned color="#fff" size={16} />
            <View>
              <Text style={styles.routeTitle}>Ir até aqui</Text>
              <Text style={styles.routeSub}>A pé, bicicleta ou carro</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.shareBtn}
            onPress={() => void Share.share({ message: `Vem comigo no ${place.name} — Praia Alerta Guará.` })}
          >
            <Share2 color="#fff" size={16} />
            <Text style={styles.shareText}>Compartilhar esta casa</Text>
          </Pressable>
        </View>
      )}
    </PortalShell>
  );
}

function VendorPortal({
  vendor,
  onClose,
  onRoute,
}: {
  vendor: Ambulante;
  onClose: () => void;
  onRoute?: () => void;
}) {
  const code = giftCodeFor(vendor.id);
  return (
    <PortalShell
      cover={vendor.cover}
      mark="🛒"
      eyebrow="Patrocinador na areia"
      title={vendor.name}
      subtitle={vendor.hours}
      onClose={onClose}
      footer={
        <>
          <Pressable style={styles.routeBtn} onPress={onRoute}>
            <MapPinned color="#fff" size={16} />
            <Text style={styles.routeTitle}>Como chegar</Text>
          </Pressable>
          <Pressable
            style={styles.wa}
            onPress={() => {
              const text = encodeURIComponent(
                `Oi! Vi o ${vendor.name} no Praia Alerta Guará. Código ${code}.`,
              );
              void Linking.openURL(`https://wa.me/?text=${text}`);
            }}
          >
            <Text style={styles.waText}>{vendor.whatsapp || "Chamar no WhatsApp"}</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.pLight}>{vendor.about}</Text>
      <Text style={styles.walk}>{vendor.walks ? "Andando pela faixa de areia" : "Parado na areia"}</Text>
      <View style={styles.offerDark}>
        <Gift color="#fde68a" size={16} />
        <Text style={styles.offerTitle}>Presente da areia</Text>
        <Text style={styles.pLight}>Mencione o código e peça um mimo</Text>
        <Text style={styles.code}>{code}</Text>
      </View>
      <Text style={styles.section}>Cardápio</Text>
      {vendor.menu.map((item) => (
        <View key={item.name} style={styles.menuRow}>
          <Image source={mediaImage(item.photo)} style={styles.menuThumb} />
          <Text style={[styles.menuNameLight, { flex: 1 }]}>{item.name}</Text>
          <Text style={styles.menuPriceLight}>{item.price}</Text>
        </View>
      ))}
    </PortalShell>
  );
}

function EscunaPortal({ onClose, onRoute }: { onClose: () => void; onRoute?: () => void }) {
  return (
    <PortalShell
      cover="/guarapari/praia-enseada.jpg"
      mark="⛵"
      eyebrow="Patrocinador"
      title={ESCUNA_POINT.name}
      subtitle="Canal de Guarapari · passeios turísticos"
      onClose={onClose}
      footer={
        <Pressable style={styles.routeBtn} onPress={onRoute}>
          <MapPinned color="#fff" size={16} />
          <Text style={styles.routeTitle}>Como chegar</Text>
        </Pressable>
      }
    >
      {escunasPatrocinadoras.map((e) => (
        <View key={e.id} style={styles.escunaCard}>
          <Image source={mediaImage(e.photo)} style={styles.escunaPhoto} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.kicker}>{e.tag}</Text>
            <Text style={styles.offerTitle}>{e.name}</Text>
            <Text style={styles.pLight}>{e.roteiro}</Text>
            <Pressable
              style={styles.waSmall}
              onPress={() =>
                void Linking.openURL(
                  `https://wa.me/?text=${encodeURIComponent(`Oi! Quero saber do passeio ${e.name} pelo Praia Alerta Guará.`)}`,
                )
              }
            >
              <Text style={styles.waText}>{e.whatsapp}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </PortalShell>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <GuaraPose pose="clima" size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>Guará sussurra</Text>
        <Text style={styles.tipText}>{text}</Text>
      </View>
    </View>
  );
}

function PortalShell({
  cover,
  mark,
  eyebrow,
  title,
  subtitle,
  tag,
  stamped,
  onClose,
  children,
  footer,
}: {
  cover?: string;
  mark: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tag?: string;
  stamped?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />

          <View style={styles.coverBox}>
            <Image source={mediaImage(cover)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(18,12,8,0.25)", "transparent", "#120c08"]}
              style={StyleSheet.absoluteFill}
            />
            <Pressable style={styles.x} onPress={onClose} accessibilityLabel="Fechar">
              <X color="#fff" size={18} />
            </Pressable>
            <View style={styles.markBadge}>
              <Text style={styles.markText}>{mark}</Text>
            </View>
            {stamped ? (
              <View style={styles.selo}>
                <Text style={styles.seloText}>Selo do Guará</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.head}>
            <View style={styles.eyebrowRow}>
              <Star color="#fcd34d" fill="#fcd34d" size={11} />
              <Text style={styles.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            {tag ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            style={{ flexGrow: 0, maxHeight: 420 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#120c08",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    overflow: "hidden",
  },
  glowA: {
    position: "absolute",
    left: -40,
    top: 80,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.18)",
  },
  glowB: {
    position: "absolute",
    right: -30,
    top: 40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(249,115,22,0.12)",
  },
  coverBox: { height: 132 },
  x: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  markBadge: {
    position: "absolute",
    left: 16,
    bottom: -22,
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fde68a",
    backgroundColor: "#1c1208",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  markText: { color: "#fde68a", fontWeight: "800", fontSize: 16 },
  selo: {
    position: "absolute",
    left: 80,
    bottom: -12,
    backgroundColor: "rgba(252,211,77,0.2)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.4)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 4,
  },
  seloText: { color: "#fffbeb", fontSize: 10, fontWeight: "800" },
  head: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8, gap: 4 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  eyebrow: {
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  tag: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.3)",
    backgroundColor: "rgba(252,211,77,0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: "#fffbeb", fontSize: 11 },
  tabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.35)",
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabOn: { backgroundColor: "#fde68a" },
  tabText: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700" },
  tabTextOn: { color: "#3a2208" },
  section: {
    marginTop: 8,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  kicker: {
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  pLight: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 20 },
  offerDark: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.25)",
    backgroundColor: "rgba(252,211,77,0.08)",
    padding: 14,
    gap: 6,
    alignItems: "flex-start",
  },
  offerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  code: {
    marginTop: 4,
    color: "#fde68a",
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
  stampBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    borderRadius: 999,
    backgroundColor: "#fde68a",
    paddingVertical: 12,
    alignItems: "center",
  },
  stampText: { color: "#3a2208", fontWeight: "800" },
  moment: {
    width: 148,
    height: 118,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  momentImg: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  momentShade: { ...StyleSheet.absoluteFill },
  momentCap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  menuThumb: { width: 44, height: 44, borderRadius: 10 },
  menuNameLight: { color: "#fff", fontWeight: "700", fontSize: 13 },
  menuPriceLight: { color: "#fde68a", fontWeight: "700", fontSize: 13 },
  tip: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.25)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    marginTop: 6,
  },
  tipText: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
  walk: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(253,186,116,0.35)",
    color: "#fde68a",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  escunaCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.25)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 8,
  },
  escunaPhoto: { width: 84, height: 84, borderRadius: 12 },
  routeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  routeTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  routeSub: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  shareText: { color: "#fff", fontWeight: "700" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    padding: 14,
    gap: 8,
    backgroundColor: "rgba(18,12,8,0.95)",
  },
  wa: {
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  waSmall: {
    marginTop: 6,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  waText: { color: "#04210f", fontWeight: "800", fontSize: 13 },
});
