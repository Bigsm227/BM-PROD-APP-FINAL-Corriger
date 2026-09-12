import { useCallback } from "react";
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { getPortfolio, type Project } from "@/src/api";
import { Loader, ScrimImage } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Portfolio() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const cardW = (width - 20 * 2 - 14) / 2;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });
  const projects: Project[] = data ?? [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <Text style={styles.headerSub}>Une sélection de nos réalisations.</Text>
      </View>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Échec du chargement de la galerie.</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Aucun projet publié pour le moment.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
          }
        >
          <View style={styles.grid}>
            {projects.map((p, i) => (
              <Pressable
                key={p.id}
                testID={`portfolio-item-${p.id}`}
                onPress={() => router.push(`/project/${p.id}`)}
                style={({ pressed }) => [{ width: cardW }, pressed && styles.pressed]}
              >
                <ScrimImage uri={p.image_url} height={i % 3 === 0 ? 240 : 190} radius={14}>
                  <Text style={styles.cat}>{p.category}</Text>
                  <Text style={styles.title}>{p.title}</Text>
                </ScrimImage>
              </Pressable>
            ))}
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
  scroll: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  cat: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1 },
  title: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 18 },
  pressed: { opacity: 0.85 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, textAlign: "center" },
}));
