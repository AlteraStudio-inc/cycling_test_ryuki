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
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(() => profile?.id ?? "", [profile?.id]);

  /* Fetch direct messages via RPC */
  useEffect(() => {
    if (!supabase || !myId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.rpc("get_direct_messages", {
        p_user_id: myId
      });
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();
  }, [myId]);

  /* Poll for new messages every 5 seconds (no auth = no realtime) */
  useEffect(() => {
    const client = supabase;
    if (!client || !myId) return;
    const interval = setInterval(async () => {
      const { data } = await client.rpc("get_direct_messages", {
        p_user_id: myId
      });
      if (data) setMessages(data as Message[]);
    }, 5000);
    return () => clearInterval(interval);
  }, [myId]);

  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content) {
      Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }
    Alert.alert("チャット未開設", "管理者がチャットルームを作成するまでお待ちください。");
  }, [message]);

  if (loading) return <LoadingOverlay message="チャットを読み込んでいます..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="管理者チャット" subtitle="1対1でやり取りできます" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {messages.length === 0 ? (
          <EmptyState title="メッセージはまだありません" description="管理者からのメッセージがここに表示されます。" />
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
