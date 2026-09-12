import { Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Pause, X, Disc3 } from "lucide-react-native";

import { useAudio } from "@/src/audio";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export function MiniPlayer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { current, playing, toggle, stop } = useAudio();

  if (!current) return null;

  const tabBar = (Platform.OS === "web" ? 64 : 49) + insets.bottom;

  return (
    <View style={[styles.wrap, { bottom: tabBar + 8 }]} testID="mini-player">
      <Pressable style={styles.left} onPress={() => router.push("/(tabs)/beats")}>
        <View style={styles.cover}>
          <Disc3 color={colors.onBrandPrimary} size={20} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {current.genre} · {current.tempo}
          </Text>
        </View>
      </Pressable>
      <Pressable testID="mini-player-toggle" onPress={() => toggle(current)} hitSlop={8} style={styles.iconBtn}>
        {playing ? <Pause color={colors.onSurface} size={20} /> : <Play color={colors.onSurface} size={20} />}
      </Pressable>
      <Pressable testID="mini-player-close" onPress={stop} hitSlop={8} style={styles.iconBtn}>
        <X color={colors.muted} size={18} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 14 },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
}));
