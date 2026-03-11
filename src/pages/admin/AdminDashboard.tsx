import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api";
import { Users, GraduationCap, School, CheckCircle, XCircle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats, refetchInterval: 60000 });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>;
  if (!stats) return null;

  const { totalStudents, totalTeachers, totalClasses, attendance } = stats;
  const attData = [
    { name: "حاضر", value: attendance.present },
    { name: "غائب", value: attendance.absent },
    { name: "متأخر", value: attendance.late },
  ].filter(d => d.value > 0);
  const attColors = ["hsl(var(--success))","hsl(var(--destructive))","hsl(var(--warning))"];

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">لوحة التحكم</h1><p className="text-muted-foreground text-sm mt-1">نظرة عامة على المدرسة</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: totalStudents, icon: <Users className="w-5 h-5"/>, color: "text-primary", bg: "bg-primary/10" },
          { label: "المعلمون", value: totalTeachers, icon: <GraduationCap className="w-5 h-5"/>, color: "text-info", bg: "bg-info/10" },
          { label: "الفصول", value: totalClasses, icon: <School className="w-5 h-5"/>, color: "text-success", bg: "bg-success/10" },
          { label: "نسبة الحضور اليوم", value: `${attendance.rate}%`, icon: <CheckCircle className="w-5 h-5"/>, color: Number(attendance.rate)>=80?"text-success":Number(attendance.rate)>=60?"text-warning":"text-destructive", bg: "bg-accent" },
        ].map((c,i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.color} shrink-0`}>{c.icon}</div>
            <div><p className={`text-2xl font-bold font-heading ${c.color}`}>{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4">الحضور اليوم</h2>
          {attendance.total > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[["حاضر", attendance.present, "text-success", <CheckCircle className="w-4 h-4"/>], ["غائب", attendance.absent, "text-destructive", <XCircle className="w-4 h-4"/>], ["متأخر", attendance.late, "text-warning", <Clock className="w-4 h-4"/>]].map(([l,v,c,icon])=>(
                  <div key={l as string} className="text-center p-3 rounded-lg bg-accent/30">
                    <div className={`flex items-center justify-center gap-1 mb-1 ${c}`}>{icon as any}</div>
                    <p className={`text-xl font-bold font-heading ${c}`}>{v as number}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={attData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                  {attData.map((_,i)=><Cell key={i} fill={attColors[i]}/>)}
                </Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20"/>
              <p className="text-sm">لم يتم تسجيل الحضور اليوم بعد</p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4">روابط سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "تسجيل حضور اليوم", href: "/attendance", color: "bg-primary/10 text-primary" },
              { label: "إضافة طالب جديد", href: "/students", color: "bg-success/10 text-success" },
              { label: "إنشاء اختبار", href: "/exams", color: "bg-info/10 text-info" },
              { label: "إضافة درس جديد", href: "/lessons", color: "bg-warning/10 text-warning" },
              { label: "عرض التقارير", href: "/reports", color: "bg-destructive/10 text-destructive" },
              { label: "إرسال رسالة", href: "/messages", color: "bg-primary/10 text-primary" },
            ].map((link, i) => (
              <a key={i} href={link.href} className={`${link.color} rounded-lg p-3 text-sm font-heading font-medium hover:opacity-80 transition-opacity text-center`}>{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
