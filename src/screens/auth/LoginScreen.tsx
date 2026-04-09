import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Header } from "@/components/Header";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Header
          title="ログイン"
          subtitle="管理者・従業員どちらも同じ画面からログインできます"
        />
        <View style={styles.form}>
          <FormInput
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
          />
          <FormInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry
          />
          {error ? <ErrorBanner message={error} /> : null}
          <PrimaryButton
            label={loading ? "ログイン中..." : "ログイン"}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl
  },
  form: {
    gap: spacing.lg
  }
});
