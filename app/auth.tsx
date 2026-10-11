import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { colors, space } from "@/theme/tokens";

type Mode = "signin" | "signup" | "reset";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const sb = getSupabase();
    if (!sb) { setError("Cloud backup isn't configured in this build."); return; }
    setBusy(true); setError(null);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast("Signed in — restoring your places", "cloud-done-outline");
        router.back();
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.session) { toast("Account created", "checkmark-circle"); router.back(); }
        else toast("Check your email to confirm your account", "mail-outline");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        toast("Password reset email sent", "mail-outline");
        setMode("signin");
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.marble }}>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={{ alignSelf: "flex-start", marginBottom: space.xl }}><Ionicons name="close" size={24} color={colors.ink} /></Pressable>
        <Text v="title">{mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Welcome back"}</Text>
        <Text v="body" color={colors.inkMuted} style={{ marginTop: 8, marginBottom: space.xl }}>
          {mode === "reset" ? "We'll email you a link to choose a new password." : "Your places, notes and photos are backed up privately and restored on any phone you sign into."}
        </Text>
        {!supabaseConfigured && <Text v="small" color={colors.rosso} style={{ marginBottom: 12 }}>No Supabase keys found in this build; sign-in is disabled.</Text>}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@studenti.unimi.it" />
        {mode !== "reset" && <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "signup" ? "new-password" : "password"} placeholder="At least 8 characters" />}
        {error && <Text v="small" color={colors.rosso} style={{ marginBottom: 12 }}>{error}</Text>}
        <Button title={mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"} onPress={submit} loading={busy} disabled={!email.trim() || (mode !== "reset" && password.length < 8) || !supabaseConfigured} />
        <View style={styles.links}>
          {mode !== "signin" && <Pressable onPress={() => setMode("signin")}><Text v="smallMedium" color={colors.slate}>Sign in instead</Text></Pressable>}
          {mode === "signin" && <Pressable onPress={() => setMode("signup")}><Text v="smallMedium" color={colors.slate}>Create an account</Text></Pressable>}
          {mode === "signin" && <Pressable onPress={() => setMode("reset")}><Text v="smallMedium" color={colors.inkMuted}>Forgot password?</Text></Pressable>}
        </View>
        <Pressable onPress={() => router.back()} style={{ marginTop: space.xxl, alignSelf: "center" }} accessibilityRole="button">
          <Text v="small" color={colors.inkMuted}>Continue without an account (saved on this device only)</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({ links: { flexDirection: "row", justifyContent: "space-between", marginTop: space.lg } });
