// Design tokens for Big S Media Production — dark, cinematic "6 Glass / Luxe DARK".
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#050505",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#111111",
  onSurfaceSecondary: "#F5F5F5",
  surfaceTertiary: "#1A1A1A",
  onSurfaceTertiary: "#CCCCCC",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#050505",
  muted: "#888888",

  // Brand — cinematic gold
  brand: "#C9A84C",
  onBrand: "#050505",
  brandPrimary: "#C9A84C",
  onBrandPrimary: "#050505",
  brandSecondary: "#8C7535",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#26200E",
  onBrandTertiary: "#C9A84C",

  // Status
  success: "#2E4D3A",
  onSuccess: "#9AE6B4",
  warning: "#5C4018",
  onWarning: "#FBD38D",
  error: "#5C1B1B",
  onError: "#FEB2B2",
  info: "#1A365D",
  onInfo: "#90CDF4",

  // Lines
  border: "#222222",
  borderStrong: "#333333",
  divider: "#1A1A1A",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

// Typography families (loaded in app/_layout.tsx via expo-font)
export const fonts = {
  displayRegular: "CormorantGaramond-Regular",
  displaySemiBold: "CormorantGaramond-SemiBold",
  displayBold: "CormorantGaramond-Bold",
  regular: "Geist-Regular",
  medium: "Geist-Medium",
  semiBold: "Geist-SemiBold",
  bold: "Geist-Bold",
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

// This app ships a single dark scheme; force it so native chrome matches.
setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
