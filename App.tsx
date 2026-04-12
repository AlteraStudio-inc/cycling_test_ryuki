import "react-native-gesture-handler";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNavigator } from "@/navigation/AppNavigator";
import { AuthStoreProvider } from "@/store/authStore";
import { colors } from "@/theme/colors";

const queryClient = new QueryClient();

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";

  const root = document.getElementById("root");
  if (root) {
    root.style.height = "100%";
    root.style.width = "100%";
    root.style.display = "flex";
    root.style.flex = "1";
  }
}

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message ?? "Unknown runtime error"
    };
  }

  override componentDidCatch(error: Error) {
    console.error("App runtime error:", error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Render failed on web</Text>
          <Text style={styles.errorMessage}>{this.state.message}</Text>
          <Text style={styles.errorHint}>
            Open browser DevTools Console and share the error message.
          </Text>
          <Text style={styles.errorHint}>
            Restart dev server and hard refresh with Ctrl + F5.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const rootStyle =
    Platform.OS === "web" ? [styles.root, styles.rootWeb] : styles.root;

  return (
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthStoreProvider>
            <StatusBar style="dark" />
            <AppErrorBoundary>
              <AppNavigator />
            </AppErrorBoundary>
          </AuthStoreProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  rootWeb: {
    height: "100%",
    width: "100%"
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.background
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center"
  },
  errorMessage: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center"
  },
  errorHint: {
    fontSize: 13,
    color: colors.subtext,
    textAlign: "center"
  }
});
