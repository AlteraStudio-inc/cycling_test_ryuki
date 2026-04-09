import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.subtext
  }
});
