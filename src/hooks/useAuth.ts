import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  fullName: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", s.user.id)
            .eq("role", "admin")
            .maybeSingle()
            .then(({ data }) => setIsAdmin(!!data));
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle()
          .then(({ data }) => { setIsAdmin(!!data); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fullName =
    (session?.user?.user_metadata?.full_name as string | undefined) ??
    (session?.user?.user_metadata?.name as string | undefined) ??
    session?.user?.email?.split("@")[0] ??
    null;

  return { session, user: session?.user ?? null, isAdmin, fullName, loading };
}
