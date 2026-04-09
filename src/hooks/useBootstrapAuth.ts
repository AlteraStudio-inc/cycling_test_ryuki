import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useBootstrapAuth() {
  const { setSession, setProfile, setBootstrapping } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(session);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("id, role, name, employee_code, phone, department, status")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          setProfile(data ?? null);
        }
      }

      if (mounted) {
        setBootstrapping(false);
      }
    };

    load();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("id, role, name, employee_code, phone, department, status")
            .eq("id", session.user.id)
            .single();

          setProfile(data ?? null);
        } else {
          setProfile(null);
        }

        setBootstrapping(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setBootstrapping, setProfile, setSession]);
}
