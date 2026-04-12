import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useBootstrapAuth() {
  const { setSession, setProfile, setBootstrapping } = useAuthStore();

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setSession(null);
      setProfile(null);
      setBootstrapping(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const {
          data: { session }
        } = await client.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(session);

        if (session?.user) {
          const { data } = await client
            .from("profiles")
            .select("id, role, name, employee_code, phone, department, status")
            .eq("id", session.user.id)
            .single();

          if (mounted) {
            setProfile(data ?? null);
          }
        }
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    };

    load();

    const { data: authListener } = client.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data } = await client
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
