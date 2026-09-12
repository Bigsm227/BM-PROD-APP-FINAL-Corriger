import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { Play, Pause, Disc3, ShoppingBag } from "lucide-react-native";

import { getBeats, mediaUrl, type Beat } from "@/src/api";
import { Loader } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Beats() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({ queryKey: ["beats"], queryFn: getBeats });
  const beats: Beat[] = data ?? [];

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {beats.map((b) => (
            <BeatCard key={b.id} beat={b} playingId={playingId} setPlayingId={setPlayingId} />
          ))}
          <Text style={styles.footNote}>
            {"La commande ouvre l'écran de paiement (MyNita / Amanata) puis confirme sur WhatsApp."}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function BeatCard({
  beat,
  playingId,
  setPlayingId,
}: {
  beat: Beat;
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const hasPreview = !!beat.preview_url;
  const player = useAudioPlayer(hasPreview ? { uri: mediaUrl(beat.preview_url!) } : null);
  const status = useAudioPlayerStatus(player);
  const isActive = playingId === beat.id;

  useEffect(() => {
    if (!isActive && status.playing) player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
      setPlayingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const toggle = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (status.playing) {
      player.pause();
      setPlayingId(null);
    } else {
      player.seekTo(0);
      player.play();
      setPlayingId(beat.id);
    }
  };

  const order = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({ pathname: "/paiement", params: { title: beat.title, price: beat.price ?? "" } });
  };

  return (
    <View style={styles.card} testID={`beat-${beat.id}`}>
      <View style={styles.cardTop}>
        <Pressable
          testID={`play-beat-${beat.id}`}
          onPress={hasPreview ? toggle : undefined}
          disabled={!hasPreview}
          style={({ pressed }) => [styles.cover, !hasPreview && styles.coverDisabled, pressed && styles.pressed]}
        >
          {hasPreview ? (
            status.playing ? (
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
            {beat.title}
          </Text>
          <Text style={styles.meta}>
            {beat.genre} · {beat.tempo}
          </Text>
          {beat.price ? <Text style={styles.price}>{beat.price}</Text> : null}
          {!hasPreview ? <Text style={styles.noPreview}>Extrait bientôt disponible</Text> : null}
        </View>
      </View>
      <Pressable
        testID={`order-beat-${beat.id}`}
        onPress={order}
        style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed]}
      >
        <ShoppingBag color={colors.onBrandPrimary} size={16} />
        <Text style={styles.orderText}>Commander {beat.price ? `· ${beat.price}` : ""}</Text>
      </Pressable>
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
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
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
  price: { color: colors.brandPrimary, fontFamily: fonts.semiBold, fontSize: 15, marginTop: 2 },
  noPreview: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, fontStyle: "italic" },
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
