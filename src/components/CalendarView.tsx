import React from "react";
import { Calendar } from "react-native-calendars";
import { colors } from "@/theme/colors";

type Props = {
  selectedDate?: string;
  markedDates?: Record<string, unknown>;
  onDayPress?: (dateString: string) => void;
};

export function CalendarView({ selectedDate, markedDates, onDayPress }: Props) {
  return (
    <Calendar
      markedDates={{
        ...markedDates,
        ...(selectedDate
          ? {
              [selectedDate]: {
                ...(markedDates?.[selectedDate as keyof typeof markedDates] || {}),
                selected: true,
                selectedColor: colors.primary
              }
            }
          : {})
      }}
      theme={{
        todayTextColor: colors.info,
        arrowColor: colors.primary,
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 13
      }}
      onDayPress={(day) => onDayPress?.(day.dateString)}
    />
  );
}
