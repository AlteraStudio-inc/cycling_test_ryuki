import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Shift } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmployeeHomeScreen() {
  const { profile } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadShifts = useCallback(async () => {
    if (!supabase || !profile) return;
    const today = dayjs().format("YYYY-MM-DD");
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", profile.id)
      .gte("shift_date", today)
      .order("shift_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5);
    setShifts((data ?? []) as Shift[]);
  }, [profile]);

  useEffect(() => { void loadShifts(); }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title="ホーム" subtitle={`${profile?.name ?? ""}さん、お疲れ様です`} />

      {/* Profile info card */}
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{profile?.name}</Text>
        <Text style={styles.profileMeta}>部署: {profile?.department ?? "未設定"}</Text>
        <Text style={styles.profileMeta}>社員コード: {profile?.employee_code ?? "未設定"}</Text>
      </View>

      {/* Upcoming shifts */}
      <Text style={styles.sectionTitle}>今後の勤務予定</Text>
      {shifts.length === 0 ? (
        <EmptyState title="予定されたシフトはありません" description="管理者からシフトが登録されるとここに表示されます。" />
      ) : (
        shifts.map((s) => <ShiftCard key={s.id} shift={s} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  profileMeta: {
    fontSize: 14,
    color: colors.subtext
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  }
});
