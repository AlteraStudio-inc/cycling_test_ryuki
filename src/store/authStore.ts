import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { Profile } from "@/types/app";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setBootstrapping: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isBootstrapping: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setBootstrapping: (isBootstrapping) => set({ isBootstrapping })
}));
