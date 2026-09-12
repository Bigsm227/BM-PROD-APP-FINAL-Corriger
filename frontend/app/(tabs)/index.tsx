import { useMemo } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Camera, Film, ArrowRight, Sparkles } from "lucide-react-native";

import { getServices, getPortfolio, type Service, type Project } from "@/src/api";
import { GhostButton, Loader, PrimaryButton, ScrimImage, SectionTitle } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMHNldCUyMGRpcmVjdG9yfGVufDB8fHx8MTc4OTE3ODc4Mnww&ixlib=rb-4.1.0&q=85";

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const heroHeight = useMemo(() => Math.min(width * 1.35, 620), [width]);

  const services = useQuery({ queryKey: ["services"], queryFn: getServices });
  const portfolio = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero */}
        <View style={{ height: heroHeight }}>
          <Image source={{ uri: HERO }} style={styles.heroImg} contentFit="cover" transition={400} />
          <LinearGradient
            colors={["rgba(5,5,5,0.45)", "rgba(5,5,5,0.15)", "rgba(5,5,5,0.98)"]}
            locations={[0, 0.4, 1]}
            style={styles.heroScrim}
          />

          {/* Top bar */}
          <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.brandRow}>
              <Sparkles color={colors.brandPrimary} size={18} />
              <Text style={styles.brandMark}>BIG S MEDIA</Text>
            </View>
            <Pressable
              testID="admin-access-button"
              onPress={() => router.push("/admin/login")}
              hitSlop={12}
              style={styles.keyBtn}
            >
              <KeyRound color={colors.onSurfaceTertiary} size={18} />
            </Pressable>
          </View>

          {/* Hero content */}
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>MAISON DE PRODUCTION</Text>
            <Text style={styles.heroTitle}>{"L'art de raconter\nvos histoires"}</Text>
            <Text style={styles.heroSub}>
              Production audiovisuelle cinématographique & numérisation de vos souvenirs.
            </Text>
            <View style={styles.heroBtns}>
              <PrimaryButton
                testID="hero-quote-button"
                label="Demander un devis"
                onPress={() => router.push("/(tabs)/devis")}
                style={{ flex: 1 }}
              />
              <GhostButton
                testID="hero-appointment-button"
                label="Rendez-vous"
                onPress={() => router.push("/rendezvous")}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <SectionTitle>Nos savoir-faire</SectionTitle>
          <View style={styles.serviceGrid}>
            {(services.data ?? []).map((s: Service) => (
              <Pressable
                key={s.id}
                testID={`home-service-${s.id}`}
                onPress={() => router.push("/(tabs)/services")}
                style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
              >
                <ScrimImage uri={s.image_url} height={170} radius={16}>
                  <View style={styles.serviceIconRow}>
                    {s.id === "production" ? (
                      <Film color={colors.brandPrimary} size={16} />
                    ) : (
                      <Camera color={colors.brandPrimary} size={16} />
                    )}
                    <Text style={styles.serviceTag}>{s.tagline}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                </ScrimImage>
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
            <View style={{ height: 220 }}>
              <Loader />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 20 }}
            >
              {(portfolio.data ?? []).map((p: Project) => (
                <Pressable
                  key={p.id}
                  testID={`home-project-${p.id}`}
                  onPress={() => router.push(`/project/${p.id}`)}
                  style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
                >
                  <ScrimImage uri={p.image_url} height={230} radius={16}>
                    <Text style={styles.projectCat}>{p.category}</Text>
                    <Text style={styles.projectTitle}>{p.title}</Text>
                  </ScrimImage>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Closing CTA */}
        <View style={styles.section}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Un projet en tête ?</Text>
            <Text style={styles.ctaSub}>
              Parlons-en. Recevez une proposition sur mesure sous 48 h.
            </Text>
            <PrimaryButton
              testID="cta-quote-button"
              label="Démarrer mon projet"
              onPress={() => router.push("/(tabs)/devis")}
            />
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
  brandMark: {
    color: colors.onSurface,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 3,
  },
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
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, gap: 8 },
  eyebrow: {
    color: colors.brandPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 4,
  },
  heroTitle: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 52,
    lineHeight: 54,
  },
  heroSub: {
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 12,
  },
  heroBtns: { flexDirection: "row", gap: 12 },
  section: { paddingHorizontal: 20, paddingTop: 32, gap: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 13 },
  serviceGrid: { gap: 14 },
  serviceCard: { borderRadius: 16, overflow: "hidden" },
  serviceIconRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  serviceTag: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 12 },
  serviceTitle: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 24 },
  projectCard: { width: 200, borderRadius: 16, overflow: "hidden" },
  projectCat: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1 },
  projectTitle: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 20 },
  pressed: { opacity: 0.85 },
  ctaCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 10,
  },
  ctaTitle: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 28 },
  ctaSub: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 14, marginBottom: 8, lineHeight: 20 },
}));
