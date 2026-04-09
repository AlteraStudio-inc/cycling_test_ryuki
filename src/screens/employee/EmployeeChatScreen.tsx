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
    room_id: "direct",
    sender_id: "admin",
    content: "明日のシフト開始が30分早まりました。",
    created_at: "2026-04-10T20:00:00+09:00",
    read_flag: false
  },
  {
    id: "2",
    room_id: "direct",
    sender_id: "employee",
    content: "承知しました。",
    created_at: "2026-04-10T20:05:00+09:00",
    read_flag: true
  }
];

export function EmployeeChatScreen() {
  const [message, setMessage] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="管理者チャット" subtitle="1対1でやり取りできます" />
      <ScrollView contentContainerStyle={styles.messages}>
        {mockMessages.map((item) => (
          <MessageBubble
            key={item.id}
            message={item}
            isMine={item.sender_id === "employee"}
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
