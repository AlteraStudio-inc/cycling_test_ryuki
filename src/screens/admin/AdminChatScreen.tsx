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

export function AdminChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [globalRoomId, setGlobalRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, session } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(
    () => profile?.id ?? session?.user.id ?? "",
    [profile?.id, session?.user.id]
  );

  /* Fetch global room & messages */
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("room_type", "global")
        .single();
      if (!room) { setLoading(false); return; }
      setGlobalRoomId(room.id);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, []);

  /* Realtime subscription */
  useEffect(() => {
    const client = supabase;
    if (!client || !globalRoomId) return;
    const channel = client
      .channel("admin-global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${globalRoomId}` },
        (payload) => {
          setMessages((cur) => [...cur, payload.new as Message]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [globalRoomId]);

  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || !supabase || !globalRoomId) {
      Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }
    setMessage("");
    await supabase.from("messages").insert({
      room_id: globalRoomId,
      sender_id: myId,
      content
    });
  }, [message, globalRoomId, myId]);

  if (loading) return <LoadingOverlay message="チャットを読み込んでいます..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="全体チャット" subtitle="全従業員への連絡用チャットです" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {messages.length === 0 ? (
          <EmptyState title="メッセージはまだありません" description="最初のメッセージを送信してみましょう。" />
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
