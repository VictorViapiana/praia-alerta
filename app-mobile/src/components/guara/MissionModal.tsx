import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { GuaraPose } from "./GuaraPose";

type Props = { visible: boolean; onClose: () => void };

export function MissionModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Fechar">
            <X color="#fff" size={20} />
          </Pressable>
          <Text style={styles.kicker}>Praia Alerta Guará</Text>
          <Text style={styles.title}>Nossa missão</Text>
          <GuaraPose pose="festa" size={120} />
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.hero}>
              Nossa missão não é apenas sobre o mar, a areia ou a praia. Nossa missão é sobre a{" "}
              <Text style={styles.vida}>VIDA</Text>!
            </Text>
            <Text style={styles.p}>
              É sobre o valor de cada pessoa, de cada criança, de cada família e de cada turista que chega à nossa querida Guarapari.
            </Text>
            <Text style={styles.p}>
              O Praia Alerta Guará nasceu com o propósito de prevenir acidentes, orientar visitantes, proteger nossas crianças, valorizar nossos trabalhadores e preservar as belezas naturais e culturais da nossa cidade.
            </Text>
            <Text style={styles.p}>
              Queremos que cada pessoa que chegue à Praia do Morro encontre não apenas um lugar bonito para descansar, mas também informação, orientação, acolhimento e segurança.
            </Text>
            <Text style={styles.p}>
              Nossa missão é aproximar pessoas, facilitar o acesso à informação e contribuir para uma praia mais humana, organizada e segura.
            </Text>
            <View style={styles.quote}>
              <Text style={styles.quoteText}>
                “Porque uma vida não tem preço — e cuidar da orla é cuidar de gente.”
              </Text>
            </View>
            <Text style={styles.p}>
              Isso não é apenas um aplicativo. É um compromisso com Guarapari e com quem ama a Praia do Morro.
            </Text>
          </ScrollView>
          <Pressable style={styles.ok} onPress={onClose}>
            <Text style={styles.okText}>Entendido</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(2,8,23,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "rgba(3,105,161,0.96)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    alignItems: "center",
    gap: 8,
    paddingBottom: 36,
  },
  close: { position: "absolute", right: 16, top: 16, padding: 8, zIndex: 2 },
  kicker: { color: "rgba(207,250,254,0.75)", fontWeight: "800", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" },
  title: { color: "#ecfeff", fontSize: 24, fontWeight: "800" },
  hero: { color: "#fff", fontSize: 20, lineHeight: 28, textAlign: "center", fontStyle: "italic", marginVertical: 8 },
  vida: { color: "#fde68a", fontWeight: "900", fontStyle: "italic" },
  p: { color: "rgba(255,255,255,0.85)", fontSize: 14.5, lineHeight: 22, marginBottom: 10, textAlign: "left" },
  quote: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.25)",
    marginBottom: 10,
  },
  quoteText: { color: "#fef3c7", fontStyle: "italic", textAlign: "center", lineHeight: 22 },
  ok: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  okText: { color: "#0369a1", fontWeight: "800" },
});
