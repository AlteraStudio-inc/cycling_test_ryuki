import React from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function SettingsScreen() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("ログアウト失敗", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="設定" subtitle="アカウントと通知設定を管理します" />
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
