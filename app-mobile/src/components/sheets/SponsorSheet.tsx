import { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gift, Share2, Star, X } from "lucide-react-native";
import type { Place, Ambulante } from "../../data/places";
import { ESCUNA_POINT, escunasPatrocinadoras } from "../../data/places";
import { GuaraPose } from "../guara/GuaraPose";
import type { SkyPhase } from "../../data/sky-phase";
import { giftCodeFor } from "../../data/ambulante-hub";
import { storageGet, storageSet } from "../../utils/storage";
import { pulseSoft } from "../../utils/haptics";

const STAMP_KEY = "pa-sponsor-stamps-v1";

type Props =
  | { kind: "place"; place: Place; skyPhase: SkyPhase; onClose: () => void; onRoute?: () => void }
  | { kind: "vendor"; vendor: Ambulante; onClose: () => void; onRoute?: () => void }
  | { kind: "escuna"; onClose: () => void; onRoute?: () => void };

export function SponsorSheet(props: Props) {
  const onClose = props.onClose;
  const onRoute = props.onRoute;

  if (props.kind === "place") {
    return <PlacePortal place={props.place} skyPhase={props.skyPhase} onClose={onClose} onRoute={onRoute} />;
  }

  if (props.kind === "vendor") {
    return <VendorPortal vendor={props.vendor} onClose={onClose} onRoute={onRoute} />;
  }

  return <EscunaPortal onClose={onClose} onRoute={onRoute} />;
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
  const [tab, setTab] = useState<"cardapio" | "agora" | "presente" | "ir">("cardapio");
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
    <SheetShell title={place.name} subtitle={place.hours} onClose={onClose} dark>
      <View style={styles.tabs}>
        {(
          [
            ["cardapio", "Cardápio"],
            ["agora", "Agora"],
            ["presente", "Presente"],
            ["ir", "Ir"],
          ] as const
        ).map(([id, label]) => (
          <Pressable key={id} style={[styles.tab, tab === id && styles.tabOn]} onPress={() => setTab(id)}>
            <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "cardapio" && (
        <>
          {place.guaraTip ? <Tip text={place.guaraTip} /> : null}
          {place.about ? <Text style={styles.pLight}>{place.about}</Text> : null}
          {place.menu?.map((item) => (
            <View key={item.name} style={styles.menuRow}>
              <Text style={styles.menuNameLight}>{item.name}</Text>
              <Text style={styles.menuPriceLight}>{item.price}</Text>
            </View>
          ))}
        </>
      )}

      {tab === "agora" && (
        <View style={styles.offerDark}>
          <Text style={styles.offerTitle}>{offer?.title ?? "Momento da orla"}</Text>
          <Text style={styles.pLight}>{offer?.detail ?? place.about}</Text>
          {offer?.code ? <Text style={styles.code}>Código {offer.code}</Text> : null}
        </View>
      )}

      {tab === "presente" && (
        <View style={styles.offerDark}>
          <Gift color="#fde68a" size={18} />
          <Text style={styles.offerTitle}>{place.gift?.title ?? "Carimbo do Guará"}</Text>
          <Text style={styles.pLight}>{place.gift?.detail ?? "Ganhe um mimo ao visitar pelo app."}</Text>
          {place.gift?.code ? <Text style={styles.code}>{place.gift.code}</Text> : null}
          <Pressable style={styles.stampBtn} onPress={() => void stamp()}>
            <Text style={styles.stampText}>{stamped ? "Carimbo guardado ✓" : "Carimbar visita"}</Text>
          </Pressable>
        </View>
      )}

      {tab === "ir" && (
        <View style={{ gap: 10 }}>
          <Actions phone={place.phone} onRoute={onRoute} onClose={onClose} dark />
          <Pressable
            style={styles.shareBtn}
            onPress={() =>
              void Share.share({
                message: `Vem comigo no ${place.name} — Praia Alerta Guará.`,
              })
            }
          >
            <Share2 color="#fff" size={16} />
            <Text style={styles.shareText}>Compartilhar</Text>
          </Pressable>
        </View>
      )}
    </SheetShell>
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
    <SheetShell title={vendor.name} subtitle="Patrocinador na areia" onClose={onClose} dark>
      <View style={styles.badgeRow}>
        <Star color="#fde68a" size={14} fill="#fde68a" />
        <Text style={styles.badgeText}>Na areia agora</Text>
      </View>
      <Text style={styles.pLight}>{vendor.about}</Text>
      <Text style={styles.metaLight}>{vendor.hours}</Text>
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
          <Text style={styles.menuNameLight}>{item.name}</Text>
          <Text style={styles.menuPriceLight}>{item.price}</Text>
        </View>
      ))}

      <Actions
        phone={vendor.whatsapp}
        onRoute={onRoute}
        onClose={onClose}
        whatsapp
        dark
        whatsappText={`Oi! Vi o ${vendor.name} no Praia Alerta Guará. Código ${code}.`}
      />
    </SheetShell>
  );
}

function EscunaPortal({ onClose, onRoute }: { onClose: () => void; onRoute?: () => void }) {
  return (
    <SheetShell title={ESCUNA_POINT.name} subtitle="Passeios na orla" onClose={onClose} dark>
      <Tip text="Embarque com segurança e combine horário com a escuna patrocinadora." />
      {escunasPatrocinadoras.map((e) => (
        <View key={e.id} style={styles.offerDark}>
          <Text style={styles.offerTitle}>{e.name}</Text>
          <Text style={styles.pLight}>{e.roteiro}</Text>
          <Pressable
            style={styles.wa}
            onPress={() =>
              void Linking.openURL(
                `https://wa.me/?text=${encodeURIComponent(`Oi! Quero saber do passeio ${e.name} pelo Praia Alerta Guará.`)}`,
              )
            }
          >
            <Text style={styles.waText}>{e.whatsapp}</Text>
          </Pressable>
        </View>
      ))}
      <Actions onRoute={onRoute} onClose={onClose} dark />
    </SheetShell>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <GuaraPose pose="clima" size={36} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function Actions({
  phone,
  whatsapp,
  whatsappText,
  onRoute,
  onClose,
  dark,
}: {
  phone?: string;
  whatsapp?: boolean;
  whatsappText?: string;
  onRoute?: () => void;
  onClose: () => void;
  dark?: boolean;
}) {
  return (
    <View style={styles.actions}>
      {onRoute ? (
        <Pressable style={styles.primary} onPress={onRoute}>
          <Text style={styles.primaryText}>Como chegar</Text>
        </Pressable>
      ) : null}
      {phone ? (
        <Pressable
          style={styles.wa}
          onPress={() => {
            const digits = phone.replace(/\D/g, "");
            const url =
              whatsapp || digits.length >= 10
                ? `https://wa.me/${digits}${whatsappText ? `?text=${encodeURIComponent(whatsappText)}` : ""}`
                : `tel:${phone}`;
            void Linking.openURL(url);
          }}
        >
          <Text style={styles.waText}>{whatsapp || phone.length > 10 ? "WhatsApp" : "Ligar"}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose}>
        <Text style={[styles.closeText, dark && { color: "rgba(255,255,255,0.55)" }]}>Fechar</Text>
      </Pressable>
    </View>
  );
}

function SheetShell({
  title,
  subtitle,
  onClose,
  children,
  dark,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, dark && styles.sheetDark]}>
          <Pressable style={styles.x} onPress={onClose}>
            <X color={dark ? "#fff" : "#0f172a"} size={20} />
          </Pressable>
          <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
          {subtitle ? <Text style={[styles.sub, dark && styles.subDark]}>{subtitle}</Text> : null}
          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 8,
  },
  sheetDark: { backgroundColor: "#120c08" },
  x: { position: "absolute", right: 14, top: 14, zIndex: 2, padding: 8 },
  title: { color: "#0f172a", fontSize: 22, fontWeight: "900", paddingRight: 36 },
  titleDark: { color: "#fff" },
  sub: { color: "#64748b", fontSize: 13 },
  subDark: { color: "rgba(255,255,255,0.55)" },
  pLight: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 20, marginTop: 6 },
  metaLight: { color: "#fdba74", fontWeight: "700", marginVertical: 6 },
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
  tip: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
  },
  tipText: { flex: 1, color: "#e0f2fe", fontSize: 13, lineHeight: 18 },
  offerDark: {
    marginTop: 10,
    backgroundColor: "rgba(251,191,36,0.1)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(253,186,116,0.3)",
    gap: 6,
  },
  offerTitle: { fontWeight: "800", color: "#fde68a", fontSize: 15 },
  code: { marginTop: 4, fontWeight: "900", color: "#fef3c7", letterSpacing: 1.5, fontSize: 16 },
  section: {
    marginTop: 14,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  menuNameLight: { color: "rgba(255,255,255,0.85)", flex: 1 },
  menuPriceLight: { color: "#fde68a", fontWeight: "700" },
  actions: { marginTop: 14, gap: 8, alignItems: "center" },
  primary: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  wa: {
    width: "100%",
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  waText: { color: "#04210f", fontWeight: "800" },
  closeText: { color: "#64748b", fontWeight: "600", marginTop: 4 },
  tabs: { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 4 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabOn: { backgroundColor: "#f97316" },
  tabText: { color: "rgba(255,255,255,0.55)", fontWeight: "800", fontSize: 11 },
  tabTextOn: { color: "#fff" },
  stampBtn: {
    marginTop: 8,
    backgroundColor: "#fde68a",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  stampText: { color: "#3a2a08", fontWeight: "900" },
  shareBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    paddingVertical: 11,
  },
  shareText: { color: "#fff", fontWeight: "700" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  badgeText: {
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
