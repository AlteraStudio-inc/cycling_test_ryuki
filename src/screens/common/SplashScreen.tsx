import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift Mobile</Text>
      <Text style={styles.subtitle}>シフトと連絡を、スマホでシンプルに。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: colors.subtext
  }
});
