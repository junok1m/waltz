import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "../services/auth";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [busy, setBusy] = useState(false);

  async function submitGoogleAuth() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Google sign-in failed", message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEmailAuth() {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Almost there", "Enter an email and a password with at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "sign-up") {
        await signUpWithEmail(email.trim(), password);
        Alert.alert(
          "Check your inbox",
          "If email confirmation is enabled, confirm your email and then sign in."
        );
        setMode("sign-in");
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Couldn’t sign in", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.logo}>waltz</Text>
        <Text style={styles.title}>Walk more. Sniff everything.</Text>
        <Text style={styles.subtitle}>Track the walks, streaks, badges and tiny neighborhood victories.</Text>
      </View>

      <View style={styles.card}>
        <Pressable style={[styles.socialButton, styles.appleButton]} disabled={busy}>
          <Text style={styles.appleText}>  Continue with Apple</Text>
        </Pressable>

        <Pressable
          style={[styles.socialButton, styles.googleButton, busy && styles.buttonDisabled]}
          onPress={submitGoogleAuth}
          disabled={busy}
        >
          <Text style={styles.googleText}>{busy ? "Opening Google…" : "G  Continue with Google"}</Text>
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#9A9086"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#9A9086"
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.emailButton} onPress={submitEmailAuth} disabled={busy}>
          <Text style={styles.emailButtonText}>
            {busy ? "HOLD ON…" : mode === "sign-up" ? "CREATE ACCOUNT" : "LOG IN"}
          </Text>
        </Pressable>

        <Pressable onPress={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")} disabled={busy}>
          <Text style={styles.switchText}>
            {mode === "sign-up" ? "Already have an account? Log in" : "New here? Create an account"}
          </Text>
        </Pressable>

        <Text style={styles.note}>Google is live. Apple is next in line for its paperwork.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between", paddingBottom: 26 },
  hero: { paddingTop: 24 },
  logo: {
    fontFamily: "Schoolbell_400Regular",
    fontSize: 70,
    lineHeight: 76,
    color: "#1D1A17",
  },
  title: { marginTop: 8, fontSize: 28, fontWeight: "800", color: "#1D1A17", maxWidth: 320 },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 23, color: "#6D645B", maxWidth: 340 },
  card: {
    backgroundColor: "#FFFDF8",
    borderRadius: 28,
    padding: 18,
    gap: 12,
    shadowColor: "#6A5B47",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  socialButton: { height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.6 },
  appleButton: { backgroundColor: "#171513" },
  appleText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  googleButton: { borderWidth: 1, borderColor: "#DED6CB", backgroundColor: "#FFF" },
  googleText: { color: "#2B2723", fontSize: 16, fontWeight: "700" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: "#E8DFD3" },
  orText: { color: "#8A8077", fontSize: 13 },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F7F1E8",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#201D1A",
  },
  emailButton: { height: 54, borderRadius: 18, backgroundColor: "#8C9670", alignItems: "center", justifyContent: "center", marginTop: 2 },
  emailButtonText: { fontFamily: "Schoolbell_400Regular", color: "#FFFDF8", fontSize: 23, letterSpacing: 1 },
  switchText: { textAlign: "center", color: "#655C54", fontSize: 14, marginTop: 2 },
  note: { textAlign: "center", color: "#9A9086", fontSize: 11, lineHeight: 16, marginTop: 2 },
});
