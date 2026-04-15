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

  /* Global chat */
  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [globalRoomId, setGlobalRoomId] = useState<string | null>(null);

  /* Direct chat */
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [directRoomId, setDirectRoomId] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const { profile, session } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const myId = useMemo(
    () => profile?.id ?? session?.user.id ?? "",
    [profile?.id, session?.user.id]
  );

  /* ── Load global room ── */
  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    (async () => {
      const { data: room } = await supabase
        .from("chat_rooms").select("id").eq("room_type", "global").maybeSingle();
      if (room) {
        setGlobalRoomId(room.id);
        const { data: msgs } = await supabase
          .from("messages").select("*").eq("room_id", room.id).order("created_at", { ascending: true });
        setGlobalMessages((msgs ?? []) as Message[]);
      }

      const { data: emps } = await supabase
        .from("profiles").select("id, role, name, employee_code, phone, department, status")
        .eq("role", "employee").order("name");
      setEmployees((emps ?? []) as Profile[]);
      setLoaded(true);
    })();
  }, []);

  /* ── Realtime for global ── */
  useEffect(() => {
    const client = supabase;
    if (!client || !globalRoomId) return;
    const ch = client.channel("admin-global-chat")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `room_id=eq.${globalRoomId}`
      }, (p) => {
        setGlobalMessages((c) => [...c, p.new as Message]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
    return () => { client.removeChannel(ch); };
  }, [globalRoomId]);

  /* ── Load direct room when employee selected ── */
  const selectEmployee = useCallback(async (emp: Profile) => {
    setSelectedEmployee(emp);
    setDirectMessages([]);
    setDirectRoomId(null);
    if (!supabase) return;

    /* Find existing direct room */
    const { data: rooms } = await supabase
      .from("direct_room_members").select("room_id").eq("user_id", emp.id);
    if (rooms && rooms.length > 0) {
      const roomId = rooms[0].room_id;
      setDirectRoomId(roomId);
      const { data: msgs } = await supabase
        .from("messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true });
      setDirectMessages((msgs ?? []) as Message[]);
    }
  }, []);

  /* ── Create direct room if needed ── */
  const ensureDirectRoom = useCallback(async (): Promise<string | null> => {
    if (directRoomId) return directRoomId;
    if (!supabase || !selectedEmployee) return null;

    const { data: room, error } = await supabase
      .from("chat_rooms").insert({ room_type: "direct" }).select("id").single();
    if (error || !room) return null;

    await supabase.from("direct_room_members").insert([
      { room_id: room.id, user_id: myId },
      { room_id: room.id, user_id: selectedEmployee.id }
    ]);
    setDirectRoomId(room.id);
    return room.id;
  }, [directRoomId, selectedEmployee, myId]);

  /* ── Send message ── */
  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || !supabase) {
      Alert.alert("送信できません", "メッセージを入力してください。");
      return;
    }

    if (tab === "global") {
      if (!globalRoomId) return;
      setMessage("");
      await supabase.from("messages").insert({ room_id: globalRoomId, sender_id: myId, content });
    } else {
      const roomId = await ensureDirectRoom();
      if (!roomId) return;
      setMessage("");
      const { data } = await supabase.from("messages")
        .insert({ room_id: roomId, sender_id: myId, content })
        .select("*").single();
      if (data) setDirectMessages((c) => [...c, data as Message]);
    }
  }, [message, tab, globalRoomId, myId, ensureDirectRoom]);

  const currentMessages = tab === "global" ? globalMessages : directMessages;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="チャット" />

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable style={[styles.tabBtn, tab === "global" && styles.tabActive]} onPress={() => setTab("global")}>
          <Text style={[styles.tabText, tab === "global" && styles.tabTextActive]}>全体チャット</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === "direct" && styles.tabActive]} onPress={() => setTab("direct")}>
          <Text style={[styles.tabText, tab === "direct" && styles.tabTextActive]}>個人チャット</Text>
        </Pressable>
      </View>

      {/* Direct: employee selector */}
      {tab === "direct" && !selectedEmployee && loaded && (
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

      {/* Messages */}
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
