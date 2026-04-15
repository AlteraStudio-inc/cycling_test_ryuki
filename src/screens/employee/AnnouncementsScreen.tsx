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

    /* Get global room */
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("room_type", "global")
      .single();
    if (!room) return;

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setMessages((msgs ?? []) as Message[]);
  }, []);

  useEffect(() => { void loadAnnouncements(); }, [loadAnnouncements]);

  /* Realtime for new announcements */
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => void loadAnnouncements()
      )
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [loadAnnouncements]);

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
