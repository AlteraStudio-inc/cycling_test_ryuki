import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { Message } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function AnnouncementsScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc("get_global_messages");
    setMessages((data ?? []) as Message[]);
  }, []);

  useEffect(() => { void loadAnnouncements(); }, [loadAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  }, [loadAnnouncements]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title="お知らせ" subtitle="全体連絡のメッセージを表示します" />
      {messages.length === 0 ? (
        <EmptyState title="お知らせはまだありません" description="管理者が全体チャットに投稿すると表示されます。" />
      ) : (
        messages.map((msg) => (
          <View key={msg.id} style={styles.card}>
            <Text style={styles.body}>{msg.content}</Text>
            <Text style={styles.meta}>{dayjs(msg.created_at).format("YYYY/MM/DD HH:mm")}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm
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
