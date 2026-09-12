import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { X, Wallet, Phone, CheckCircle2 } from "lucide-react-native";

import { openLink, openWhatsApp, STUDIO } from "@/src/contact";
import { PrimaryButton } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const METHODS = ["MyNita", "Amanata"];

export default function Paiement() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState("MyNita");

  const confirm = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    openWhatsApp(`Bonjour Big S, j'ai effectué un paiement via ${method} pour valider ma commande/session.`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.iconWrap}>
          <Wallet color={colors.brandPrimary} size={22} />
        </View>
        <Text style={styles.title}>Paiement & Transfert</Text>
        <Pressable testID="close-payment-button" onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <X color={colors.onSurface} size={22} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={styles.lead}>Réglez votre acompte ou vos prestations en toute simplicité.</Text>

        {/* Reception number */}
        <View style={styles.numberCard}>
          <Text style={styles.numberLabel}>Numéro de Réception Studio</Text>
          <Text style={styles.number}>{STUDIO.phoneDisplay}</Text>
          <Pressable
            testID="call-studio-button"
            onPress={() => openLink(`tel:${STUDIO.phoneTel}`)}
            style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
          >
            <Phone color={colors.brandPrimary} size={15} />
            <Text style={styles.callText}>Appeler le studio</Text>
          </Pressable>
        </View>

        <Text style={styles.info}>
          {"Envoyez votre paiement par MyNita ou Amanata au numéro ci-dessus, puis confirmez l'envoi du reçu sur WhatsApp."}
        </Text>

        {/* Method selection */}
        <Text style={styles.fieldLabel}>Méthode utilisée</Text>
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const active = method === m;
            return (
              <Pressable
                key={m}
                testID={`payment-method-${m}`}
                onPress={() => setMethod(m)}
                style={[styles.methodChip, active && styles.methodActive]}
              >
                {active ? <CheckCircle2 color={colors.onBrandPrimary} size={16} /> : null}
                <Text style={[styles.methodText, active && styles.methodTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          testID="confirm-payment-button"
          label="Confirmer le paiement sur WhatsApp"
          onPress={confirm}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
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
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 24, flex: 1 },
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
  lead: { color: colors.onSurfaceSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  numberCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.brandSecondary,
    padding: 22,
    gap: 8,
    alignItems: "center",
  },
  numberLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.5 },
  number: { color: colors.brandPrimary, fontFamily: fonts.displayBold, fontSize: 34, letterSpacing: 1 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  callText: { color: colors.brandPrimary, fontFamily: fonts.semiBold, fontSize: 13 },
  info: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  fieldLabel: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.3 },
  methods: { flexDirection: "row", gap: 12 },
  methodChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  methodActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  methodText: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 15 },
  methodTextActive: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold },
  pressed: { opacity: 0.85 },
}));
