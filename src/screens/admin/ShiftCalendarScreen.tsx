import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { CalendarView } from "@/components/CalendarView";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const mockShift = {
  id: "1",
  employee_id: "1",
  shift_date: "2026-04-10",
  start_time: "09:00",
  end_time: "18:00",
  shift_type: "通常勤務",
  note: "レジ担当"
};

export function ShiftCalendarScreen() {
  const [selectedDate, setSelectedDate] = useState("2026-04-10");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="シフト" subtitle="日付を選ぶとその日の一覧へ移動する設計です" />
      <CalendarView
        selectedDate={selectedDate}
        markedDates={{
          "2026-04-10": { marked: true, dotColor: colors.primary }
        }}
        onDayPress={setSelectedDate}
      />
      <ShiftCard shift={{ ...mockShift, shift_date: selectedDate }} />
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
