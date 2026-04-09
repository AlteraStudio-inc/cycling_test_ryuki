import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
};

export function ChatInput({ value, onChangeText, onSend }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="メッセージを入力"
        style={styles.input}
        multiline
        placeholderTextColor={colors.subtext}
      />
      <View style={styles.button}>
        <PrimaryButton label="送信" onPress={onSend} disabled={!value.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
    paddingTop: spacing.md
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15
  },
  button: {
    width: 88
  }
});
