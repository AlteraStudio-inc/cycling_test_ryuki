import React from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { Header } from "@/components/Header";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PrimaryButton } from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  userId: string;
  errorCode: string | null;
};

export function ProfileMissingScreen({ userId, errorCode }: Props) {
  const handleLogout = async () => {
    if (!supabase) {
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("ログアウト失敗", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="初期設定が必要です"
        subtitle="profiles テーブルにユーザー情報が無いため、ここで停止しています。"
      />
      <ErrorBanner
        message={`code=${errorCode ?? "UNKNOWN"} / user_id=${userId}`}
      />
      <Text style={styles.help}>
        Supabase SQL Editor で、auth.users の同じ id を profiles に挿入してください。
      </Text>
      <Text selectable style={styles.sql}>
        {`insert into public.profiles (id, role, name, status)
select '${userId}', 'admin', '管理者', 'active'
where not exists (
  select 1 from public.profiles where id = '${userId}'
);`}
      </Text>
      <PrimaryButton label="ログアウトして戻る" onPress={handleLogout} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg
  },
  help: {
    color: colors.text,
    lineHeight: 22
  },
  sql: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontFamily: "monospace"
  }
});
