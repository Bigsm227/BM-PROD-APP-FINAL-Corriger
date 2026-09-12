import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Play, Pause, Disc3, ShoppingBag } from "lucide-react-native";

import { getBeats, type Beat } from "@/src/api";
import { useAudio } from "@/src/audio";
import { Loader } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Beats() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { current, playing, toggle } = useAudio();

  const { data, isLoading, isError } = useQuery({ queryKey: ["beats"], queryFn: getBeats });
  const beats: Beat[] = data ?? [];

  const order = (beat: Beat) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: "/paiement",
      params: {
        title: beat.title,
        price_mp3: beat.price_mp3 ?? beat.price ?? "",
        price_wav: beat.price_wav ?? "",
      },
    });
  };

  const onPlay = (beat: Beat) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(beat);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Instrumentales</Text>
        <Text style={styles.headerSub}>Écoutez un extrait, puis commandez votre beat.</Text>
      </View>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Impossible de charger le catalogue.</Text>
        </View>
      ) : beats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Aucune instrumentale disponible pour le moment.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        >
          {beats.map((b) => {
            const hasPreview = !!b.preview_url;
            const isActive = current?.id === b.id;
            const isPlaying = isActive && playing;
            const mp3 = b.price_mp3 ?? b.price ?? "";
            const wav = b.price_wav ?? "";
            return (
              <View key={b.id} style={styles.card} testID={`beat-${b.id}`}>
                <View style={styles.cardTop}>
                  <Pressable
                    testID={`play-beat-${b.id}`}
                    onPress={hasPreview ? () => onPlay(b) : undefined}
                    disabled={!hasPreview}
                    style={({ pressed }) => [styles.cover, !hasPreview && styles.coverDisabled, pressed && styles.pressed]}
                  >
                    {hasPreview ? (
                      isPlaying ? (
                        <Pause color={colors.onBrandPrimary} size={24} />
                      ) : (
                        <Play color={colors.onBrandPrimary} size={24} />
                      )
                    ) : (
                      <Disc3 color={colors.onBrandPrimary} size={24} />
                    )}
                  </Pressable>
                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text style={styles.meta}>
                      {b.genre} · {b.tempo}
                    </Text>
                    <View style={styles.priceRow}>
                      {mp3 ? <Text style={styles.priceTag}>MP3 {mp3}</Text> : null}
                      {wav ? <Text style={styles.priceTag}>WAV {wav}</Text> : null}
                    </View>
                    {!hasPreview ? <Text style={styles.noPreview}>Extrait bientôt disponible</Text> : null}
                  </View>
                </View>
                <Pressable
                  testID={`order-beat-${b.id}`}
                  onPress={() => order(b)}
                  style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed]}
                >
                  <ShoppingBag color={colors.onBrandPrimary} size={16} />
                  <Text style={styles.orderText}>Commander</Text>
                </Pressable>
              </View>
            );
          })}
          <Text style={styles.footNote}>
            {"Choisissez la licence (MP3 ou WAV) à l'étape de paiement, puis confirmez sur WhatsApp."}
          </Text>
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
  scroll: { padding: 20, gap: 14 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  coverDisabled: { backgroundColor: colors.brandSecondary },
  info: { flex: 1, gap: 3 },
  title: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 17 },
  meta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  priceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 3 },
  priceTag: {
    color: colors.brandPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  noPreview: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, fontStyle: "italic", marginTop: 2 },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  orderText: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold, fontSize: 14 },
  pressed: { opacity: 0.85 },
  footNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", marginTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, textAlign: "center" },
}));
