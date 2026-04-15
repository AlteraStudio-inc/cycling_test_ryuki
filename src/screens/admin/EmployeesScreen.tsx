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

function formatError(message: string) {
  if (message.includes("foreign key") || message.includes("violates foreign key"))
    return "UIDが見つかりません。Supabase Authentication > Users の UID を入力してください。";
  if (message.includes("duplicate key") || message.includes("unique constraint"))
    return "このUIDまたは社員コードはすでに登録済みです。";
  if (message.includes("row-level security"))
    return "権限エラーです。管理者アカウントでログインし直してください。";
  return `操作に失敗しました: ${message}`;
}

export function EmployeesScreen() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = editingEmployee !== null;

  /* ─── Load via RPC ─── */
  const loadEmployees = useCallback(async (refresh = false) => {
    if (!supabase) { setIsLoading(false); return; }
    try {
      if (refresh) setIsRefreshing(true); else setIsLoading(true);
      const { data, error: err } = await supabase.rpc("admin_list_employees");
      if (err) { setError(`取得失敗: ${err.message}`); return; }
      setEmployees((data ?? []) as Profile[]);
      setError(null);
    } catch (e) {
      setError(`取得失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  /* ─── Modal helpers ─── */
  const handleAddPress = useCallback(() => {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalVisible(true);
  }, []);

  const handleEditPress = useCallback((emp: Profile) => {
    setEditingEmployee(emp);
    setForm({ userId: emp.id, name: emp.name, employeeCode: emp.employee_code ?? "", phone: emp.phone ?? "" });
    setFormError(null);
    setModalVisible(true);
  }, []);

  const handleChangeForm = useCallback((key: keyof EmployeeForm, value: string) => {
    setForm((cur) => ({ ...cur, [key]: value }));
  }, []);

  const closeModal = useCallback(() => { if (!isSaving) setModalVisible(false); }, [isSaving]);

  /* ─── Add via RPC ─── */
  const handleSubmitAdd = useCallback(async () => {
    if (!supabase) return;
    const userId = form.userId.trim();
    const name = form.name.trim();
    if (!UUID_REGEX.test(userId)) { setFormError("UIDは UUID 形式で入力してください。"); return; }
    if (!name) { setFormError("氏名は必須です。"); return; }

    setIsSaving(true);
    setFormError(null);
    try {
      const { data, error: err } = await supabase.rpc("admin_add_employee", {
        p_id: userId,
        p_name: name,
        p_employee_code: form.employeeCode.trim() || null,
        p_phone: form.phone.trim() || null
      });

      if (err) { setFormError(formatError(err.message)); return; }
      if (!data) { setFormError("追加に失敗しました（データなし）。"); return; }

      /* Reload list to get consistent state */
      await loadEmployees(true);
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setFormError(`追加に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setIsSaving(false);
    }
  }, [form, loadEmployees]);

  /* ─── Edit via RPC ─── */
  const handleSubmitEdit = useCallback(async () => {
    if (!supabase || !editingEmployee) return;
    const name = form.name.trim();
    if (!name) { setFormError("氏名は必須です。"); return; }

    setIsSaving(true);
    setFormError(null);
    try {
      const { error: err } = await supabase.rpc("admin_update_employee", {
        p_id: editingEmployee.id,
        p_name: name,
        p_employee_code: form.employeeCode.trim() || null,
        p_phone: form.phone.trim() || null
      });

      if (err) { setFormError(formatError(err.message)); return; }
      await loadEmployees(true);
      setModalVisible(false);
    } catch (e) {
      setFormError(`更新に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setIsSaving(false);
    }
  }, [form, editingEmployee, loadEmployees]);

  /* ─── Delete via RPC ─── */
  const deleteEmployee = useCallback(async (emp: Profile) => {
    if (!supabase) return;
    const { error: err } = await supabase.rpc("admin_delete_employee", { p_id: emp.id });
    if (err) { setError(`削除に失敗しました: ${err.message}`); return; }
    setEmployees((cur) => cur.filter((e) => e.id !== emp.id));
    setError(null);
  }, []);

  const handleEmployeePress = useCallback((emp: Profile) => {
    const confirmDelete = () => void deleteEmployee(emp);
    if (Platform.OS === "web") {
      const action = window.prompt(`${emp.name}\n社員コード: ${emp.employee_code || "未設定"}\n\n「edit」で編集、「delete」で削除`, "edit");
      if (action === "edit") handleEditPress(emp);
      else if (action === "delete") confirmDelete();
      return;
    }
    Alert.alert("従業員詳細", `${emp.name}\n社員コード: ${emp.employee_code || "未設定"}`, [
      { text: "閉じる", style: "cancel" },
      { text: "編集", onPress: () => handleEditPress(emp) },
      { text: "削除", style: "destructive", onPress: confirmDelete }
    ]);
  }, [deleteEmployee, handleEditPress]);

  if (isLoading) return <LoadingOverlay message="従業員を読み込んでいます..." />;

  return (
    <View style={styles.container}>
      <Header title="従業員" subtitle="カードをタップすると編集・削除できます" />
      <PrimaryButton label="従業員を追加" onPress={handleAddPress} />
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={employees}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadEmployees(true)} tintColor={colors.primary} />}
        renderItem={({ item }) => <EmployeeCard employee={item} onPress={() => handleEmployeePress(item)} />}
        ListEmptyComponent={<EmptyState title="従業員がまだいません" description="「従業員を追加」から登録できます。UIDは Authentication > Users の値を使ってください。" />}
      />

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{isEditMode ? "従業員を編集" : "従業員を追加"}</Text>
              {!isEditMode && (
                <Text style={styles.modalHint}>
                  先に Supabase の Authentication &gt; Users でユーザーを作成し、その UID を入力してください。
                </Text>
              )}
              {formError ? <ErrorBanner message={formError} /> : null}
              {!isEditMode && (
                <FormInput label="UID (必須)" value={form.userId} onChangeText={(v) => handleChangeForm("userId", v)} placeholder="例: 49131a3b-bae3-4fda-bebb-b1a1c3a051ee" />
              )}
              <FormInput label="氏名 (必須)" value={form.name} onChangeText={(v) => handleChangeForm("name", v)} placeholder="例: 山田 太郎" />
              <FormInput label="社員コード" value={form.employeeCode} onChangeText={(v) => handleChangeForm("employeeCode", v)} placeholder="例: E001" />
              <FormInput label="電話番号" value={form.phone} onChangeText={(v) => handleChangeForm("phone", v)} placeholder="例: 09012345678" />
              <View style={styles.modalActions}>
                <PrimaryButton label="キャンセル" onPress={closeModal} variant="secondary" disabled={isSaving} />
                <PrimaryButton
                  label={isSaving ? (isEditMode ? "保存中..." : "追加中...") : (isEditMode ? "保存する" : "追加する")}
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
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  list: { paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalContent: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xl + spacing.md },
  modalTitle: { fontSize: 24, fontWeight: "800", color: colors.text },
  modalHint: { color: colors.subtext, fontSize: 13, lineHeight: 20 },
  modalActions: { gap: spacing.sm, marginTop: spacing.sm }
});
