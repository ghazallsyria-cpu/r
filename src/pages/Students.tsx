import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherClasses, getStudents, addStudent, updateStudent, deleteStudent, getClasses, getGradesByStudent, getAttendanceByStudent } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Save, ChevronRight, BookOpen, Calendar } from "lucide-react";

const gradeLabel = (pct: number) => pct >= 90 ? "ممتاز" : pct >= 75 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "راسب";
const gradeColor = (pct: number) => pct >= 75 ? "text-success" : pct >= 60 ? "text-info" : pct >= 50 ? "text-warning" : "text-destructive";

export default function Students() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ full_name: "", national_id: "", class_id: "", password_hash: "123456" });

  const isTeacher = user?.role === "teacher";
  const { data: tClassesRaw = [] } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user && isTeacher });
  const teacherClassIds: Set<string> = new Set((tClassesRaw as any[]).map((tc:any) => tc.class_id));
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const visibleStudents = isTeacher ? (visibleStudents as any[]).filter(s => teacherClassIds.has(s.class_id)) : students;
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: grades = [] } = useQuery({ queryKey: ["grades-student", sel?.id], queryFn: () => getGradesByStudent(sel!.id), enabled: !!sel });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance-student", sel?.id], queryFn: () => getAttendanceByStudent(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addStudent(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); setShowAdd(false); setForm({ full_name: "", national_id: "", class_id: "", password_hash: "123456" }); toast.success("تمت إضافة الطالب"); }, onError: () => toast.error("خطأ") });
  const deleteMut = useMutation({ mutationFn: deleteStudent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); setSel(null); toast.success("تم الحذف"); } });

  const filtered = (visibleStudents as any[]).filter(s => (!filterClass || s.class_id === filterClass) && (!search || s.full_name.includes(search) || s.national_id.includes(search)));
  const classGroups: Record<string, any[]> = {};
  filtered.forEach(s => { const key = s.classes?.name || "بدون فصل"; if (!classGroups[key]) classGroups[key] = []; classGroups[key].push(s); });

  const present = (attendance as any[]).filter(a => a.status === "حاضر").length;
  const attRate = attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(0) : "0";
  const avgGrade = grades.length > 0 ? ((grades as any[]).reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / grades.length).toFixed(1) : "0";

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الطلاب</h1><p className="text-muted-foreground text-sm mt-1">{students.length} طالب</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />إضافة طالب</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">إضافة طالب</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="الرقم المدني *" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل الدراسي *</option>{(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input placeholder="كلمة المرور (افتراضي: 123456)" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id || !form.class_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-1"><Save className="w-3.5 h-3.5" />حفظ</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهوية..." className="px-4 py-2.5 bg-card border rounded-lg text-sm flex-1 max-w-xs" />
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل الفصول</option>{(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div> : (
        <div className="space-y-6">
          {Object.entries(classGroups).map(([className, classStudents]) => (
            <div key={className}>
              <h2 className="font-heading font-bold text-sm mb-3 text-muted-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{classStudents.length}</span>
                {className}
              </h2>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>#</th><th>الطالب</th><th>الرقم المدني</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {classStudents.map((s: any, i: number) => (
                      <tr key={s.id} onClick={() => setSel(s)}>
                        <td className="text-muted-foreground">{i + 1}</td>
                        <td><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.full_name[0]}</div><span className="font-medium">{s.full_name}</span></div></td>
                        <td className="text-muted-foreground font-mono text-xs">{s.national_id}</td>
                        <td onClick={ev => ev.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => setSel(s)} className="p-1.5 rounded text-muted-foreground hover:bg-accent"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={() => deleteMut.mutate(s.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {Object.keys(classGroups).length === 0 && <div className="text-center py-12 text-muted-foreground">لا يوجد طلاب</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">{sel.full_name[0]}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">{sel.classes?.name} • {sel.national_id}</p></div>
        </div>
        <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">حذف</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{avgGrade}%</p><p className="text-xs text-muted-foreground mt-1">متوسط الدرجات</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{attRate}%</p><p className="text-xs text-muted-foreground mt-1">نسبة الحضور</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{grades.length}</p><p className="text-xs text-muted-foreground mt-1">درجة مسجلة</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />الدرجات</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(grades as any[]).map((g: any) => {
              const pct = (g.score / g.max_score) * 100;
              return (
                <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                  <div><p className="text-sm font-medium">{g.subjects?.name}</p><p className="text-xs text-muted-foreground">{g.grade_type} • {g.semester}</p></div>
                  <div className="text-left"><p className={`font-bold text-sm ${gradeColor(pct)}`}>{g.score}/{g.max_score}</p><p className="text-xs text-muted-foreground">{gradeLabel(pct)}</p></div>
                </div>
              );
            })}
            {grades.length === 0 && <p className="text-xs text-center py-4 text-muted-foreground">لا توجد درجات مسجلة</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-info" />سجل الحضور (آخر 20 يوم)</h3>
          <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto">
            {(attendance as any[]).slice(0, 20).map((a: any) => (
              <div key={a.id} className={`p-1.5 rounded text-center text-xs ${a.status === "حاضر" ? "bg-success/10 text-success" : a.status === "غائب" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                <p className="font-semibold">{a.status === "حاضر" ? "✓" : a.status === "غائب" ? "✗" : "~"}</p>
                <p className="text-[10px]">{a.date.slice(5)}</p>
              </div>
            ))}
            {attendance.length === 0 && <p className="col-span-5 text-xs text-center py-4 text-muted-foreground">لا يوجد سجل حضور</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
