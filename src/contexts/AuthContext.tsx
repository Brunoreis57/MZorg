import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  logActivity: (action: string, entityType?: string, entityId?: string, description?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  logActivity: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string, email?: string) => {
    // Hardcoded admin
    if (email === "bruno.g.reis@gmail.com") {
        setIsAdmin(true);
        return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const logActivity = async (
    action: string,
    entityType?: string,
    entityId?: string,
    description?: string
  ) => {
    if (!user) return;
    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_email: user.email || "",
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      description: description || null,
    });
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => checkAdmin(newSession.user.id, newSession.user.email), 0);

          if (event === "SIGNED_IN") {
            // Log login activity
            setTimeout(async () => {
              await supabase.from("activity_log").insert({
                user_id: newSession.user.id,
                user_email: newSession.user.email || "",
                action: "login",
                description: "Usuário fez login no sistema",
              });
            }, 0);
          }
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // THEN get existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        checkAdmin(existingSession.user.id, existingSession.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut, logActivity }}>
      {children}
    </AuthContext.Provider>
  );
}
