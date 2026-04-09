import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "@/components/Header";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function AdminHomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="ダッシュボード"
        subtitle="今日のシフト、未読連絡、従業員の状態をまとめて確認"
      />
      <View style={styles.card}>
        <Text style={styles.value}>12</Text>
        <Text style={styles.label}>本日のシフト件数</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>3</Text>
        <Text style={styles.label}>未読メッセージ</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text
  },
  label: {
    color: colors.subtext,
    fontSize: 14
  }
});
