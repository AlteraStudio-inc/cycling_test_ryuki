import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmployeeHomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="ホーム"
        subtitle="今日の勤務予定と次回勤務予定を最初に見せる構成です"
      />
      <ShiftCard
        shift={{
          id: "1",
          employee_id: "1",
          shift_date: "2026-04-10",
          start_time: "10:00",
          end_time: "19:00",
          shift_type: "通常勤務",
          note: "開店準備あり"
        }}
      />
      <ShiftCard
        shift={{
          id: "2",
          employee_id: "1",
          shift_date: "2026-04-12",
          start_time: "12:00",
          end_time: "21:00",
          shift_type: "遅番",
          note: null
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
