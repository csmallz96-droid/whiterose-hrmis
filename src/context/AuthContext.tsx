import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  employee: Employee | null;
  role: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  employee: null,
  role: "employee",
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadEmployee = async (u: User) => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("email", u.email ?? "")
      .single();
    if (data) {
      setEmployee(data);
      setRole(data.role ?? "employee");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadEmployee(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadEmployee(s.user);
      } else {
        setEmployee(null);
        setRole("employee");
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setEmployee(null);
    setRole("employee");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ session, user, employee, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
