import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, Calendar,
  BookOpen, FileText, Settings, LogOut, Menu, X, Bell,
  MessageSquare, ChevronLeft, UserCheck, UsersRound, PenTool,
  BarChart3, Eye, FolderOpen,
} from "lucide-react";

const adminNav = [
  { title: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { title: "الطلاب", icon: Users, path: "/students" },
  { title: "المعلمون", icon: UserCheck, path: "/teachers" },
  { title: "أولياء الأمور", icon: UsersRound, path: "/parents" },
  { title: "الفصول", icon: FolderOpen, path: "/classes" },
  { title: "المقررات", icon: BookOpen, path: "/courses" },
  { title: "الدرجات", icon: GraduationCap, path: "/grades" },
  { title: "الحضور والغياب", icon: ClipboardCheck, path: "/attendance" },
  { title: "الجدول الدراسي", icon: Calendar, path: "/schedule" },
  { title: "الدروس", icon: FileText, path: "/lessons" },
  { title: "الاختبارات", icon: PenTool, path: "/exams" },
  { title: "التقارير", icon: BarChart3, path: "/reports" },
  { title: "الرسائل", icon: MessageSquare, path: "/messages" },
  { title: "الإعدادات", icon: Settings, path: "/settings" },
];

const teacherNav = [
  { title: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { title: "فصولي", icon: FolderOpen, path: "/my-classes" },
  { title: "دروسي", icon: FileText, path: "/teacher-lessons" },
  { title: "اختباراتي", icon: PenTool, path: "/teacher-exams" },
  { title: "الدرجات", icon: GraduationCap, path: "/grades" },
  { title: "الحضور والغياب", icon: ClipboardCheck, path: "/attendance" },
  { title: "الطلاب", icon: Users, path: "/students" },
  { title: "الرسائل", icon: MessageSquare, path: "/messages" },
];

const studentNav = [
  { title: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { title: "جدولي الدراسي", icon: Calendar, path: "/my-schedule" },
  { title: "دروسي", icon: BookOpen, path: "/my-lessons" },
  { title: "اختباراتي", icon: PenTool, path: "/my-exams" },
  { title: "درجاتي", icon: GraduationCap, path: "/my-grades" },
  { title: "حضوري", icon: ClipboardCheck, path: "/my-attendance" },
  { title: "الرسائل", icon: MessageSquare, path: "/messages" },
];

const parentNav = [
  { title: "أبنائي ومتابعتهم", icon: LayoutDashboard, path: "/" },
  { title: "الرسائل", icon: MessageSquare, path: "/messages" },
];

function getNavItems(role: string) {
  switch (role) {
    case "admin": return adminNav;
    case "teacher": return teacherNav;
    case "student": return studentNav;
    case "parent": return parentNav;
    default: return adminNav;
  }
}

const roleLabelMap: Record<string, string> = {
  admin: "مدير النظام",
  teacher: "معلم",
  student: "طالب",
  parent: "ولي أمر",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getNavItems(user?.role || "admin");
  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const handleLogout = () => { logout(); navigate("/login"); };
  const roleLabel = roleLabelMap[user?.role || "admin"];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-heading font-bold text-base text-foreground leading-tight">مدرسة الرِّفعة</h1>
              <p className="text-xs text-muted-foreground">نظام إدارة متكامل</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={`nav-item ${isActive(item.path) ? "nav-item-active" : "nav-item-inactive"}`}
            title={collapsed ? item.title : undefined}>
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">
              {user?.full_name?.[0] || "م"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm" title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" dir="rtl">
      <aside className={`hidden lg:flex flex-col bg-card border-l border-sidebar-border transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[280px] bg-card shadow-xl animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
