import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, addClass, updateClass, deleteClass, getClassStats, getStudentsByClass, getTeachersByClass } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Users, GraduationCap, BarChart3, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

export default function ClassesPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", section: "أ", track: "عام" });

  const { data: classes = [], isLoading } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: stats } = useQuery({ queryKey: ["class-stats", sel?.id], queryFn: () => getClassStats(sel!.id), enabled: !!sel });
  const { data: students = [] } = useQuery({ queryKey: ["students-class", sel?.id], queryFn: () => getStudentsByClass(sel!.id), enabled: !!sel });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers-class", sel?.id], queryFn: () => getTeachersByClass(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addClass(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setShowAdd(false); setForm({ name: "", grade: "", section: "أ", track: "عام" }); toast.success("تم إضافة الفصل"); }, onError: () => toast.error("خطأ") });
  const deleteMut = useMutation({ mutationFn: deleteClass, onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setSel(null); toast.success("تم الحذف"); } });

  const gradeGroups: Record<string, any[]> = {};
  (classes as any[]).forEach(c => { if (!gradeGroups[c.grade]) gradeGroups[c.grade] = []; gradeGroups[c.grade].push(c); });

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الفصول الدراسية</h1><p className="text-muted-foreground text-sm mt-1">{classes.length} فصل دراسي</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />فصل جديد</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">إضافة فصل دراسي</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="اسم الفصل (مثال: أول أ)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="الصف (مثال: الأول الابتدائي)" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground block mb-1">الشعبة</label>
                  <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
                    {["أ","ب","ج","د","ه","و"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">المسار</label>
                  <select value={form.track} onChange={e => setForm({ ...form, track: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
                    {["عام","علمي","أدبي","مهني"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.name || !form.grade} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div> : (
        <div className="space-y-6">
          {Object.entries(gradeGroups).map(([grade, gradeClasses]) => (
            <div key={grade}>
              <h2 className="font-heading font-bold text-base mb-3 text-muted-foreground">{grade}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeClasses.map((c: any) => (
                  <div key={c.id} onClick={() => setSel(c)} className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-bold text-base">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">الشعبة {c.section} • {c.track}</p>
                        <p className="text-xs text-muted-foreground">{c.academic_year}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />طلاب</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />معلمون</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {classes.length === 0 && <div className="text-center py-12 text-muted-foreground">لا توجد فصول دراسية</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div><h2 className="font-heading font-bold text-lg">{sel.name}</h2><p className="text-xs text-muted-foreground">{sel.grade} • الشعبة {sel.section} • {sel.track}</p></div>
        </div>
        <button onClick={() => deleteMut.mutate(sel.id)} className="text-sm text-destructive border border-destructive/20 px-4 py-2 rounded-lg hover:bg-destructive/5">حذف الفصل</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card text-center"><p className="text-3xl font-bold text-primary font-heading">{stats?.studentCount ?? "..."}</p><p className="text-xs text-muted-foreground mt-1">طالب</p></div>
        <div className="stat-card text-center"><p className="text-3xl font-bold text-info font-heading">{stats?.teacherCount ?? "..."}</p><p className="text-xs text-muted-foreground mt-1">معلم</p></div>
        <div className="stat-card text-center"><p className="text-3xl font-bold text-success font-heading">{stats?.avgGrade ?? "..."}</p><p className="text-xs text-muted-foreground mt-1">متوسط الدرجات %</p></div>
        <div className="stat-card text-center"><p className="text-3xl font-bold text-warning font-heading">{stats?.attendanceRate ?? "..."}</p><p className="text-xs text-muted-foreground mt-1">نسبة الحضور %</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />الطلاب ({students.length})</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-heading font-bold text-primary">{s.full_name[0]}</div>
                <div><p className="text-sm font-medium">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.national_id}</p></div>
              </div>
            ))}
            {students.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">لا يوجد طلاب مسجلون</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-info" />المعلمون ({teachers.length})</h3>
          <div className="space-y-2">
            {teachers.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-xs font-heading font-bold text-info">{t.teacher?.full_name[0]}</div>
                <div><p className="text-sm font-medium">{t.teacher?.full_name}</p><p className="text-xs text-muted-foreground">{t.teacher?.phone || "لا يوجد رقم"}</p></div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">لا يوجد معلمون مخصصون</p>}
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" />إحصائيات الفصل</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-accent/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-heading text-success">{stats.avgGrade}%</div>
              <div className="text-xs text-muted-foreground mt-1">متوسط درجات الفصل</div>
              <div className="mt-2 h-2 bg-accent rounded-full overflow-hidden"><div className="h-full bg-success rounded-full transition-all" style={{ width: `${stats.avgGrade}%` }} /></div>
            </div>
            <div className="bg-accent/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-heading text-primary">{stats.attendanceRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">نسبة الحضور</div>
              <div className="mt-2 h-2 bg-accent rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.attendanceRate}%` }} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
