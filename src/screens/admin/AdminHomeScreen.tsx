import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function AdminHomeScreen() {
  const [todayShifts, setTodayShifts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    const today = dayjs().format("YYYY-MM-DD");

    const [shiftsRes, messagesRes, employeesRes] = await Promise.all([
      supabase.from("shifts").select("id", { count: "exact", head: true }).eq("shift_date", today),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("read_flag", false),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee")
    ]);

    setTodayShifts(shiftsRes.count ?? 0);
    setUnreadMessages(messagesRes.count ?? 0);
    setEmployeeCount(employeesRes.count ?? 0);
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title="ダッシュボード" subtitle="今日のシフト、未読連絡、従業員の状態をまとめて確認" />
      <View style={styles.card}>
        <Text style={styles.value}>{todayShifts}</Text>
        <Text style={styles.label}>本日のシフト件数</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{unreadMessages}</Text>
        <Text style={styles.label}>未読メッセージ</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{employeeCount}</Text>
        <Text style={styles.label}>登録従業員数</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text
  },
  label: {
    color: colors.subtext,
    fontSize: 14
  }
});
