import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react-native";

import { getServices, type Service } from "@/src/api";
import { GhostButton, Loader, PrimaryButton, ScrimImage } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Services() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);

  const { data, isLoading, isError } = useQuery({ queryKey: ["services"], queryFn: getServices });
  const services: Service[] = data ?? [];
  const current = services[active];

  return (
    <View style={styles.container}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSub}>{"Deux métiers, une exigence : l'excellence."}</Text>
        {services.length > 0 && (
          <View style={styles.segment} testID="services-segment">
            {services.map((s, i) => (
              <Pressable
                key={s.id}
                testID={`segment-${s.id}`}
                onPress={() => setActive(i)}
                style={[styles.segmentItem, active === i && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active === i && styles.segmentTextActive]}>
                  {i === 0 ? "Production" : "Numérisation"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <Loader />
      ) : isError || !current ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Impossible de charger le catalogue.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <ScrimImage uri={current.image_url} height={280} radius={20} testID="service-hero">
            <Text style={styles.tagline}>{current.tagline}</Text>
            <Text style={styles.title}>{current.title}</Text>
          </ScrimImage>

          <Text style={styles.desc}>{current.description}</Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureHead}>Ce que nous offrons</Text>
            {current.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <View style={styles.checkDot}>
                  <Check color={colors.onBrandPrimary} size={13} strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              testID="service-quote-button"
              label="Demander un devis"
              onPress={() => router.push("/(tabs)/devis")}
            />
            <GhostButton
              testID="service-appointment-button"
              label="Prendre rendez-vous"
              onPress={() => router.push("/rendezvous")}
            />
          </View>
        </ScrollView>
      )}
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
    gap: 6,
  },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 34 },
  headerSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  segmentActive: { backgroundColor: colors.brandPrimary },
  segmentText: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13 },
  segmentTextActive: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  tagline: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1 },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38 },
  desc: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  featureCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  featureHead: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 20, marginBottom: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { color: colors.onSurfaceSecondary, fontFamily: fonts.regular, fontSize: 15, flex: 1 },
  actions: { gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  errorText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15 },
}));
