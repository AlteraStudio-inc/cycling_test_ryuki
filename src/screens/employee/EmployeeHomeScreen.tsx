import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { Header } from "@/components/Header";
import { ShiftCard } from "@/components/ShiftCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Shift, Message } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmployeeHomeScreen() {
  const { profile } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Message | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!supabase || !profile) return;
    const [shiftsRes, msgRes] = await Promise.all([
      supabase.rpc("get_employee_shifts", { p_employee_id: profile.id }),
      supabase.rpc("get_global_messages")
    ]);
    const all = (shiftsRes.data ?? []) as Shift[];
    const today = dayjs().format("YYYY-MM-DD");
    setShifts(all.filter((s) => s.shift_date >= today).slice(0, 5));

    const msgs = (msgRes.data ?? []) as Message[];
    setLatestAnnouncement(msgs.length > 0 ? msgs[0] : null);
  }, [profile]);

  useEffect(() => { void loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title="ホーム" subtitle={`${profile?.name ?? ""}さん、お疲れ様です`} />

      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{profile?.name}</Text>
        <Text style={styles.profileMeta}>社員コード: {profile?.employee_code ?? "未設定"}</Text>
      </View>

      {/* 全体チャット最新 */}
      <Text style={styles.sectionTitle}>全体チャット</Text>
      {latestAnnouncement ? (
        <View style={styles.announcementCard}>
          <Text style={styles.announcementBody}>{latestAnnouncement.content}</Text>
          <Text style={styles.announcementMeta}>
            {dayjs(latestAnnouncement.created_at).format("M/D HH:mm")}
          </Text>
        </View>
      ) : (
        <View style={styles.announcementCard}>
          <Text style={styles.noMessage}>新着メッセージはありません</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>今後の勤務予定</Text>
      {shifts.length === 0 ? (
        <EmptyState title="予定されたシフトはありません" description="管理者からシフトが登録されるとここに表示されます。" />
      ) : (
        shifts.map((s) => <ShiftCard key={s.id} shift={s} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  profileMeta: {
    fontSize: 14,
    color: colors.subtext
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.xs
  },
  announcementBody: {
    color: colors.text,
    lineHeight: 20
  },
  announcementMeta: {
    color: colors.subtext,
    fontSize: 12
  },
  noMessage: {
    color: colors.subtext,
    fontSize: 14
  }
});
