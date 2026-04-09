import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from "react-native";
import { ChatInput } from "@/components/ChatInput";
import { Header } from "@/components/Header";
import { MessageBubble } from "@/components/MessageBubble";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const mockMessages = [
  {
    id: "1",
    room_id: "global",
    sender_id: "admin",
    content: "本日は10分前集合でお願いします。",
    created_at: "2026-04-10T08:00:00+09:00",
    read_flag: true
  },
  {
    id: "2",
    room_id: "global",
    sender_id: "employee",
    content: "了解しました。",
    created_at: "2026-04-10T08:05:00+09:00",
    read_flag: true
  }
];

export function AdminChatScreen() {
  const [message, setMessage] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="チャット" subtitle="全体連絡と個人チャットを切り替える想定です" />
      <ScrollView contentContainerStyle={styles.messages}>
        {mockMessages.map((item) => (
          <MessageBubble
            key={item.id}
            message={item}
            isMine={item.sender_id === "admin"}
          />
        ))}
      </ScrollView>
      <ChatInput value={message} onChangeText={setMessage} onSend={() => setMessage("")} />
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
