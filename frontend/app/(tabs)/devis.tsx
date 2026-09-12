import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react-native";

import { createQuote } from "@/src/api";
import { Field, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const TYPES = [
  { key: "production", label: "Production" },
  { key: "numerisation", label: "Numérisation" },
  { key: "autre", label: "Autre" },
];

export default function Devis() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("production");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createQuote({ name, email, phone, service_type: serviceType, budget, message }),
    onSuccess: () => {
      setDone(true);
      toast("Demande envoyée avec succès !", "success");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const canSubmit = name.trim() && email.trim() && message.trim();

  const submit = () => {
    if (!canSubmit) {
      toast("Veuillez remplir les champs requis.", "error");
      return;
    }
    mutation.mutate();
  };

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBudget("");
    setMessage("");
    setServiceType("production");
    setDone(false);
  };

  if (done) {
    return (
      <View style={[styles.container, styles.successWrap, { paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <CheckCircle2 color={colors.brandPrimary} size={56} />
        </View>
        <Text style={styles.successTitle}>Merci !</Text>
        <Text style={styles.successSub}>
          Votre demande de devis a bien été reçue. Notre équipe vous répondra sous 48 h.
        </Text>
        <PrimaryButton testID="new-quote-button" label="Nouvelle demande" onPress={reset} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Devis & Contact</Text>
        <Text style={styles.headerSub}>{"Décrivez votre projet, on s'occupe du reste."}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Field
          label="Nom complet *"
          testID="quote-name-input"
          value={name}
          onChangeText={setName}
          placeholder="Votre nom"
        />
        <Field
          label="E-mail *"
          testID="quote-email-input"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Téléphone"
          testID="quote-phone-input"
          value={phone}
          onChangeText={setPhone}
          placeholder="Optionnel"
          keyboardType="phone-pad"
        />

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Type de service</Text>
          <View style={styles.chips}>
            {TYPES.map((t) => (
              <Pressable
                key={t.key}
                testID={`quote-type-${t.key}`}
                onPress={() => setServiceType(t.key)}
                style={[styles.chip, serviceType === t.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, serviceType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label="Budget estimé"
          testID="quote-budget-input"
          value={budget}
          onChangeText={setBudget}
          placeholder="Ex. 2 000 € — 5 000 €"
        />
        <Field
          label="Votre projet *"
          testID="quote-message-input"
          value={message}
          onChangeText={setMessage}
          placeholder="Décrivez votre besoin..."
          multiline
          numberOfLines={5}
          style={styles.textarea}
        />

        <PrimaryButton
          testID="quote-submit-button"
          label="Envoyer ma demande"
          onPress={submit}
          loading={mutation.isPending}
          disabled={!canSubmit}
          style={{ marginTop: 8 }}
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
  scroll: { padding: 20, gap: 18 },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.3 },
  chips: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13 },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold },
  textarea: { minHeight: 120, textAlignVertical: "top", paddingTop: 14 },
  successWrap: { alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  successIcon: { marginBottom: 4 },
  successTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 40 },
  successSub: {
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
}));
