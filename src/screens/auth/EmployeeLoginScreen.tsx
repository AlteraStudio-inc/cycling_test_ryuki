import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types/app";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type EmployeeListItem = {
  id: string;
  name: string;
  department: string | null;
  employee_code: string | null;
};

export function EmployeeLoginScreen() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmployeeListItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { setProfile } = useAuthStore();

  const loadEmployees = useCallback(async () => {
    if (!supabase) {
      setError("Supabase設定を確認してください。");
      setLoading(false);
      return;
    }
    try {
      const { data, error: rpcError } = await supabase.rpc("get_employee_list");
      if (rpcError) {
        setError(`従業員一覧の取得に失敗しました: ${rpcError.message}`);
      } else {
        setEmployees((data ?? []) as EmployeeListItem[]);
        setError(null);
      }
    } catch (e) {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const handleSelect = (emp: EmployeeListItem) => {
    setSelected(emp);
    setShowConfirm(true);
  };

  const handleConfirmLogin = async () => {
    if (!selected || !supabase) return;

    /* Fetch full profile via RPC */
    const { data, error: profileError } = await supabase.rpc("get_employee_profile", {
      p_employee_id: selected.id
    });

    if (profileError || !data || (data as any[]).length === 0) {
      setError("プロフィールの取得に失敗しました。");
      setShowConfirm(false);
      return;
    }

    const row = (data as any[])[0];
    const profile: Profile = {
      id: row.id,
      role: row.role,
      name: row.name,
      employee_code: row.employee_code,
      phone: row.phone,
      department: row.department,
      status: row.status
    };

    setProfile(profile);
    setShowConfirm(false);
  };

  if (loading) return <LoadingOverlay message="従業員リストを読み込んでいます..." />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Header title="従業員ログイン" subtitle="あなたの名前を選択してください" />

        {error ? <ErrorBanner message={error} /> : null}

        {employees.length === 0 ? (
          <EmptyState
            title="従業員が登録されていません"
            description="管理者に従業員登録を依頼してください。"
          />
        ) : (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
            {employees.map((emp) => (
              <Pressable
                key={emp.id}
                style={({ pressed }) => [
                  styles.employeeItem,
                  selected?.id === emp.id && styles.employeeItemSelected,
                  pressed && styles.employeeItemPressed
                ]}
                onPress={() => handleSelect(emp)}
              >
                <Text style={styles.employeeName}>{emp.name}</Text>
                {emp.employee_code ? (
                  <Text style={styles.employeeMeta}>{emp.employee_code}</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.confirmTitle}>ログイン確認</Text>
            <View style={styles.confirmProfile}>
              <Text style={styles.confirmName}>{selected?.name}</Text>
              <Text style={styles.confirmMeta}>
                社員コード: {selected?.employee_code ?? "未設定"}
              </Text>
              <Text style={styles.confirmMeta}>
                社員コード: {selected?.employee_code ?? "未設定"}
              </Text>
            </View>
            <Text style={styles.confirmMessage}>この従業員としてログインしますか？</Text>
            <View style={styles.confirmActions}>
              <PrimaryButton
                label="キャンセル"
                onPress={() => setShowConfirm(false)}
                variant="secondary"
              />
              <PrimaryButton label="OK" onPress={() => void handleConfirmLogin()} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg
  },
  listScroll: {
    flex: 1
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl
  },
  employeeItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: "transparent"
  },
  employeeItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  employeeItemPressed: {
    opacity: 0.75
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  employeeMeta: {
    fontSize: 14,
    color: colors.subtext
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.lg,
    width: "100%",
    maxWidth: 400
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center"
  },
  confirmProfile: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs
  },
  confirmName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  confirmMeta: {
    fontSize: 14,
    color: colors.subtext
  },
  confirmMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center"
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.sm
  }
});
