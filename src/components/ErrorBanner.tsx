import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  message: string;
};

export function ErrorBanner({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FDECEA",
    borderRadius: 14,
    padding: spacing.md
  },
  text: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600"
  }
});
