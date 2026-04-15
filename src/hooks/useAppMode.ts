import { Platform } from "react-native";
import type { Role } from "@/types/app";

export type AppMode = Role; // "admin" | "employee"

/**
 * Determine app mode from the URL path (web) or default to "employee" (native).
 * /admin/* → "admin"
 * everything else → "employee"
 */
export function getAppMode(): AppMode {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.pathname.startsWith("/admin") ? "admin" : "employee";
  }
  return "employee";
}
