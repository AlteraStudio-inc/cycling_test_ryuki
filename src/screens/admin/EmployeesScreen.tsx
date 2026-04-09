import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { EmployeeCard } from "@/components/EmployeeCard";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const mockEmployees = [
  {
    id: "1",
    role: "employee" as const,
    name: "田中 花子",
    employee_code: "E001",
    phone: "09000000000",
    department: "ホール",
    status: "active"
  }
];

export function EmployeesScreen() {
  return (
    <View style={styles.container}>
      <Header title="従業員" subtitle="追加・編集・削除は詳細画面から行います" />
      <PrimaryButton label="従業員を追加" onPress={() => undefined} />
      <FlatList
        contentContainerStyle={styles.list}
        data={mockEmployees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EmployeeCard employee={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  list: {
    paddingTop: spacing.lg,
    gap: spacing.md
  }
});
