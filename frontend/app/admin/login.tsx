import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Lock } from "lucide-react-native";

import { useAuth } from "@/src/auth";
import { Field, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function AdminLogin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { token, ready, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) router.replace("/admin");
  }, [ready, token, router]);

  const submit = async () => {
    if (!email.trim() || !password) {
      toast("Renseignez vos identifiants.", "error");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast("Connexion réussie", "success");
      router.replace("/admin");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable
        testID="close-login-button"
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 10 }]}
        hitSlop={12}
      >
        <X color={colors.onSurface} size={22} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Lock color={colors.brandPrimary} size={28} />
        </View>
        <Text style={styles.title}>Espace Admin</Text>
        <Text style={styles.sub}>Connectez-vous pour gérer demandes, rendez-vous et projets.</Text>

        <View style={styles.form}>
          <Field
            label="E-mail"
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@bigsmedia.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Mot de passe"
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <PrimaryButton
            testID="login-submit-button"
            label="Se connecter"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { flex: 1, justifyContent: "center", padding: 28, gap: 10 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 38 },
  sub: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  form: { gap: 16 },
}));
