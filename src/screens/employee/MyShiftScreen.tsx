import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { CalendarView } from "@/components/CalendarView";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Shift } from "@/types/app";
import { fmtTime } from "@/lib/formatTime";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

function calcHours(start: string, end: string): number {
  const [sh, sm] = fmtTime(start).split(":").map(Number);
  const [eh, em] = fmtTime(end).split(":").map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

export function MyShiftScreen() {
  const { profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadShifts = useCallback(async () => {
    if (!supabase || !profile) return;
    const { data } = await supabase.rpc("get_employee_shifts", { p_employee_id: profile.id });
    setShifts((data ?? []) as Shift[]);
  }, [profile]);

  useEffect(() => { void loadShifts(); }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const s of shifts) marks[s.shift_date] = { marked: true, dotColor: colors.primary };
    return marks;
  }, [shifts]);

  const shiftsForDate = useMemo(
    () => shifts.filter((s) => s.shift_date === selectedDate),
    [shifts, selectedDate]
  );

  const totalHours = useMemo(() => {
    return shifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0);
  }, [shifts]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title="マイシフト" subtitle="自分のシフトを月表示で確認できます" />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{shifts.length}</Text>
          <Text style={styles.summaryLabel}>総シフト数</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>総労働時間(予定)</Text>
        </View>
      </View>

      <CalendarView selectedDate={selectedDate} markedDates={markedDates} onDayPress={setSelectedDate} />
      {shiftsForDate.length === 0 ? (
        <EmptyState title="この日のシフトはありません" description="シフトのある日はカレンダーにドットが付きます。" />
      ) : (
        shiftsForDate.map((s) => <ShiftCard key={s.id} shift={s} />)
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
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
    gap: 2
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff"
  },
  summaryLabel: {
    fontSize: 11,
    color: "#ffffffcc"
  }
});
