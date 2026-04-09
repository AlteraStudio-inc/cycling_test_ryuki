import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary"
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.label, variant !== "primary" && styles.altLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  secondary: {
    backgroundColor: colors.primarySoft
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  label: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700"
  },
  altLabel: {
    color: colors.text
  }
});
