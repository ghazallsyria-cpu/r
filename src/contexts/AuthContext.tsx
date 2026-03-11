import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "teacher" | "student" | "parent";

interface User {
  id: string;
  full_name: string;
  national_id: string;
  role: UserRole;
  class_id: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (national_id: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("school_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("school_user"); }
    }
    setLoading(false);
  }, []);

  const login = async (national_id: string, password: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, national_id, role, class_id, password_hash")
      .eq("national_id", national_id)
      .maybeSingle();

    if (error) return { error: "حدث خطأ في الاتصال" };
    if (!data) return { error: "الرقم المدني غير مسجل" };
    if (data.password_hash !== password) return { error: "كلمة المرور غير صحيحة" };

    const userData: User = { id: data.id, full_name: data.full_name, national_id: data.national_id, role: data.role as UserRole, class_id: data.class_id };
    setUser(userData);
    localStorage.setItem("school_user", JSON.stringify(userData));
    return {};
  };

  const logout = () => { setUser(null); localStorage.removeItem("school_user"); };

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTeacher, isStudent, isParent }}>
      {children}
    </AuthContext.Provider>
  );
}
