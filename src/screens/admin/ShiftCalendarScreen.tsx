import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { CalendarView } from "@/components/CalendarView";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Header } from "@/components/Header";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PrimaryButton } from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Profile, Shift } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

dayjs.extend(isoWeek);

type ViewMode = "week" | "month";

const SHIFT_TYPES = ["バッテリー交換", "シェア配送"];
const TIME_OPTIONS = [
  "06:00","07:00","08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
  "20:00","21:00","22:00"
];

/* ── helpers ── */
function weekDates(base: string) {
  const d = dayjs(base).startOf("isoWeek");
  return Array.from({ length: 7 }, (_, i) => d.add(i, "day"));
}

function daysLabel(d: dayjs.Dayjs) {
  return ["月","火","水","木","金","土","日"][d.isoWeekday() - 1];
}

export function ShiftCalendarScreen() {
  const { profile } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Modal wizard state */
  const [step, setStep] = useState<"closed"|"employee"|"detail"|"confirm">("closed");
  const [modalDate, setModalDate] = useState("");
  const [pickedEmployee, setPickedEmployee] = useState<Profile | null>(null);
  const [pickedType, setPickedType] = useState(SHIFT_TYPES[0]);
  const [pickedStart, setPickedStart] = useState("09:00");
  const [pickedEnd, setPickedEnd] = useState("18:00");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── Data loading ── */
  const loadData = useCallback(async (refresh = false) => {
    if (!supabase) return;
    if (!refresh) setLoading(true);

    const [shiftsRes, empRes] = await Promise.all([
      supabase.from("shifts").select("*").order("shift_date").order("start_time"),
      supabase.from("profiles").select("id, role, name, employee_code, phone, department, status")
        .eq("role", "employee").order("name")
    ]);
    setShifts((shiftsRes.data ?? []) as Shift[]);
    setEmployees((empRes.data ?? []) as Profile[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ── Derived data ── */
  const markedDates = useMemo(() => {
    const m: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const s of shifts) m[s.shift_date] = { marked: true, dotColor: colors.primary };
    return m;
  }, [shifts]);

  const shiftsForDate = useCallback(
    (date: string) => shifts.filter((s) => s.shift_date === date),
    [shifts]
  );

  const employeeName = useCallback(
    (id: string) => employees.find((e) => e.id === id)?.name ?? "不明",
    [employees]
  );

  /* ── Week view dates ── */
  const week = useMemo(() => weekDates(selectedDate), [selectedDate]);

  /* ── Open add shift wizard ── */
  const openAdd = (date: string) => {
    setModalDate(date);
    setPickedEmployee(null);
    setPickedType(SHIFT_TYPES[0]);
    setPickedStart("09:00");
    setPickedEnd("18:00");
    setSaveError(null);
    setStep("employee");
  };

  /* ── Save shift ── */
  const handleSave = async () => {
    if (!supabase || !pickedEmployee || !profile) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from("shifts").insert({
      employee_id: pickedEmployee.id,
      shift_date: modalDate,
      start_time: pickedStart,
      end_time: pickedEnd,
      shift_type: pickedType,
      created_by: profile.id
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message.includes("overlap")
        ? "この従業員の同日シフトと時間が重複しています。"
        : `保存に失敗しました: ${error.message}`);
      return;
    }
    setStep("closed");
    void loadData(true);
  };

  /* ── Delete shift ── */
  const handleDelete = async (shiftId: string) => {
    if (!supabase) return;
    await supabase.from("shifts").delete().eq("id", shiftId);
    void loadData(true);
  };

  if (loading) return <LoadingOverlay message="シフトを読み込んでいます..." />;

  /* ── Render a day's shift list ── */
  const renderDayShifts = (date: string) => {
    const list = shiftsForDate(date);
    return (
      <View key={date}>
        {list.map((s) => (
          <Pressable key={s.id} onPress={() => handleDelete(s.id)} style={styles.shiftRow}>
            <Text style={styles.shiftTime}>{s.start_time}-{s.end_time}</Text>
            <Text style={styles.shiftName}>{employeeName(s.employee_id)}</Text>
            <Text style={styles.shiftType}>{s.shift_type}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="シフト管理" subtitle="日付をタップしてシフトを追加" />

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, viewMode === "week" && styles.toggleActive]}
          onPress={() => setViewMode("week")}
        >
          <Text style={[styles.toggleText, viewMode === "week" && styles.toggleTextActive]}>週表示</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === "month" && styles.toggleActive]}
          onPress={() => setViewMode("month")}
        >
          <Text style={[styles.toggleText, viewMode === "month" && styles.toggleTextActive]}>月表示</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadData(true); }} tintColor={colors.primary} />}
      >
        {viewMode === "month" ? (
          /* ── Month view ── */
          <>
            <CalendarView
              selectedDate={selectedDate}
              markedDates={markedDates}
              onDayPress={(d) => { setSelectedDate(d); openAdd(d); }}
            />
            <Text style={styles.dateLabel}>{dayjs(selectedDate).format("M月D日 (ddd)")}</Text>
            {shiftsForDate(selectedDate).length === 0 ? (
              <EmptyState title="シフトなし" description="日付をタップして追加できます。" />
            ) : renderDayShifts(selectedDate)}
          </>
        ) : (
          /* ── Week view ── */
          <>
            <View style={styles.weekNav}>
              <Pressable onPress={() => setSelectedDate(dayjs(selectedDate).subtract(7, "day").format("YYYY-MM-DD"))}>
                <Text style={styles.weekArrow}>← 前週</Text>
              </Pressable>
              <Text style={styles.weekTitle}>
                {week[0].format("M/D")} - {week[6].format("M/D")}
              </Text>
              <Pressable onPress={() => setSelectedDate(dayjs(selectedDate).add(7, "day").format("YYYY-MM-DD"))}>
                <Text style={styles.weekArrow}>翌週 →</Text>
              </Pressable>
            </View>
            {week.map((d) => {
              const ds = d.format("YYYY-MM-DD");
              const isToday = ds === dayjs().format("YYYY-MM-DD");
              const dayShifts = shiftsForDate(ds);
              return (
                <Pressable key={ds} style={[styles.weekDay, isToday && styles.weekDayToday]} onPress={() => openAdd(ds)}>
                  <View style={styles.weekDayHeader}>
                    <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>
                      {daysLabel(d)} {d.format("M/D")}
                    </Text>
                    <Text style={styles.weekDayCount}>{dayShifts.length}件</Text>
                  </View>
                  {dayShifts.map((s) => (
                    <Pressable key={s.id} onPress={() => handleDelete(s.id)} style={styles.weekShiftRow}>
                      <Text style={styles.shiftTime}>{s.start_time}-{s.end_time}</Text>
                      <Text style={styles.shiftName}>{employeeName(s.employee_id)}</Text>
                      <Text style={styles.shiftType}>{s.shift_type}</Text>
                    </Pressable>
                  ))}
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Shift add wizard modal ── */}
      <Modal visible={step !== "closed"} transparent animationType="slide" onRequestClose={() => setStep("closed")}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Step 1: Select employee */}
              {step === "employee" && (
                <>
                  <Text style={styles.modalTitle}>{dayjs(modalDate).format("M月D日")} - 従業員を選択</Text>
                  {employees.length === 0 ? (
                    <EmptyState title="従業員がいません" description="先に従業員を登録してください。" />
                  ) : (
                    employees.map((e) => (
                      <Pressable
                        key={e.id}
                        style={[styles.pickItem, pickedEmployee?.id === e.id && styles.pickItemActive]}
                        onPress={() => { setPickedEmployee(e); setStep("detail"); }}
                      >
                        <Text style={styles.pickItemText}>{e.name}</Text>
                        <Text style={styles.pickItemSub}>{e.employee_code ?? ""}</Text>
                      </Pressable>
                    ))
                  )}
                  <PrimaryButton label="キャンセル" onPress={() => setStep("closed")} variant="secondary" />
                </>
              )}

              {/* Step 2: Select type & time */}
              {step === "detail" && (
                <>
                  <Text style={styles.modalTitle}>業務内容・時間を選択</Text>
                  <Text style={styles.fieldLabel}>業務内容</Text>
                  <View style={styles.chipRow}>
                    {SHIFT_TYPES.map((t) => (
                      <Pressable key={t} style={[styles.chip, pickedType === t && styles.chipActive]} onPress={() => setPickedType(t)}>
                        <Text style={[styles.chipText, pickedType === t && styles.chipTextActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>開始時間</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {TIME_OPTIONS.map((t) => (
                        <Pressable key={t} style={[styles.chip, pickedStart === t && styles.chipActive]} onPress={() => setPickedStart(t)}>
                          <Text style={[styles.chipText, pickedStart === t && styles.chipTextActive]}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.fieldLabel}>終了時間</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {TIME_OPTIONS.map((t) => (
                        <Pressable key={t} style={[styles.chip, pickedEnd === t && styles.chipActive]} onPress={() => setPickedEnd(t)}>
                          <Text style={[styles.chipText, pickedEnd === t && styles.chipTextActive]}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.modalActions}>
                    <PrimaryButton label="戻る" onPress={() => setStep("employee")} variant="secondary" />
                    <PrimaryButton label="確認へ" onPress={() => {
                      if (pickedStart >= pickedEnd) { setSaveError("終了時間は開始時間より後にしてください。"); return; }
                      setSaveError(null);
                      setStep("confirm");
                    }} />
                  </View>
                  {saveError ? <ErrorBanner message={saveError} /> : null}
                </>
              )}

              {/* Step 3: Confirm */}
              {step === "confirm" && (
                <>
                  <Text style={styles.modalTitle}>シフト確認</Text>
                  <View style={styles.confirmCard}>
                    <Text style={styles.confirmRow}>日付: {dayjs(modalDate).format("M月D日 (ddd)")}</Text>
                    <Text style={styles.confirmRow}>従業員: {pickedEmployee?.name}</Text>
                    <Text style={styles.confirmRow}>業務: {pickedType}</Text>
                    <Text style={styles.confirmRow}>時間: {pickedStart} - {pickedEnd}</Text>
                  </View>
                  {saveError ? <ErrorBanner message={saveError} /> : null}
                  <View style={styles.modalActions}>
                    <PrimaryButton label="戻る" onPress={() => setStep("detail")} variant="secondary" disabled={saving} />
                    <PrimaryButton label={saving ? "保存中..." : "OK"} onPress={() => void handleSave()} disabled={saving} />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  toggleRow: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: "center"
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: "700", color: colors.subtext },
  toggleTextActive: { color: "#fff" },

  dateLabel: { fontSize: 16, fontWeight: "700", color: colors.text },

  /* week */
  weekNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekArrow: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  weekTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  weekDay: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, gap: spacing.xs },
  weekDayToday: { borderWidth: 2, borderColor: colors.primary },
  weekDayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekDayLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  weekDayLabelToday: { color: colors.primary },
  weekDayCount: { fontSize: 12, color: colors.subtext },
  weekShiftRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },

  /* shift rows */
  shiftRow: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, alignItems: "center" },
  shiftTime: { fontSize: 13, fontWeight: "700", color: colors.text, minWidth: 90 },
  shiftName: { fontSize: 14, color: colors.text, flex: 1 },
  shiftType: { fontSize: 12, color: colors.primary, fontWeight: "700" },

  /* modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalContent: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xl + spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  modalActions: { flexDirection: "row", gap: spacing.sm },

  fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.subtext, marginTop: spacing.xs },
  chipRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  pickItem: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  pickItemActive: { borderColor: colors.primary },
  pickItemText: { fontSize: 16, fontWeight: "700", color: colors.text },
  pickItemSub: { fontSize: 13, color: colors.subtext },

  confirmCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, gap: spacing.sm },
  confirmRow: { fontSize: 16, color: colors.text }
});
