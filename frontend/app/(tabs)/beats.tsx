import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Disc3, Send } from "lucide-react-native";

import { getBeats, type Beat } from "@/src/api";
import { openWhatsApp } from "@/src/contact";
import { Loader } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Beats() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError } = useQuery({ queryKey: ["beats"], queryFn: getBeats });
  const beats: Beat[] = data ?? [];

  const order = (title: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    openWhatsApp(`Bonjour Big S, je suis intéressé par l'instrumentale: ${title}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Instrumentales</Text>
        <Text style={styles.headerSub}>Commandez votre beat directement sur WhatsApp.</Text>
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
            <View key={b.id} style={styles.card} testID={`beat-${b.id}`}>
              <View style={styles.cover}>
                <Disc3 color={colors.onBrandPrimary} size={26} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {b.title}
                </Text>
                <Text style={styles.meta}>
                  {b.genre} · {b.tempo}
                </Text>
              </View>
              <Pressable
                testID={`order-beat-${b.id}`}
                onPress={() => order(b.title)}
                style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed]}
              >
                <Send color={colors.onBrandPrimary} size={14} />
                <Text style={styles.orderText}>Commander</Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.footNote}>
            Chaque commande ouvre WhatsApp avec un message pré-rempli vers le studio.
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
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  title: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 16 },
  meta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  orderText: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold, fontSize: 13 },
  pressed: { opacity: 0.85 },
  footNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", marginTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, textAlign: "center" },
}));
