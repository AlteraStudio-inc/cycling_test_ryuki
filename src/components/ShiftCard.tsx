import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Shift } from "@/types/app";
import { fmtTime } from "@/lib/formatTime";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  shift: Shift;
};

export function ShiftCard({ shift }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.date}>{shift.shift_date}</Text>
      <Text style={styles.time}>
        {fmtTime(shift.start_time)} - {fmtTime(shift.end_time)}
      </Text>
      <Text style={styles.type}>{shift.shift_type}</Text>
      {shift.note ? <Text style={styles.note}>{shift.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs
  },
  date: {
    fontSize: 14,
    color: colors.subtext
  },
  time: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text
  },
  type: {
    color: colors.primary,
    fontWeight: "700"
  },
  note: {
    fontSize: 14,
    color: colors.subtext
  }
});
