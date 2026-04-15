import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

type Props = {
  value: string; // "HH:mm" or "24:00" or "LAST"
  onChange: (value: string) => void;
  showLast?: boolean;
  label?: string;
};

export function TimePicker({ value, onChange, showLast, label }: Props) {
  const isLast = value === "LAST";
  const hour = isLast ? "" : (value === "24:00" ? "24" : value.slice(0, 2));
  const minute = isLast ? "" : value.slice(3, 5);

  const handleHourChange = (h: string) => {
    if (h === "24") { onChange("24:00"); return; }
    onChange(`${h}:${minute || "00"}`);
  };

  const handleMinuteChange = (m: string) => {
    onChange(`${hour || "09"}:${m}`);
  };

  if (Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Text style={styles.display}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <View style={styles.selectWrapper}>
          <select
            value={isLast ? "" : (hour === "24" ? "24" : hour)}
            onChange={(e) => handleHourChange(e.target.value)}
            style={selectStyle}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{h}時</option>
            ))}
            <option value="24">24時</option>
          </select>
        </View>
        <Text style={styles.colon}>:</Text>
        <View style={styles.selectWrapper}>
          <select
            value={isLast ? "" : minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            style={selectStyle}
            disabled={isLast || hour === "24"}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>{m}分</option>
            ))}
          </select>
        </View>
        {showLast ? (
          <View style={styles.selectWrapper}>
            <select
              value={isLast ? "LAST" : ""}
              onChange={(e) => {
                if (e.target.value === "LAST") onChange("LAST");
                else onChange(`${hour || "09"}:${minute || "00"}`);
              }}
              style={selectStyle}
            >
              <option value="">--</option>
              <option value="LAST">LAST</option>
            </select>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const selectStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: "700",
  padding: "10px 14px",
  borderRadius: 12,
  border: `2px solid ${colors.border}`,
  backgroundColor: colors.surface,
  color: colors.text,
  appearance: "none",
  WebkitAppearance: "none",
  textAlign: "center",
  width: "100%",
  cursor: "pointer"
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  selectWrapper: {
    flex: 1
  },
  colon: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text
  },
  display: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  }
});
