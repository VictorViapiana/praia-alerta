import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import type { Place, Ambulante } from "../../data/places";
import { ESCUNA_POINT, escunasPatrocinadoras } from "../../data/places";
import { GuaraPose } from "../guara/GuaraPose";
import type { SkyPhase } from "../../data/sky-phase";

type Props =
  | { kind: "place"; place: Place; skyPhase: SkyPhase; onClose: () => void; onRoute?: () => void }
  | { kind: "vendor"; vendor: Ambulante; onClose: () => void; onRoute?: () => void }
  | { kind: "escuna"; onClose: () => void; onRoute?: () => void };

export function SponsorSheet(props: Props) {
  const onClose = props.onClose;
  const onRoute = props.onRoute;

  if (props.kind === "place") {
    const { place, skyPhase } = props;
    const offer = place.offers?.[skyPhase];
    return (
      <SheetShell title={place.name} subtitle={place.hours} onClose={onClose}>
        {place.guaraTip ? <Tip text={place.guaraTip} /> : null}
        {place.about ? <Text style={styles.p}>{place.about}</Text> : null}
        {offer ? (
          <View style={styles.offer}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.p}>{offer.detail}</Text>
            <Text style={styles.code}>Código {offer.code}</Text>
          </View>
        ) : null}
        {place.menu?.length ? (
          <View style={styles.block}>
            <Text style={styles.h}>Cardápio</Text>
            {place.menu.map((item) => (
              <View key={item.name} style={styles.menuRow}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuPrice}>{item.price}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Actions
          phone={place.phone}
          onRoute={onRoute}
          onClose={onClose}
        />
      </SheetShell>
    );
  }

  if (props.kind === "vendor") {
    const { vendor } = props;
    return (
      <SheetShell title={vendor.name} subtitle={vendor.tag} onClose={onClose}>
        <Text style={styles.p}>{vendor.about}</Text>
        <Text style={styles.meta}>{vendor.hours}</Text>
        {vendor.menu.map((item) => (
          <View key={item.name} style={styles.menuRow}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuPrice}>{item.price}</Text>
          </View>
        ))}
        <Actions phone={vendor.whatsapp} onRoute={onRoute} onClose={onClose} whatsapp />
      </SheetShell>
    );
  }

  return (
    <SheetShell title={ESCUNA_POINT.name} subtitle="Passeios na orla" onClose={onClose}>
      <Tip text="Embarque com segurança e combine horário com a escuna patrocinadora." />
      {escunasPatrocinadoras.map((e) => (
        <View key={e.id} style={styles.offer}>
          <Text style={styles.offerTitle}>{e.name}</Text>
          <Text style={styles.p}>{e.roteiro}</Text>
          <Text style={styles.link}>{e.whatsapp}</Text>
        </View>
      ))}
      <Actions onRoute={onRoute} onClose={onClose} />
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
  onRoute,
  onClose,
}: {
  phone?: string;
  whatsapp?: boolean;
  onRoute?: () => void;
  onClose: () => void;
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
          style={styles.secondary}
          onPress={() =>
            void Linking.openURL(whatsapp || phone.length > 10 ? `https://wa.me/${phone}` : `tel:${phone}`)
          }
        >
          <Text style={styles.secondaryText}>{whatsapp || phone.length > 10 ? "WhatsApp" : "Ligar"}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose}>
        <Text style={styles.closeText}>Fechar</Text>
      </Pressable>
    </View>
  );
}

function SheetShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.x} onPress={onClose}>
            <X color="#0f172a" size={20} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 8,
  },
  x: { position: "absolute", right: 14, top: 14, zIndex: 2, padding: 8 },
  title: { color: "#0f172a", fontSize: 22, fontWeight: "900", paddingRight: 36 },
  sub: { color: "#64748b", fontSize: 13 },
  p: { color: "#334155", fontSize: 14, lineHeight: 20, marginTop: 6 },
  meta: { color: "#0284c7", fontWeight: "700", marginVertical: 6 },
  tip: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
  },
  tipText: { flex: 1, color: "#0c4a6e", fontSize: 13, lineHeight: 18 },
  offer: {
    marginTop: 10,
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  offerTitle: { fontWeight: "800", color: "#9a3412", fontSize: 15 },
  code: { marginTop: 6, fontWeight: "800", color: "#c2410c" },
  block: { marginTop: 12, gap: 6 },
  h: { fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  menuRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  menuName: { color: "#334155", flex: 1 },
  menuPrice: { color: "#0f172a", fontWeight: "700" },
  actions: { marginTop: 14, gap: 8, alignItems: "center" },
  primary: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: {
    width: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#0f172a", fontWeight: "700" },
  closeText: { color: "#64748b", fontWeight: "600", marginTop: 4 },
  link: { color: "#0284c7", fontWeight: "700", marginTop: 6 },
});
