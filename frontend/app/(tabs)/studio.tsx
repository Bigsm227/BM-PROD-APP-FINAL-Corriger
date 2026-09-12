import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Check, MessageCircle } from "lucide-react-native";

import { openWhatsApp, SERVICES_OPTIONS, STUDIO } from "@/src/contact";
import { Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Studio() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [name, setName] = useState("");
  const [service, setService] = useState(SERVICES_OPTIONS[0]);

  const send = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Veuillez entrer votre nom ou celui de votre projet.", "error");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const message = `Bonjour Big S, je souhaite réserver une session.\nNom/Artiste: ${trimmed}\nPrestation: ${service}`;
    openWhatsApp(message);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Réservation</Text>
        <Text style={styles.headerSub}>Planifiez votre session à Big S Media Production.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Field
          label="Nom de l'artiste ou du projet"
          testID="studio-name-input"
          value={name}
          onChangeText={setName}
          placeholder="Votre nom / nom du projet"
        />

        <View style={{ gap: 10 }}>
          <Text style={styles.fieldLabel}>Choisissez le service</Text>
          {SERVICES_OPTIONS.map((opt) => {
            const active = service === opt;
            return (
              <Pressable
                key={opt}
                testID={`studio-service-${opt}`}
                onPress={() => setService(opt)}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <Check color={colors.onBrandPrimary} size={13} strokeWidth={3} /> : null}
                </View>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hintCard}>
          <MessageCircle color={colors.brandPrimary} size={16} />
          <Text style={styles.hintText}>
            Votre réservation sera envoyée sur WhatsApp au {STUDIO.phoneDisplay}.
          </Text>
        </View>

        <PrimaryButton
          testID="studio-send-button"
          label="Envoyer la réservation sur WhatsApp"
          onPress={send}
          style={{ marginTop: 4 }}
        />
        <GhostButton
          testID="studio-payment-button"
          label="Aller au paiement"
          onPress={() => router.push("/paiement")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 34 },
  headerSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  scroll: { padding: 20, gap: 20 },
  fieldLabel: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.3 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  optionActive: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceTertiary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  optionText: { color: colors.onSurfaceSecondary, fontFamily: fonts.regular, fontSize: 15, flex: 1 },
  optionTextActive: { color: colors.onSurface, fontFamily: fonts.semiBold },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.brandTertiary,
    borderRadius: 12,
    padding: 14,
  },
  hintText: { color: colors.onBrandTertiary, fontFamily: fonts.regular, fontSize: 13, flex: 1, lineHeight: 18 },
}));
