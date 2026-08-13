import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "ADMIN" | "SUB_ADMIN" | "STUDENT";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

type AuthState = {
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const homeForRole = (role: AppRole | null): string =>
  role === "ADMIN" ? "/admin" : role === "SUB_ADMIN" ? "/subadmin" : "/student";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(userId: string | null) {
    if (!userId) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, status").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
    ]);
    setProfile((p.data as Profile) ?? null);
    setRole(((r.data?.role as AppRole) ?? null) as AppRole | null);
    setLoading(false);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(true);
      setTimeout(() => void load(newSession?.user.id ?? null), 0);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void load(data.session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      profile,
      role,
      loading,
      refresh: () => load(session?.user.id ?? null),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRole(null);
      },
    }),
    [session, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
