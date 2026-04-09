import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  description: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center"
  }
});
