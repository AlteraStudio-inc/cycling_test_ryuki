import React, { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { EmployeeLoginScreen } from "@/screens/auth/EmployeeLoginScreen";
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
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIconStyle: { marginBottom: -2 }
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
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIconStyle: { marginBottom: -2 }
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

/* ─── Admin flow: uses Supabase auth ─── */
function AdminApp() {
  useBootstrapAuth();
  const { isBootstrapping, session, profile, authError } = useAuthStore();

  if (isBootstrapping) return <SplashScreen />;

  if (!session) {
    return (
      <NavigationContainer>
        <LoginScreen mode="admin" />
      </NavigationContainer>
    );
  }

  if (!profile) {
    return (
      <NavigationContainer>
        <ProfileMissingScreen userId={session.user.id} errorCode={authError} />
      </NavigationContainer>
    );
  }

  if (profile.role !== "admin") {
    return (
      <NavigationContainer>
        <LoginScreen mode="admin" />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <AdminTabs />
    </NavigationContainer>
  );
}

/* ─── Employee flow: name select, no Supabase auth ─── */
function EmployeeApp() {
  const { profile } = useAuthStore();

  if (!profile || profile.role !== "employee") {
    return (
      <NavigationContainer>
        <EmployeeLoginScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <EmployeeTabs />
    </NavigationContainer>
  );
}

export function AppNavigator() {
  const appMode = useMemo(() => getAppMode(), []);
  return appMode === "admin" ? <AdminApp /> : <EmployeeApp />;
}
