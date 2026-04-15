import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { fmtTime } from "@/lib/formatTime";
import type { Shift, Profile } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type StaffShift = Shift & { employeeName: string };

export function AdminHomeScreen() {
  const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!supabase) return;
    const today = dayjs().format("YYYY-MM-DD");

    const [shiftsRes, empRes] = await Promise.all([
      supabase.from("shifts").select("*").eq("shift_date", today).order("start_time"),
      supabase.from("profiles").select("id, name").eq("role", "employee")
    ]);

    const shifts = (shiftsRes.data ?? []) as Shift[];
    const employees = (empRes.data ?? []) as Pick<Profile, "id" | "name">[];
    const nameMap = new Map(employees.map((e) => [e.id, e.name]));

    setStaffShifts(
      shifts.map((s) => ({ ...s, employeeName: nameMap.get(s.employee_id) ?? "不明" }))
    );
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
      <Header title="稼働状況" subtitle={dayjs().format("YYYY年M月D日 (ddd)")} />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{staffShifts.length}</Text>
        <Text style={styles.summaryLabel}>本日の稼働スタッフ数</Text>
      </View>

      {staffShifts.length === 0 ? (
        <EmptyState title="本日のシフトはありません" description="シフト管理から登録してください。" />
      ) : (
        staffShifts.map((s) => (
          <View key={s.id} style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{s.employeeName}</Text>
              <Text style={styles.staffType}>{s.shift_type}</Text>
            </View>
            <Text style={styles.staffTime}>{fmtTime(s.start_time)} - {fmtTime(s.end_time)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.xs,
    alignItems: "center"
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff"
  },
  summaryLabel: {
    color: "#ffffffcc",
    fontSize: 14
  },
  staffRow: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  staffInfo: {
    gap: spacing.xs,
    flex: 1
  },
  staffName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  staffType: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600"
  },
  staffTime: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  }
});
