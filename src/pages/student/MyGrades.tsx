import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getGradesByStudent } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Award } from "lucide-react";

const gradeLabel = (pct: number) => pct >= 90 ? "ممتاز" : pct >= 75 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "راسب";
const gradeColor = (pct: number) => pct >= 75 ? "text-success" : pct >= 60 ? "text-info" : pct >= 50 ? "text-warning" : "text-destructive";
const gradeBg = (pct: number) => pct >= 75 ? "badge-success" : pct >= 60 ? "badge-info" : pct >= 50 ? "badge-warning" : "badge-destructive";

export default function MyGrades() {
  const { user } = useAuth();
  const { data: grades = [], isLoading } = useQuery({ queryKey: ["my-grades", user?.id], queryFn: () => getGradesByStudent(user!.id), enabled: !!user });

  const bySubject: Record<string, any[]> = {};
  (grades as any[]).forEach(g => { const key = g.subjects?.name || "غير محدد"; if (!bySubject[key]) bySubject[key] = []; bySubject[key].push(g); });

  const subjectAverages = Object.entries(bySubject).map(([name, gs]) => ({
    name,
    avg: gs.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / gs.length
  }));

  const overallAvg = grades.length > 0 ? ((grades as any[]).reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / grades.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">درجاتي</h1></div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}

      {grades.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card text-center"><p className={`text-3xl font-bold font-heading ${gradeColor(Number(overallAvg))}`}>{overallAvg}%</p><p className="text-xs text-muted-foreground mt-1">المعدل العام</p></div>
            <div className="stat-card text-center"><p className="text-3xl font-bold font-heading text-primary">{grades.length}</p><p className="text-xs text-muted-foreground mt-1">درجة مسجلة</p></div>
            <div className="stat-card text-center"><p className="text-3xl font-bold font-heading text-info">{Object.keys(bySubject).length}</p><p className="text-xs text-muted-foreground mt-1">مادة</p></div>
          </div>

          {subjectAverages.length > 0 && (
            <div className="bg-card rounded-lg border p-5">
              <h2 className="font-heading font-semibold mb-4">المعدل لكل مادة</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/>
                  <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "المعدل"]}/>
                  <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="المعدل"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {Object.entries(bySubject).map(([subject, gs]) => {
            const avg = gs.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / gs.length;
            return (
              <div key={subject} className="bg-card rounded-lg border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-heading font-semibold">{subject}</h3>
                  <span className={`font-bold ${gradeColor(avg)}`}>{avg.toFixed(1)}%</span>
                </div>
                <table className="data-table">
                  <thead><tr><th>النوع</th><th>الفصل</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>التقدير</th></tr></thead>
                  <tbody>
                    {gs.map(g => {
                      const pct = (g.score / g.max_score) * 100;
                      return (
                        <tr key={g.id}>
                          <td>{g.grade_type}</td>
                          <td className="text-muted-foreground">{g.semester}</td>
                          <td className="font-semibold">{g.score}</td>
                          <td className="text-muted-foreground">{g.max_score}</td>
                          <td><span className={`font-bold ${gradeColor(pct)}`}>{pct.toFixed(1)}%</span></td>
                          <td><span className={`text-xs px-2 py-0.5 rounded-full ${gradeBg(pct)}`}>{gradeLabel(pct)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

      {!isLoading && grades.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-20"/><p>لا توجد درجات مسجلة بعد</p>
        </div>
      )}
    </div>
  );
}
