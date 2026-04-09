import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { CalendarView } from "@/components/CalendarView";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function MyShiftScreen() {
  const [selectedDate, setSelectedDate] = useState("2026-04-10");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="マイシフト" subtitle="自分のシフトだけを月表示で確認できます" />
      <CalendarView
        selectedDate={selectedDate}
        markedDates={{
          "2026-04-10": { marked: true, dotColor: colors.primary },
          "2026-04-12": { marked: true, dotColor: colors.primary }
        }}
        onDayPress={setSelectedDate}
      />
      <ShiftCard
        shift={{
          id: "1",
          employee_id: "1",
          shift_date: selectedDate,
          start_time: "10:00",
          end_time: "19:00",
          shift_type: "通常勤務",
          note: "開店準備あり"
        }}
      />
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
