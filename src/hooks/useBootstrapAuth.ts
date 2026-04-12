import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useBootstrapAuth() {
  const { setSession, setProfile, setBootstrapping, setAuthError } = useAuthStore();

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setSession(null);
      setProfile(null);
      setBootstrapping(false);
      setAuthError("[SUPABASE_NOT_CONFIGURED]");
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
          const { data, error } = await client
            .from("profiles")
            .select("id, role, name, employee_code, phone, department, status")
            .eq("id", session.user.id)
            .maybeSingle();

          if (mounted) {
            setProfile(data ?? null);
            if (error) {
              setAuthError(`[PROFILE_FETCH_ERROR] ${error.code ?? error.message}`);
            } else if (!data) {
              setAuthError("[PROFILE_NOT_FOUND]");
            } else {
              setAuthError(null);
            }
          }
        } else {
          setAuthError(null);
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
          const { data, error } = await client
            .from("profiles")
            .select("id, role, name, employee_code, phone, department, status")
            .eq("id", session.user.id)
            .maybeSingle();

          setProfile(data ?? null);
          if (error) {
            setAuthError(`[PROFILE_FETCH_ERROR] ${error.code ?? error.message}`);
          } else if (!data) {
            setAuthError("[PROFILE_NOT_FOUND]");
          } else {
            setAuthError(null);
          }
        } else {
          setProfile(null);
          setAuthError(null);
        }

        setBootstrapping(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setAuthError, setBootstrapping, setProfile, setSession]);
}
