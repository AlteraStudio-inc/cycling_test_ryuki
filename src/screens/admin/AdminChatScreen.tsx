import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ChatInput } from "@/components/ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { MessageBubble } from "@/components/MessageBubble";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import type { Message, Profile } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type ChatTab = "global" | "direct";

export function AdminChatScreen() {
  const [tab, setTab] = useState<ChatTab>("global");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [globalRoomId, setGlobalRoomId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [directRoomId, setDirectRoomId] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const { profile, session } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(() => profile?.id ?? session?.user.id ?? "", [profile?.id, session?.user.id]);

  /* ── Load via RPC ── */
  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    (async () => {
      const [roomRes, empRes] = await Promise.all([
        supabase.rpc("get_global_room_id"),
        supabase.rpc("admin_list_employees")
      ]);

      const roomId = roomRes.data as string | null;
      if (roomId) {
        setGlobalRoomId(roomId);
        const { data: msgs } = await supabase.rpc("get_room_messages", { p_room_id: roomId });
        setGlobalMessages((msgs ?? []) as Message[]);
      }
      setEmployees((empRes.data ?? []) as Profile[]);
      setLoaded(true);
    })();
  }, []);

  /* ── Select employee for direct chat ── */
  const selectEmployee = useCallback(async (emp: Profile) => {
    setSelectedEmployee(emp);
    setDirectMessages([]);
    setDirectRoomId(null);
    if (!supabase) return;

    const { data: roomId } = await supabase.rpc("find_or_create_direct_room", {
      p_admin_id: myId,
      p_employee_id: emp.id
    });

    if (roomId) {
      setDirectRoomId(roomId as string);
      const { data: msgs } = await supabase.rpc("get_room_messages", { p_room_id: roomId });
      setDirectMessages((msgs ?? []) as Message[]);
    }
  }, [myId]);

  /* ── Send message ── */
  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || !supabase || sending) {
      if (!content) Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      if (tab === "global" && globalRoomId) {
        const { data } = await supabase.rpc("send_message", {
          p_room_id: globalRoomId,
          p_sender_id: myId,
          p_content: content
        });
        if (data) setGlobalMessages((c) => [...c, data as Message]);
      } else if (tab === "direct" && directRoomId) {
        const { data } = await supabase.rpc("send_message", {
          p_room_id: directRoomId,
          p_sender_id: myId,
          p_content: content
        });
        if (data) setDirectMessages((c) => [...c, data as Message]);
      }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  }, [message, tab, globalRoomId, directRoomId, myId, sending]);

  const currentMessages = tab === "global" ? globalMessages : directMessages;

  if (!loaded) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="チャット" />

      <View style={styles.tabRow}>
        <Pressable style={[styles.tabBtn, tab === "global" && styles.tabActive]} onPress={() => setTab("global")}>
          <Text style={[styles.tabText, tab === "global" && styles.tabTextActive]}>全体チャット</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === "direct" && styles.tabActive]} onPress={() => setTab("direct")}>
          <Text style={[styles.tabText, tab === "direct" && styles.tabTextActive]}>個人チャット</Text>
        </Pressable>
      </View>

      {tab === "direct" && !selectedEmployee && (
        <ScrollView style={styles.empList} contentContainerStyle={styles.empListContent}>
          {employees.length === 0 ? (
            <EmptyState title="従業員がいません" description="従業員を登録してください。" />
          ) : (
            employees.map((e) => (
              <Pressable key={e.id} style={styles.empItem} onPress={() => void selectEmployee(e)}>
                <Text style={styles.empName}>{e.name}</Text>
                <Text style={styles.empSub}>{e.employee_code ?? ""}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {tab === "direct" && selectedEmployee && (
        <Pressable style={styles.backBtn} onPress={() => { setSelectedEmployee(null); setDirectMessages([]); setDirectRoomId(null); }}>
          <Text style={styles.backText}>← {selectedEmployee.name} とのチャット</Text>
        </Pressable>
      )}

      {(tab === "global" || selectedEmployee) && (
        <>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
            {currentMessages.length === 0 ? (
              <EmptyState title="メッセージはまだありません" description="最初のメッセージを送信しましょう。" />
            ) : (
              currentMessages.map((m) => (
                <MessageBubble key={m.id} message={m} isMine={m.sender_id === myId} />
              ))
            )}
          </ScrollView>
          <ChatInput value={message} onChangeText={setMessage} onSend={() => void handleSend()} />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  tabRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "700", color: colors.subtext },
  tabTextActive: { color: "#fff" },
  empList: { flex: 1 },
  empListContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  empItem: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empName: { fontSize: 16, fontWeight: "700", color: colors.text },
  empSub: { fontSize: 13, color: colors.subtext },
  backBtn: { paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  messages: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.md }
});
