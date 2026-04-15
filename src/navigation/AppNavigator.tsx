import React, { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { SplashScreen } from "@/screens/common/SplashScreen";
import { SettingsScreen } from "@/screens/common/SettingsScreen";
import { ProfileMissingScreen } from "@/screens/common/ProfileMissingScreen";
import { AdminHomeScreen } from "@/screens/admin/AdminHomeScreen";
import { EmployeesScreen } from "@/screens/admin/EmployeesScreen";
import { ShiftCalendarScreen } from "@/screens/admin/ShiftCalendarScreen";
import { AdminChatScreen } from "@/screens/admin/AdminChatScreen";
import { EmployeeHomeScreen } from "@/screens/employee/EmployeeHomeScreen";
import { MyShiftScreen } from "@/screens/employee/MyShiftScreen";
import { EmployeeChatScreen } from "@/screens/employee/EmployeeChatScreen";
import { AnnouncementsScreen } from "@/screens/employee/AnnouncementsScreen";
import { useBootstrapAuth } from "@/hooks/useBootstrapAuth";
import { getAppMode } from "@/hooks/useAppMode";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme/colors";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { spacing } from "@/theme/spacing";

const Tab = createBottomTabNavigator();

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10 }
      }}
    >
      <Tab.Screen
        name="Home"
        component={AdminHomeScreen}
        options={{ title: "ホーム", tabBarIcon: tabIcon("home") }}
      />
      <Tab.Screen
        name="Shifts"
        component={ShiftCalendarScreen}
        options={{ title: "シフト", tabBarIcon: tabIcon("calendar") }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesScreen}
        options={{ title: "従業員", tabBarIcon: tabIcon("people") }}
      />
      <Tab.Screen
        name="Chat"
        component={AdminChatScreen}
        options={{ title: "チャット", tabBarIcon: tabIcon("chatbubbles") }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "設定", tabBarIcon: tabIcon("settings") }}
      />
    </Tab.Navigator>
  );
}

function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10 }
      }}
    >
      <Tab.Screen
        name="EmployeeHome"
        component={EmployeeHomeScreen}
        options={{ title: "ホーム", tabBarIcon: tabIcon("home") }}
      />
      <Tab.Screen
        name="MyShift"
        component={MyShiftScreen}
        options={{ title: "シフト", tabBarIcon: tabIcon("calendar") }}
      />
      <Tab.Screen
        name="EmployeeChat"
        component={EmployeeChatScreen}
        options={{ title: "チャット", tabBarIcon: tabIcon("chatbubbles") }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ title: "お知らせ", tabBarIcon: tabIcon("notifications") }}
      />
      <Tab.Screen
        name="EmployeeSettings"
        component={SettingsScreen}
        options={{ title: "設定", tabBarIcon: tabIcon("settings") }}
      />
    </Tab.Navigator>
  );
}

/** Shown when a logged-in user's role doesn't match the URL mode */
function RoleMismatchScreen() {
  const appMode = useMemo(() => getAppMode(), []);
  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };
  return (
    <View style={mismatchStyles.container}>
      <ErrorBanner
        message={
          appMode === "admin"
            ? "このアカウントは管理者権限がありません。正しいアカウントでログインしてください。"
            : "このアカウントは従業員用ではありません。正しいURLからログインしてください。"
        }
      />
      <PrimaryButton label="ログアウト" onPress={handleLogout} variant="danger" />
    </View>
  );
}

const mismatchStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg
  }
});

export function AppNavigator() {
  useBootstrapAuth();
  const { isBootstrapping, session, profile, authError } = useAuthStore();
  const appMode = useMemo(() => getAppMode(), []);

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  /* Not logged in → show mode-specific login */
  if (!session) {
    return (
      <NavigationContainer>
        <LoginScreen mode={appMode} />
      </NavigationContainer>
    );
  }

  /* Logged in but no profile */
  if (!profile) {
    return (
      <NavigationContainer>
        <ProfileMissingScreen userId={session.user.id} errorCode={authError} />
      </NavigationContainer>
    );
  }

  /* Role doesn't match the URL mode → block access */
  if (profile.role !== appMode) {
    return (
      <NavigationContainer>
        <RoleMismatchScreen />
      </NavigationContainer>
    );
  }

  /* Authorized — show the correct tabs */
  return (
    <NavigationContainer>
      {appMode === "admin" ? <AdminTabs /> : <EmployeeTabs />}
    </NavigationContainer>
  );
}
