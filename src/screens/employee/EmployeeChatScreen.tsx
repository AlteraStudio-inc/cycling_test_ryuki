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
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { profile } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(() => profile?.id ?? "", [profile?.id]);

  /* Get or create direct room, then load messages */
  useEffect(() => {
    if (!supabase || !myId) { setLoading(false); return; }
    (async () => {
      const { data: rid, error } = await supabase.rpc("employee_get_or_create_direct_room", {
        p_employee_id: myId
      });
      if (error || !rid) { setLoading(false); return; }
      setRoomId(rid as string);

      const { data: msgs } = await supabase.rpc("get_room_messages", { p_room_id: rid });
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, [myId]);

  /* Poll for new messages */
  useEffect(() => {
    const client = supabase;
    if (!client || !roomId) return;
    const interval = setInterval(async () => {
      const { data } = await client.rpc("get_room_messages", { p_room_id: roomId });
      if (data) setMessages(data as Message[]);
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || !supabase || !roomId || sending) {
      if (!content) Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }

    setSending(true);
    setMessage("");
    try {
      const { data } = await supabase.rpc("send_message", {
        p_room_id: roomId,
        p_sender_id: myId,
        p_content: content
      });
      if (data) {
        setMessages((cur) => [...cur, data as Message]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } finally {
      setSending(false);
    }
  }, [message, roomId, myId, sending]);

  if (loading) return <LoadingOverlay message="チャットを読み込んでいます..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="管理者チャット" subtitle="1対1でやり取りできます" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {messages.length === 0 ? (
          <EmptyState title="メッセージはまだありません" description="管理者にメッセージを送信してみましょう。" />
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
    padding: spacing.lg
  },
  messages: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md
  }
});
