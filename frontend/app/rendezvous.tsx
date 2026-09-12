import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { X, CheckCircle2 } from "lucide-react-native";

import { createAppointment } from "@/src/api";
import { Field, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const TYPES = [
  { key: "production", label: "Production" },
  { key: "numerisation", label: "Numérisation" },
];

const SLOTS = ["09:00", "11:00", "14:00", "16:00", "18:00"];

export default function Rendezvous() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("production");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createAppointment({ name, email, phone, service_type: serviceType, date, time, notes }),
    onSuccess: () => {
      setDone(true);
      toast("Rendez-vous demandé !", "success");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const canSubmit = name.trim() && email.trim() && date.trim() && time.trim();

  const submit = () => {
    if (!canSubmit) {
      toast("Veuillez remplir nom, e-mail, date et heure.", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Rendez-vous</Text>
          <Text style={styles.headerSub}>Réservez un créneau avec notre équipe.</Text>
        </View>
        <Pressable testID="close-appointment-button" onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <X color={colors.onSurface} size={22} />
        </Pressable>
      </View>

      {done ? (
        <View style={styles.successWrap}>
          <CheckCircle2 color={colors.brandPrimary} size={56} />
          <Text style={styles.successTitle}>{"C'est noté !"}</Text>
          <Text style={styles.successSub}>
            Votre demande de rendez-vous a été envoyée. Nous confirmerons le créneau par e-mail.
          </Text>
          <PrimaryButton testID="appointment-close-button" label="Fermer" onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        >
          <Field label="Nom complet *" testID="appt-name-input" value={name} onChangeText={setName} placeholder="Votre nom" />
          <Field
            label="E-mail *"
            testID="appt-email-input"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Téléphone"
            testID="appt-phone-input"
            value={phone}
            onChangeText={setPhone}
            placeholder="Optionnel"
            keyboardType="phone-pad"
          />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Service</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  testID={`appt-type-${t.key}`}
                  onPress={() => setServiceType(t.key)}
                  style={[styles.chip, serviceType === t.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, serviceType === t.key && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label="Date souhaitée *"
            testID="appt-date-input"
            value={date}
            onChangeText={setDate}
            placeholder="JJ / MM / AAAA"
          />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Créneau horaire *</Text>
            <View style={styles.slots}>
              {SLOTS.map((s) => (
                <Pressable
                  key={s}
                  testID={`appt-slot-${s}`}
                  onPress={() => setTime(s)}
                  style={[styles.slot, time === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, time === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label="Notes"
            testID="appt-notes-input"
            value={notes}
            onChangeText={setNotes}
            placeholder="Précisions sur votre projet..."
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />

          <PrimaryButton
            testID="appt-submit-button"
            label="Confirmer le rendez-vous"
            onPress={submit}
            loading={mutation.isPending}
            disabled={!canSubmit}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      )}
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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30 },
  headerSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  textarea: { minHeight: 100, textAlignVertical: "top", paddingTop: 14 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  successTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 38 },
  successSub: {
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
}));
