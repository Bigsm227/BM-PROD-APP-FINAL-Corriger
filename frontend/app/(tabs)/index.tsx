import { useMemo } from "react";
import { Dimensions, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  KeyRound,
  Sparkles,
  CalendarClock,
  Music4,
  Wallet,
  Phone,
  Mail,
  ChevronRight,
  ArrowRight,
} from "lucide-react-native";

import { getPortfolio, mediaUrl, type Project } from "@/src/api";
import { openLink, SOCIALS, STUDIO } from "@/src/contact";
import { Loader, ScrimImage, SectionTitle } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMHNldCUyMGRpcmVjdG9yfGVufDB8fHx8MTc4OTE3ODc4Mnww&ixlib=rb-4.1.0&q=85";

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const heroHeight = useMemo(() => Math.min(width * 1.3, 600), [width]);

  const portfolio = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });

  const tap = (fn: () => void) => () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const actions = [
    {
      key: "reserver",
      icon: CalendarClock,
      title: "Réserver une session",
      sub: "Studio audio & vidéo",
      onPress: () => router.push("/(tabs)/studio"),
    },
    {
      key: "beats",
      icon: Music4,
      title: "Catalogue d'instrumentales",
      sub: "Écoutez & commandez vos beats",
      onPress: () => router.push("/(tabs)/beats"),
    },
    {
      key: "paiement",
      icon: Wallet,
      title: "Paiement MyNita / Amanata",
      sub: "Réglez acompte & prestations",
      onPress: () => router.push("/paiement"),
    },
  ];

  const contacts = [
    { key: "phone", icon: Phone, label: "Téléphone", value: STUDIO.phoneDisplay, onPress: () => openLink(`tel:${STUDIO.phoneTel}`) },
    { key: "email", icon: Mail, label: "E-mail", value: STUDIO.email, onPress: () => openLink(`mailto:${STUDIO.email}`) },
    ...SOCIALS.map((s) => ({ key: s.key, icon: Sparkles, label: s.label, value: s.value, onPress: () => openLink(s.url) })),
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ height: heroHeight }}>
          <Image source={{ uri: HERO }} style={styles.heroImg} contentFit="cover" transition={400} />
          <LinearGradient
            colors={["rgba(5,5,5,0.5)", "rgba(5,5,5,0.15)", "rgba(5,5,5,0.98)"]}
            locations={[0, 0.4, 1]}
            style={styles.heroScrim}
          />
          <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.brandRow}>
              <Sparkles color={colors.brandPrimary} size={18} />
              <Text style={styles.brandMark}>BIG S MEDIA</Text>
            </View>
            <Pressable testID="admin-access-button" onPress={() => router.push("/admin/login")} hitSlop={12} style={styles.keyBtn}>
              <KeyRound color={colors.onSurfaceTertiary} size={18} />
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>NIAMEY · NIGER</Text>
            <Text style={styles.heroTitle}>{"BIG S MEDIA\nPRODUCTION"}</Text>
            <Text style={styles.heroSub}>{STUDIO.tagline}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <SectionTitle>Que souhaitez-vous ?</SectionTitle>
          <View style={{ gap: 12 }}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                testID={`home-action-${a.key}`}
                onPress={tap(a.onPress)}
                style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              >
                <View style={styles.actionIcon}>
                  <a.icon color={colors.brandPrimary} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{a.title}</Text>
                  <Text style={styles.actionSub}>{a.sub}</Text>
                </View>
                <ChevronRight color={colors.muted} size={20} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Portfolio preview */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <SectionTitle>Réalisations</SectionTitle>
            <Pressable testID="home-see-all-portfolio" onPress={() => router.push("/(tabs)/portfolio")}>
              <View style={styles.seeAll}>
                <Text style={styles.seeAllText}>Tout voir</Text>
                <ArrowRight color={colors.brandPrimary} size={14} />
              </View>
            </Pressable>
          </View>
          {portfolio.isLoading ? (
            <View style={{ height: 200 }}>
              <Loader />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
              {(portfolio.data ?? []).map((p: Project) => (
                <Pressable
                  key={p.id}
                  testID={`home-project-${p.id}`}
                  onPress={() => router.push(`/project/${p.id}`)}
                  style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
                >
                  <ScrimImage uri={mediaUrl(p.image_url)} height={220} radius={16}>
                    <Text style={styles.projectCat}>{p.category}</Text>
                    <Text style={styles.projectTitle}>{p.title}</Text>
                  </ScrimImage>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Contacts */}
        <View style={styles.section}>
          <SectionTitle>Nous contacter</SectionTitle>
          <View style={styles.contactList}>
            {contacts.map((c) => (
              <Pressable
                key={c.key}
                testID={`home-contact-${c.key}`}
                onPress={tap(c.onPress)}
                style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
              >
                <View style={styles.contactIcon}>
                  <c.icon color={colors.brandPrimary} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                  <Text style={styles.contactValue}>{c.value}</Text>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  heroImg: { width: "100%", height: "100%" },
  heroScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 14, letterSpacing: 3 },
  keyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,17,17,0.6)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, gap: 6 },
  eyebrow: { color: colors.brandPrimary, fontFamily: fonts.semiBold, fontSize: 12, letterSpacing: 4 },
  heroTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 46, lineHeight: 48 },
  heroSub: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 32, gap: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 13 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 16 },
  actionSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  projectCard: { width: 200, borderRadius: 16, overflow: "hidden" },
  projectCat: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1 },
  projectTitle: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 20 },
  contactList: { gap: 10 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  contactValue: { color: colors.onSurface, fontFamily: fonts.regular, fontSize: 15, marginTop: 2 },
  pressed: { opacity: 0.85 },
}));
