import React, { createContext, useContext, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/app";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setBootstrapping: (value: boolean) => void;
};

const AuthStoreContext = createContext<AuthState | null>(null);

export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);

  return (
    <AuthStoreContext.Provider
      value={{
        session,
        profile,
        isBootstrapping,
        setSession,
        setProfile,
        setBootstrapping
      }}
    >
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore() {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error("useAuthStore must be used within AuthStoreProvider");
  }
  return context;
}
