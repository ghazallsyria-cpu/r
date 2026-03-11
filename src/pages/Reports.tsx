import { useQuery } from "@tanstack/react-query";
import { getReportStats } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, GraduationCap, BookOpen, FileText, TrendingUp, Award } from "lucide-react";

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444"];

export default function Reports() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["report-stats"], queryFn: getReportStats });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جارٍ تحميل التقارير...</div>;
  if (!stats) return null;

  const summaryCards = [
    { label: "الطلاب", value: stats.totalStudents, icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "المعلمون", value: stats.totalTeachers, icon: <GraduationCap className="w-5 h-5" />, color: "text-info", bg: "bg-info/10" },
    { label: "الفصول", value: stats.totalClasses, icon: <BookOpen className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
    { label: "المواد", value: stats.totalSubjects, icon: <FileText className="w-5 h-5" />, color: "text-warning", bg: "bg-warning/10" },
    { label: "متوسط الدرجات", value: `${stats.avgGrade}%`, icon: <Award className="w-5 h-5" />, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "نسبة الحضور", value: `${stats.attendanceRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة شاملة على أداء المدرسة في آخر 30 يوماً</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((c, i) => (
          <div key={i} className="stat-card text-center">
            <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center mx-auto mb-2 ${c.color}`}>{c.icon}</div>
            <p className={`text-2xl font-bold font-heading ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4">الحضور والغياب (آخر 14 يوم)</h2>
          {stats.attendanceByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="حاضر" fill="hsl(var(--success))" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="late" name="متأخر" fill="hsl(var(--warning))" radius={[0,0,0,0]} stackId="a" />
                <Bar dataKey="absent" name="غائب" fill="hsl(var(--destructive))" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات حضور بعد</div>}
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4">توزيع الدرجات</h2>
          {stats.gradeDistribution.some(g => g.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.gradeDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="count" label={({ range, count }) => count > 0 ? `${range}: ${count}` : ""}>
                  {stats.gradeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا توجد درجات مسجلة بعد</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-heading font-semibold">الدروس والاختبارات</h2>
          <div className="space-y-3">
            {[
              { label: "إجمالي الدروس", value: stats.totalLessons, sub: `${stats.publishedLessons} منشور`, color: "bg-primary" },
              { label: "إجمالي الاختبارات", value: stats.totalExams, sub: `${stats.publishedExams} منشور`, color: "bg-info" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span>{item.label}</span><span className="font-semibold">{item.value} <span className="text-xs text-muted-foreground">({item.sub})</span></span></div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: item.value > 0 ? `${(item.publishedLessons || item.publishedExams || 0) / item.value * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-heading font-semibold">ملخص الأداء</h2>
          <div className="space-y-3">
            {[
              { label: "نسبة الحضور الإجمالية", value: stats.attendanceRate, color: stats.attendanceRate >= 80 ? "bg-success" : stats.attendanceRate >= 60 ? "bg-warning" : "bg-destructive" },
              { label: "متوسط درجات الطلاب", value: stats.avgGrade, color: stats.avgGrade >= 75 ? "bg-success" : stats.avgGrade >= 60 ? "bg-warning" : "bg-destructive" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span>{item.label}</span><span className="font-bold">{item.value}%</span></div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-accent/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">ملاحظة:</p>
            <p>البيانات المعروضة مبنية على السجلات المتاحة في النظام خلال آخر 30 يوماً.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
