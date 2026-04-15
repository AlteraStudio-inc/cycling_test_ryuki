import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { CalendarView } from "@/components/CalendarView";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Shift } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function MyShiftScreen() {
  const { profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [shifts, setShifts] = useState<Shift[]>([]);

  const loadShifts = useCallback(async () => {
    if (!supabase || !profile) return;
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", profile.id)
      .order("shift_date", { ascending: true })
      .order("start_time", { ascending: true });
    setShifts((data ?? []) as Shift[]);
  }, [profile]);

  useEffect(() => { void loadShifts(); }, [loadShifts]);

  /* Realtime subscription for shift changes */
  useEffect(() => {
    const client = supabase;
    if (!client || !profile) return;
    const channel = client
      .channel("my-shifts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts", filter: `employee_id=eq.${profile.id}` },
        () => void loadShifts()
      )
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [profile, loadShifts]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const s of shifts) {
      marks[s.shift_date] = { marked: true, dotColor: colors.primary };
    }
    return marks;
  }, [shifts]);

  const shiftsForDate = useMemo(
    () => shifts.filter((s) => s.shift_date === selectedDate),
    [shifts, selectedDate]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="マイシフト" subtitle="自分のシフトを月表示で確認できます" />
      <CalendarView
        selectedDate={selectedDate}
        markedDates={markedDates}
        onDayPress={setSelectedDate}
      />
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
    padding: spacing.xl,
    gap: spacing.lg
  }
});
