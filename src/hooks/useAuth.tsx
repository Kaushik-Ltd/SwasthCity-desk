import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "citizen" | "authority" | "admin";

export interface AuthState {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    roles: [],
    loading: true,
  });

  const loadRoles = useCallback(async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return (data?.map((r) => r.role as Role)) ?? [];
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const roles = data.session ? await loadRoles(data.session.user.id) : [];
      if (!mounted) return;
      setState({ session: data.session, user: data.session?.user ?? null, roles, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") return;
      const roles = session ? await loadRoles(session.user.id) : [];
      setState({ session, user: session?.user ?? null, roles, loading: false });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRoles]);

  return state;
}

export function primaryRole(roles: Role[]): Role {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("authority")) return "authority";
  return "citizen";
}
