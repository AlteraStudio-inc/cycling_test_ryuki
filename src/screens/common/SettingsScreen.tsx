import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { getAppMode } from "@/hooks/useAppMode";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function SettingsScreen() {
  const { setProfile, setSession } = useAuthStore();
  const appMode = useMemo(() => getAppMode(), []);

  const handleLogout = async () => {
    if (appMode === "employee") {
      /* Employee mode: just clear profile (no Supabase auth) */
      setProfile(null);
      return;
    }

    /* Admin mode: sign out from Supabase */
    if (!supabase) {
      Alert.alert("設定不足", "Supabase設定が未完了です。");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("ログアウト失敗", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="設定" subtitle="アカウントと通知設定を管理します" />
      {!isSupabaseConfigured ? (
        <ErrorBanner message="Supabase未設定のため、認証系機能は利用できません。" />
      ) : null}
      <PrimaryButton label="ログアウト" onPress={handleLogout} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl
  }
});
