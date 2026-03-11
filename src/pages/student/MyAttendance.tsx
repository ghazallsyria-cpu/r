import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAttendanceStatsByStudent } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";

export default function MyAttendance() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["att-stats", user?.id],
    queryFn: () => getAttendanceStatsByStudent(user!.id),
    enabled: !!user
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>;

  const attRate = Number(stats?.rate || 0);
  const rateColor = attRate >= 80 ? "text-success" : attRate >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">سجل حضوري</h1>
        <p className="text-muted-foreground text-sm mt-1">تابع نسبة حضورك وغيابك</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["نسبة الحضور", `${stats?.rate || 0}%`, rateColor],
          ["حاضر", stats?.present || 0, "text-success"],
          ["غائب", stats?.absent || 0, "text-destructive"],
          ["متأخر", stats?.late || 0, "text-warning"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="bg-card rounded-xl border p-4 text-center">
            <p className={`text-2xl font-bold font-heading ${c}`}>{v}</p>
            <p className="text-xs text-muted-foreground mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate bar */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading font-semibold">نسبة الحضور الإجمالية</span>
          <span className={`font-bold font-heading ${rateColor}`}>{stats?.rate || 0}%</span>
        </div>
        <div className="h-3 bg-accent rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${attRate >= 80 ? "bg-success" : attRate >= 60 ? "bg-warning" : "bg-destructive"}`}
            style={{ width: `${stats?.rate || 0}%` }} />
        </div>
        <p className={`text-xs mt-2 ${attRate < 75 ? "text-destructive" : "text-muted-foreground"}`}>
          {attRate < 75 ? "⚠️ نسبة الحضور أقل من 75% — انتبه!" : "✓ نسبة الحضور جيدة"}
        </p>
      </div>

      {/* Per-subject */}
      {stats && stats.bySubject.length > 0 && (
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />الحضور لكل مادة
          </h2>
          <div className="space-y-3">
            {stats.bySubject.map((s: any) => {
              const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="text-success">{s.present} ✓</span>
                      {s.absent > 0 && <span className="text-destructive">{s.absent} ✗</span>}
                      {s.late > 0 && <span className="text-warning">{s.late} ~</span>}
                      <span className={`font-bold ${pct >= 80 ? "text-success" : pct >= 60 ? "text-warning" : "text-destructive"}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent records */}
      {stats && stats.records.length > 0 && (
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />آخر السجلات
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {stats.records.slice(0, 35).map((r: any) => (
              <div key={r.id} className={`p-2 rounded-lg text-center text-xs border ${r.status === "حاضر" ? "bg-success/10 border-success/20 text-success" : r.status === "غائب" ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-warning/10 border-warning/20 text-warning"}`}>
                <p className="text-base font-bold">{r.status === "حاضر" ? "✓" : r.status === "غائب" ? "✗" : "~"}</p>
                <p className="text-[10px] mt-0.5">{r.date?.slice(5)}</p>
                {r.period_number && <p className="text-[9px] opacity-70">ح{r.period_number}</p>}
                {r.subjects && <p className="text-[9px] opacity-70 truncate">{r.subjects.name}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!stats || stats.total === 0) && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد سجلات حضور بعد</p>
        </div>
      )}
    </div>
  );
}
