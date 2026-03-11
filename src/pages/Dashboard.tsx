import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, ClipboardCheck, School, ArrowUpLeft } from "lucide-react";
import { getDashboardStats, getClasses } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["dashboard_stats"], queryFn: getDashboardStats });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });

  const statCards = [
    { title: "إجمالي الطلاب", value: stats?.totalStudents || 0, icon: Users },
    { title: "المعلمين", value: stats?.totalTeachers || 0, icon: GraduationCap },
    { title: "الفصول", value: stats?.totalClasses || 0, icon: School },
    { title: "نسبة الحضور اليوم", value: stats?.attendance.rate ? `${stats.attendance.rate}%` : "—", icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">مرحباً {user?.full_name || ""}، إليك ملخص اليوم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-heading">{stat.title}</p>
                <p className="text-2xl font-bold font-heading mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Summary */}
      {stats && stats.attendance.total > 0 && (
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-heading font-semibold text-sm mb-3">ملخص حضور اليوم</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-heading text-success">{stats.attendance.present}</p>
              <p className="text-xs text-muted-foreground">حاضر</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-heading text-warning">{stats.attendance.late}</p>
              <p className="text-xs text-muted-foreground">متأخر</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-heading text-destructive">{stats.attendance.absent}</p>
              <p className="text-xs text-muted-foreground">غائب</p>
            </div>
          </div>
        </div>
      )}

      {/* Classes Overview */}
      <div className="bg-card rounded-lg border">
        <div className="px-5 py-4 border-b">
          <h2 className="font-heading font-semibold">الفصول الدراسية</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0">
          {classes.slice(0, 6).map((cls: any) => (
            <div key={cls.id} className="px-5 py-3 flex items-center justify-between border-b sm:border-b-0 sm:border-l last:border-l-0">
              <div>
                <p className="text-sm font-medium">{cls.name}</p>
                <p className="text-xs text-muted-foreground">{cls.track}</p>
              </div>
              <span className="badge-info">{cls.grade}</span>
            </div>
          ))}
        </div>
        {classes.length > 6 && (
          <div className="px-5 py-3 border-t text-center">
            <p className="text-xs text-muted-foreground">و {classes.length - 6} فصول أخرى</p>
          </div>
        )}
      </div>
    </div>
  );
}
