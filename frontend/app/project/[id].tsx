import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { X, Calendar } from "lucide-react-native";

import { getProject } from "@/src/api";
import { Loader } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ProjectDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  return (
    <View style={styles.container}>
      <Pressable
        testID="close-project-button"
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 10 }]}
        hitSlop={12}
      >
        <X color={colors.onSurface} size={22} />
      </Pressable>

      {isLoading ? (
        <Loader />
      ) : isError || !project ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Projet introuvable.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={styles.hero}>
            <Image source={{ uri: project.image_url }} style={styles.heroImg} contentFit="cover" transition={300} />
            <LinearGradient
              colors={["rgba(5,5,5,0.2)", "rgba(5,5,5,0)", "rgba(5,5,5,0.95)"]}
              locations={[0, 0.5, 1]}
              style={styles.heroScrim}
            />
            <View style={styles.heroContent}>
              <Text style={styles.cat}>{project.category}</Text>
              <Text style={styles.title}>{project.title}</Text>
            </View>
          </View>

          <View style={styles.body}>
            {project.year ? (
              <View style={styles.metaRow}>
                <Calendar color={colors.brandPrimary} size={15} />
                <Text style={styles.metaText}>{project.year}</Text>
              </View>
            ) : null}
            <Text style={styles.desc}>{project.description}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,17,17,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: { height: 420 },
  heroImg: { width: "100%", height: "100%" },
  heroScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, gap: 4 },
  cat: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2 },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 44 },
  body: { padding: 24, gap: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 14 },
  desc: { color: colors.onSurfaceSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 26 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15 },
}));
