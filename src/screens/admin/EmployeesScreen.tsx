import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { EmployeeCard } from "@/components/EmployeeCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FormInput } from "@/components/FormInput";
import { Header } from "@/components/Header";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PrimaryButton } from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const PROFILE_COLUMNS =
  "id, role, name, employee_code, phone, department, status";
const REQUEST_TIMEOUT_MS = 30000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EmployeeForm = {
  userId: string;
  name: string;
  employeeCode: string;
  phone: string;
};

const EMPTY_FORM: EmployeeForm = {
  userId: "",
  name: "",
  employeeCode: "",
  phone: ""
};

function formatMutationError(message: string) {
  if (message.includes("foreign key constraint")) {
    return "UIDが見つかりません。Supabase Authentication > Users の UID を入力してください。";
  }
  if (message.includes("duplicate key")) {
    return "このUIDまたは社員コードはすでに登録済みです。";
  }
  if (message.includes("row-level security")) {
    return "権限エラーです。管理者アカウントでログインし直してください。";
  }
  return `操作に失敗しました: ${message}`;
}

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), REQUEST_TIMEOUT_MS)
    )
  ]);
}

export function EmployeesScreen() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  /* Modal state — null = add mode, Profile = edit mode */
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = editingEmployee !== null;

  /* ─── Load employees ─── */
  const loadEmployees = useCallback(async (refresh = false) => {
    if (!supabase) {
      setEmployees([]);
      setError("Supabase設定を確認してください。");
      setIsTimedOut(false);
      setIsLoading(false);
      return;
    }

    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { data, error: fetchError } = await withTimeout(
        supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("role", "employee")
          .order("name", { ascending: true })
          .then((r) => ({
            data: (r.data ?? null) as Profile[] | null,
            error: r.error ? { message: r.error.message } : null
          }))
      );

      if (fetchError) {
        setEmployees([]);
        setError(`従業員の取得に失敗しました: ${fetchError.message}`);
        setIsTimedOut(false);
        return;
      }
      setEmployees(data ?? []);
      setError(null);
      setIsTimedOut(false);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unknown error";
      if (msg.includes("REQUEST_TIMEOUT")) {
        setEmployees([]);
        setError(null);
        setIsTimedOut(true);
      } else {
        setError(`従業員の取得に失敗しました: ${msg}`);
        setIsTimedOut(false);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  /* ─── Realtime subscription ─── */
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel("admin-employees")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: "role=eq.employee" },
        () => void loadEmployees(true)
      )
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [loadEmployees]);

  /* ─── Open add modal ─── */
  const handleAddPress = useCallback(() => {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalVisible(true);
  }, []);

  /* ─── Open edit modal ─── */
  const handleEditPress = useCallback((employee: Profile) => {
    setEditingEmployee(employee);
    setForm({
      userId: employee.id,
      name: employee.name,
      employeeCode: employee.employee_code ?? "",
      phone: employee.phone ?? ""
    });
    setFormError(null);
    setModalVisible(true);
  }, []);

  const handleChangeForm = useCallback(
    (key: keyof EmployeeForm, value: string) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const closeModal = useCallback(() => {
    if (isSaving) return;
    setModalVisible(false);
  }, [isSaving]);

  /* ─── Submit add ─── */
  const handleSubmitAdd = useCallback(async () => {
    if (!supabase) { setFormError("Supabase設定を確認してください。"); return; }

    const userId = form.userId.trim();
    const name = form.name.trim();
    if (!UUID_REGEX.test(userId)) { setFormError("UIDは UUID 形式で入力してください。"); return; }
    if (!name) { setFormError("氏名は必須です。"); return; }

    setIsSaving(true);
    setFormError(null);
    try {
      const { data, error: insertError } = await withTimeout(
        supabase
          .from("profiles")
          .insert({
            id: userId,
            role: "employee",
            name,
            employee_code: form.employeeCode.trim() || null,
            phone: form.phone.trim() || null,
            status: "active"
          })
          .select(PROFILE_COLUMNS)
          .single()
          .then((r) => ({
            data: (r.data ?? null) as Profile | null,
            error: r.error ? { message: r.error.message } : null
          }))
      );

      if (insertError) { setFormError(formatMutationError(insertError.message)); return; }
      if (!data) { setFormError("従業員の追加に失敗しました。"); return; }

      setEmployees((cur) => [...cur, data].sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
      setIsTimedOut(false);
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unknown error";
      setFormError(msg.includes("REQUEST_TIMEOUT") ? `追加処理がタイムアウトしました（30秒超過）。ネットワークを確認してください。 [${msg}]` : formatMutationError(msg));
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  /* ─── Submit edit ─── */
  const handleSubmitEdit = useCallback(async () => {
    if (!supabase || !editingEmployee) return;

    const name = form.name.trim();
    if (!name) { setFormError("氏名は必須です。"); return; }

    setIsSaving(true);
    setFormError(null);
    try {
      const { data, error: updateError } = await withTimeout(
        supabase
          .from("profiles")
          .update({
            name,
            employee_code: form.employeeCode.trim() || null,
            phone: form.phone.trim() || null
          })
          .eq("id", editingEmployee.id)
          .select(PROFILE_COLUMNS)
          .single()
          .then((r) => ({
            data: (r.data ?? null) as Profile | null,
            error: r.error ? { message: r.error.message } : null
          }))
      );

      if (updateError) { setFormError(formatMutationError(updateError.message)); return; }
      if (!data) { setFormError("従業員の更新に失敗しました。"); return; }

      setEmployees((cur) =>
        cur.map((e) => (e.id === data.id ? data : e)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setError(null);
      setModalVisible(false);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unknown error";
      setFormError(msg.includes("REQUEST_TIMEOUT") ? `更新処理がタイムアウトしました（30秒超過）。[${msg}]` : formatMutationError(msg));
    } finally {
      setIsSaving(false);
    }
  }, [form, editingEmployee]);

  /* ─── Delete ─── */
  const deleteEmployee = useCallback(async (employee: Profile) => {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", employee.id);

    if (deleteError) {
      setError(`削除に失敗しました: ${deleteError.message}`);
      return;
    }
    setEmployees((cur) => cur.filter((item) => item.id !== employee.id));
    setError(null);
  }, []);

  const handleEmployeePress = useCallback(
    (employee: Profile) => {
      const confirmDelete = () => void deleteEmployee(employee);

      if (Platform.OS === "web") {
        const action = window.prompt(
          `${employee.name}\n社員コード: ${employee.employee_code || "未設定"}\n\n「edit」で編集、「delete」で削除`,
          "edit"
        );
        if (action === "edit") handleEditPress(employee);
        else if (action === "delete") confirmDelete();
        return;
      }

      Alert.alert("従業員詳細", `${employee.name}\n社員コード: ${employee.employee_code || "未設定"}`, [
        { text: "閉じる", style: "cancel" },
        { text: "編集", onPress: () => handleEditPress(employee) },
        { text: "削除", style: "destructive", onPress: confirmDelete }
      ]);
    },
    [deleteEmployee, handleEditPress]
  );

  if (isLoading) {
    return <LoadingOverlay message="従業員を読み込んでいます..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="従業員" subtitle="カードをタップすると編集・削除できます" />
      <PrimaryButton label="従業員を追加" onPress={handleAddPress} />
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={employees}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadEmployees(true)}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <EmployeeCard employee={item} onPress={() => handleEmployeePress(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="従業員がまだいません"
            description={
              isTimedOut
                ? "通信が不安定です。画面を下に引っ張って再読み込みしてください。"
                : "「従業員を追加」から登録できます。UIDは Authentication > Users の値を使ってください。"
            }
          />
        }
      />

      {/* Add / Edit modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "従業員を編集" : "従業員を追加"}
              </Text>
              {!isEditMode && (
                <Text style={styles.modalHint}>
                  先に Supabase の Authentication &gt; Users でユーザーを作成し、その UID
                  を入力してください。
                </Text>
              )}
              {formError ? <ErrorBanner message={formError} /> : null}

              {!isEditMode && (
                <FormInput
                  label="UID (必須)"
                  value={form.userId}
                  onChangeText={(v) => handleChangeForm("userId", v)}
                  placeholder="例: 49131a3b-bae3-4fda-bebb-b1a1c3a051ee"
                />
              )}
              <FormInput
                label="氏名 (必須)"
                value={form.name}
                onChangeText={(v) => handleChangeForm("name", v)}
                placeholder="例: 山田 太郎"
              />
              <FormInput
                label="社員コード"
                value={form.employeeCode}
                onChangeText={(v) => handleChangeForm("employeeCode", v)}
                placeholder="例: E001"
              />
              <FormInput
                label="電話番号"
                value={form.phone}
                onChangeText={(v) => handleChangeForm("phone", v)}
                placeholder="例: 09012345678"
              />
              <View style={styles.modalActions}>
                <PrimaryButton
                  label="キャンセル"
                  onPress={closeModal}
                  variant="secondary"
                  disabled={isSaving}
                />
                <PrimaryButton
                  label={
                    isSaving
                      ? isEditMode ? "保存中..." : "追加中..."
                      : isEditMode ? "保存する" : "追加する"
                  }
                  onPress={() => void (isEditMode ? handleSubmitEdit() : handleSubmitAdd())}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md
  },
  list: {
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%"
  },
  modalContent: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl + spacing.md
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text
  },
  modalHint: {
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 20
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.sm
  }
});
