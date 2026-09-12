import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { fonts, makeStyles, useTheme } from "@/src/theme";

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const handle = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };
  return (
    <Pressable
      testID={testID}
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onBrandPrimary} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.ghostBtn, pressed && styles.btnPressed, style]}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  testID,
  ...rest
}: { label: string; testID?: string } & TextInputProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const styles = useStyles();
  return (
    <View style={[styles.sectionTitleWrap, style]}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function Loader() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brandPrimary} size="large" />
    </View>
  );
}

// Full-bleed image with a bottom-up dark scrim to guarantee text contrast.
export function ScrimImage({
  uri,
  children,
  height,
  radius = 0,
  testID,
}: {
  uri: string;
  children?: ReactNode;
  height: number;
  radius?: number;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View testID={testID} style={[styles.scrimWrap, { height, borderRadius: radius }]}>
      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
      <LinearGradient
        colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.55)", "rgba(5,5,5,0.94)"]}
        locations={[0, 0.55, 1]}
        style={styles.scrim}
      />
      <View style={styles.scrimContent}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryBtnText: {
    color: colors.onBrandPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    minHeight: 52,
  },
  ghostBtnText: {
    color: colors.brandPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.5 },
  fieldWrap: { gap: 8 },
  fieldLabel: {
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionAccent: { width: 22, height: 2, backgroundColor: colors.brandPrimary },
  sectionTitle: {
    color: colors.onSurface,
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  scrimWrap: { width: "100%", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0 },
  scrimContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 20 },
}));
