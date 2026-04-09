import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  message?: string;
};

export function LoadingOverlay({ message = "読み込み中..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background
  },
  text: {
    color: colors.subtext,
    fontSize: 14
  }
});
