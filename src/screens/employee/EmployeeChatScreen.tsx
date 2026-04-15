import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from "react-native";
import { ChatInput } from "@/components/ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { MessageBubble } from "@/components/MessageBubble";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Message } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmployeeChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [directRoomId, setDirectRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, session } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(
    () => profile?.id ?? session?.user.id ?? "",
    [profile?.id, session?.user.id]
  );

  /* Find or create direct room with admin */
  useEffect(() => {
    if (!supabase || !myId) { setLoading(false); return; }
    (async () => {
      /* Find existing direct room for this employee */
      const { data: membership } = await supabase
        .from("direct_room_members")
        .select("room_id")
        .eq("user_id", myId)
        .limit(1)
        .maybeSingle();

      if (membership) {
        setDirectRoomId(membership.room_id);
      }
      /* If no room exists yet, the employee can't create one (admin only).
         Show empty state until admin initiates. */

      if (membership?.room_id) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", membership.room_id)
          .order("created_at", { ascending: true });
        setMessages((msgs ?? []) as Message[]);
      }
      setLoading(false);
    })();
  }, [myId]);

  /* Realtime subscription */
  useEffect(() => {
    const client = supabase;
    if (!client || !directRoomId) return;
    const channel = client
      .channel("employee-direct-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${directRoomId}` },
        (payload) => {
          setMessages((cur) => [...cur, payload.new as Message]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [directRoomId]);

  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || !supabase) {
      Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }
    if (!directRoomId) {
      Alert.alert("チャット未開設", "管理者がチャットルームを作成するまでお待ちください。");
      return;
    }
    setMessage("");
    await supabase.from("messages").insert({
      room_id: directRoomId,
      sender_id: myId,
      content
    });
  }, [message, directRoomId, myId]);

  if (loading) return <LoadingOverlay message="チャットを読み込んでいます..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="管理者チャット" subtitle="1対1でやり取りできます" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {!directRoomId ? (
          <EmptyState title="チャットルーム未開設" description="管理者がチャットルームを作成するとメッセージが表示されます。" />
        ) : messages.length === 0 ? (
          <EmptyState title="メッセージはまだありません" description="管理者に最初のメッセージを送信してみましょう。" />
        ) : (
          messages.map((item) => (
            <MessageBubble key={item.id} message={item} isMine={item.sender_id === myId} />
          ))
        )}
      </ScrollView>
      <ChatInput value={message} onChangeText={setMessage} onSend={() => void handleSend()} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  messages: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md
  }
});
