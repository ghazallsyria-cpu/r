import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubjects, addSubject, updateSubject, deleteSubject, getSubjectStats, getTeachersBySubject } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, BookOpen, Users, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Courses() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [form, setForm] = useState({ name: "", code: "" });

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: stats } = useQuery({ queryKey: ["subject-stats", sel?.id], queryFn: () => getSubjectStats(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addSubject(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setShowAdd(false); setForm({ name: "", code: "" }); toast.success("تمت الإضافة"); }, onError: () => toast.error("خطأ - قد يكون الرمز مكرراً") });
  const updateMut = useMutation({ mutationFn: ({ id, ...u }: any) => updateSubject(id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["subjects"] }); setSel(d); setIsEditing(false); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteSubject, onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setSel(null); toast.success("تم الحذف"); } });

  const pieData = stats ? [{ name: "ناجح", value: stats.passCount }, { name: "راسب", value: stats.failCount }] : [];

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">المقررات الدراسية</h1><p className="text-muted-foreground text-sm mt-1">{subjects.length} مادة دراسية</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />مادة جديدة</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">إضافة مادة دراسية</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="اسم المادة *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="رمز المادة * (مثال: MATH101)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.name || !form.code} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="col-span-3 text-center py-12 text-muted-foreground">جارٍ التحميل...</div>}
        {(subjects as any[]).map((s: any) => (
          <div key={s.id} onClick={() => setSel(s)} className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div><h3 className="font-heading font-bold">{s.name}</h3><p className="text-xs text-muted-foreground font-mono mt-1">{s.code}</p></div>
              <BookOpen className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
            </div>
            <button onClick={ev => { ev.stopPropagation(); deleteMut.mutate(s.id); }} className="mt-3 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:underline">حذف</button>
          </div>
        ))}
        {!isLoading && subjects.length === 0 && <div className="col-span-3 text-center py-12 text-muted-foreground">لا توجد مواد دراسية</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div><h2 className="font-heading font-bold">{sel.name}</h2><p className="text-xs text-muted-foreground font-mono">{sel.code}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsEditing(!isEditing); setEditData({ name: sel.name, code: sel.code }); }} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">{isEditing ? "إلغاء" : "تعديل"}</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm">تعديل المادة</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">اسم المادة</label><input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">الرمز</label><input value={editData.code} onChange={e => setEditData({ ...editData, code: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1 font-mono" /></div>
          </div>
          <button onClick={() => updateMut.mutate({ id: sel.id, ...editData })} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" />حفظ</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["الطلاب", stats?.totalStudents ?? "...", "text-primary"], ["ناجح", stats?.passCount ?? "...", "text-success"], ["راسب", stats?.failCount ?? "...", "text-destructive"], ["متوسط الدرجات", stats ? `${stats.avgGrade}%` : "...", "text-info"]].map(([l, v, c]) => (
          <div key={l as string} className="stat-card text-center"><p className={`text-2xl font-bold font-heading ${c}`}>{v}</p><p className="text-xs text-muted-foreground mt-1">{l}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats && (
          <>
            {stats.failCount + stats.passCount > 0 && (
              <div className="bg-card rounded-lg border p-5">
                <h3 className="font-heading font-semibold text-sm mb-4">نسبة النجاح والرسوب</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="hsl(var(--success))" /><Cell fill="hsl(var(--destructive))" />
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-card rounded-lg border p-5">
              <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-info" />معلمو المادة ({stats.teachers.length})</h3>
              <div className="space-y-2">
                {stats.teachers.map((t: any) => (
                  <div key={t.teacher_id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-xs font-heading font-bold text-info">{t.teacher?.full_name?.[0]}</div>
                    <p className="text-sm font-medium">{t.teacher?.full_name}</p>
                  </div>
                ))}
                {stats.teachers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا يوجد معلمون مخصصون لهذه المادة</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
