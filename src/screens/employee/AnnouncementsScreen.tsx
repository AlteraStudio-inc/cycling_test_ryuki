import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { Header } from "@/components/Header";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function AnnouncementsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="お知らせ" subtitle="全体連絡のみ表示します" />
      <View style={styles.card}>
        <Text style={styles.title}>本日の共有事項</Text>
        <Text style={styles.body}>店内清掃の分担が変更されています。出勤時に確認してください。</Text>
        <Text style={styles.meta}>{dayjs().format("YYYY/MM/DD HH:mm")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  card: {
    backgroundColor: colors.unread,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  body: {
    color: colors.text,
    lineHeight: 22
  },
  meta: {
    color: colors.subtext,
    fontSize: 12
  }
});
