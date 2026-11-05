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
import { hourInSaoPaulo } from "../../data/sky-phase";
import { giftCodeFor } from "../../data/ambulante-hub";
import { storageGet, storageSet } from "../../utils/storage";
import { pulseSoft } from "../../utils/haptics";
import { speakGuara } from "../../utils/speech";
import { mediaImage } from "../../assets/media";
import { ShineSweep } from "../ui/ShineSweep";

const STAMP_KEY = "pa-sponsor-stamps-v1";
const HOLD_MS = 15 * 60 * 1000;

const PERK_LABEL: Record<string, string> = {
  shower: "Chuveiro",
  wifi: "Wi-Fi",
  access: "Acesso fácil",
  music: "Música",
};

const PHASE_LABEL: Record<SkyPhase, string> = {
  dawn: "Nascer do sol",
  day: "Dia na orla",
  dusk: "Pôr do sol",
  night: "Noite na orla",
};

const PHASE_END: Record<SkyPhase, number> = {
  dawn: 7.5,
  day: 16.5,
  dusk: 19,
  night: 29,
};

function housePulse(hour: number): { level: number; label: string; hint: string } {
  if (hour < 9) return { level: 0.18, label: "Ainda acordando", hint: "Mesa fácil, café e brisa." };
  if (hour < 12) return { level: 0.42, label: "Movimento leve", hint: "Bom pra chegar sem fila." };
  if (hour < 15) return { level: 0.72, label: "Casa quente", hint: "Almoço no auge — reserve." };
  if (hour < 18) return { level: 0.88, label: "Pico da orla", hint: "Muita gente na areia agora." };
  if (hour < 21) return { level: 0.78, label: "Fim de tarde cheio", hint: "Som, mesa e pôr do sol." };
  return { level: 0.48, label: "Noite calma", hint: "Clima mais intimista." };
}

function msUntilPhaseEnd(phase: SkyPhase, hour: number) {
  let end = PHASE_END[phase];
  if (phase === "night" && hour < 5) end = 5;
  return Math.max(0, end - hour) * 60 * 60 * 1000;
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function activeOffer(place: Place, phase: SkyPhase) {
  return place.offers?.[phase] ?? place.offers?.day ?? null;
}

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
  const [stampCount, setStampCount] = useState(0);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const hour = hourInSaoPaulo(new Date(now));
  const offer = activeOffer(place, skyPhase);
  const offerRemain = msUntilPhaseEnd(skyPhase, hour);
  const pulse = housePulse(hour);
  const holdLeft = holdUntil ? Math.max(0, holdUntil - now) : 0;

  useEffect(() => {
    void storageGet(STAMP_KEY).then((raw) => {
      try {
        const ids = raw ? (JSON.parse(raw) as string[]) : [];
        setStamped(ids.includes(place.id));
        setStampCount(ids.length);
      } catch {
        setStamped(false);
      }
    });
  }, [place.id]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
    setStampCount(ids.length);
    setGiftOpen(true);
    void pulseSoft();
  };

  const holdTable = () => {
    setHoldUntil(Date.now() + HOLD_MS);
    setTab("ir");
    const digits = (place.phone ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Olá! Vim pelo Praia Alerta Guará e quero segurar uma mesa em ${place.name} pelos próximos 15 minutos. Nome na reserva: (seu nome).`,
    );
    void Linking.openURL(digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`);
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
          {place.perks?.length ? (
            <View style={styles.perkRow}>
              {place.perks.map((perk) => (
                <View key={perk} style={styles.perkChip}>
                  <Text style={styles.perkText}>{PERK_LABEL[perk] ?? perk}</Text>
                </View>
              ))}
            </View>
          ) : null}
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
              <Text style={styles.section}>Top 3 do cardápio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {place.menu.map((item) => (
                  <View key={item.name} style={styles.menuCard}>
                    <Image source={mediaImage(item.photo)} style={styles.menuCardImg} />
                    <Text style={styles.menuCardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.menuPriceLight}>{item.price}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
          {place.guaraTip ? <Tip text={place.guaraTip} /> : null}
        </>
      )}

      {tab === "agora" && (
        <View style={{ gap: 12 }}>
          <View style={styles.offerDark}>
            <View style={styles.pulseHead}>
              <Text style={styles.kicker}>Pulso da casa</Text>
              <View style={styles.phasePill}>
                <Text style={styles.phasePillText}>{PHASE_LABEL[skyPhase]}</Text>
              </View>
            </View>
            <Text style={styles.offerTitle}>{pulse.label}</Text>
            <Text style={styles.pLight}>{pulse.hint}</Text>
            <View style={styles.pulseTrack}>
              <LinearGradient
                colors={["#fde68a", "#fb7185"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.pulseFill, { width: `${Math.round(pulse.level * 100)}%` }]}
              />
            </View>
            <Text style={styles.liveNote}>Ao vivo · horário de Guarapari</Text>
          </View>
          {place.guaraTip ? <Tip text={place.guaraTip} /> : null}
          {offer ? (
            <View style={[styles.offerDark, styles.offerShineHost]}>
              <ShineSweep
                bandWidth={110}
                travel={320}
                durationMs={2800}
                delayMs={1200}
                colors={["transparent", "rgba(253,230,138,0.28)", "transparent"]}
              />
              <View style={styles.pulseHead}>
                <Text style={styles.kicker}>Oferta da maré</Text>
                <Text style={styles.code}>{formatRemain(offerRemain)}</Text>
              </View>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.pLight}>{offer.detail}</Text>
              {offer.code ? (
                <Pressable
                  style={styles.offerCta}
                  onPress={() => {
                    const digits = (place.phone ?? "").replace(/\D/g, "");
                    const text = encodeURIComponent(
                      `Oi! Cheguei pelo Praia Alerta Guará em ${place.name}. Quero usar o código ${offer.code}.`,
                    );
                    void Linking.openURL(
                      digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`,
                    );
                  }}
                >
                  <LinearGradient colors={["#fde68a", "#fdba74"]} style={styles.offerCtaGrad}>
                    <ShineSweep />
                    <Text style={styles.offerCtaText}>Usar código {offer.code}</Text>
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
          ) : null}
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
          <View style={styles.pulseTrack}>
            <View style={[styles.pulseFillSolid, { width: `${Math.min(100, Math.round((stampCount / 3) * 100))}%` }]} />
          </View>
          <Text style={styles.liveNote}>
            {stampCount}/3 selos · colecione nas casas
          </Text>
          {giftOpen && place.gift ? (
            <View style={styles.giftReveal}>
              <Text style={styles.offerTitle}>{place.gift.title}</Text>
              <Text style={styles.pLight}>{place.gift.detail}</Text>
              {place.gift.code ? <Text style={styles.code}>{place.gift.code}</Text> : null}
              <Pressable
                style={styles.stampBtn}
                onPress={() => {
                  const digits = (place.phone ?? "").replace(/\D/g, "");
                  const text = encodeURIComponent(
                    `Oi! Carimbei ${place.name} no Praia Alerta Guará.${place.gift?.code ? ` Código: ${place.gift.code}` : ""}`,
                  );
                  void Linking.openURL(
                    digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`,
                  );
                }}
              >
                <Text style={styles.stampBtnText}>Enviar no WhatsApp</Text>
              </Pressable>
            </View>
          ) : null}
          {place.gift?.code && !giftOpen ? <Text style={styles.code}>{place.gift.code}</Text> : null}
          <Pressable style={styles.stampBtn} onPress={() => void stamp()}>
            <Text style={styles.stampText}>{stamped ? "Selo guardado ✓" : "Carimbar selo agora"}</Text>
          </Pressable>
        </View>
      )}

      {tab === "ir" && (
        <View style={{ gap: 10 }}>
          <Pressable style={styles.offerDark} onPress={holdTable}>
            <Text style={styles.kicker}>Mesa mágica</Text>
            <Text style={styles.offerTitle}>
              {holdLeft > 0
                ? `Mesa segura · ${Math.ceil(holdLeft / 60000)} min`
                : "Segurar mesa 15 min"}
            </Text>
            <Text style={styles.pLight}>
              Reservamos mentalmente sua mesa e abrimos o WhatsApp com a mensagem pronta.
            </Text>
            <View style={styles.stampBtn}>
              <Text style={styles.stampText}>
                {holdLeft > 0 ? "Abrir WhatsApp de novo" : "Segurar mesa agora"}
              </Text>
            </View>
          </Pressable>
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
        <Pressable style={styles.tipListen} onPress={() => void speakGuara(text)}>
          <Text style={styles.tipListenText}>Ouvir</Text>
        </Pressable>
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
  offerShineHost: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#1c1208",
    borderColor: "rgba(253,230,138,0.35)",
  },
  offerCta: { marginTop: 8, alignSelf: "stretch", borderRadius: 12, overflow: "hidden" },
  offerCtaGrad: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  offerCtaText: { color: "#3a2208", fontSize: 13, fontWeight: "700", zIndex: 1 },
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
  stampBtnText: { color: "#3a2208", fontWeight: "800", fontSize: 13 },
  giftReveal: {
    alignSelf: "stretch",
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.35)",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 12,
    gap: 6,
  },
  tipListen: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tipListenText: { color: "#fde68a", fontSize: 11, fontWeight: "700" },
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
  menuCard: {
    width: 132,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingBottom: 8,
  },
  menuCardImg: { width: "100%", height: 88 },
  menuCardName: { color: "#fff", fontWeight: "700", fontSize: 12, marginTop: 6, paddingHorizontal: 8 },
  perkRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  perkChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.3)",
    backgroundColor: "rgba(252,211,77,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  perkText: { color: "#fffbeb", fontSize: 11, fontWeight: "700" },
  pulseHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  phasePill: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  phasePillText: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700" },
  pulseTrack: {
    marginTop: 6,
    alignSelf: "stretch",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  pulseFill: { height: "100%", borderRadius: 999 },
  pulseFillSolid: { height: "100%", borderRadius: 999, backgroundColor: "#fde68a" },
  liveNote: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
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
