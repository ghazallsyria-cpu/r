import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, getClasses, getSubjects, getTeacherClasses, getTeacherSubjects, assignTeacherClass, removeTeacherClass, assignTeacherSubject, removeTeacherSubject } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, BookOpen, GraduationCap, Save, RefreshCw, Eye, EyeOff, Copy } from "lucide-react";

// Auto-generate unique national ID for teachers: starts with "9" + 9 digits
function generateTeacherID() {
  const digits = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, "0");
  return `9${digits}`;
}

export default function TeachersPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    full_name: "", national_id: generateTeacherID(),
    password_hash: "123456", phone: "", notes: ""
  });

  const { data: teachers = [], isLoading } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", sel?.id], queryFn: () => getTeacherClasses(sel!.id), enabled: !!sel });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", sel?.id], queryFn: () => getTeacherSubjects(sel!.id), enabled: !!sel });

  const addMut = useMutation({
    mutationFn: () => addTeacher(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      setShowAdd(false);
      setForm({ full_name: "", national_id: generateTeacherID(), password_hash: "123456", phone: "", notes: "" });
      toast.success("تم إضافة المعلم");
    },
    onError: (e: any) => toast.error(e?.message?.includes("national_id") ? "الرقم المدني مكرر، أنشئ رقماً جديداً" : "خطأ في الإضافة")
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...u }: any) => updateTeacher(id, u),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(d); setIsEditing(false); toast.success("تم الحفظ"); }
  });
  const deleteMut = useMutation({ mutationFn: deleteTeacher, onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(null); toast.success("تم الحذف"); } });
  const assignClass = useMutation({ mutationFn: (cid: string) => assignTeacherClass(sel!.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }) });
  const removeClass = useMutation({ mutationFn: (cid: string) => removeTeacherClass(sel!.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }) });
  const assignSubj = useMutation({ mutationFn: (sid: string) => assignTeacherSubject(sel!.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }) });
  const removeSubj = useMutation({ mutationFn: (sid: string) => removeTeacherSubject(sel!.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }) });

  const assignedClassIds = new Set((tClasses as any[]).map((tc: any) => tc.class_id));
  const assignedSubjIds = new Set((tSubjects as any[]).map((ts: any) => ts.subject_id));

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`تم نسخ ${label}`));
  };

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">المعلمون</h1><p className="text-muted-foreground text-sm mt-1">{teachers.length} معلم</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>إضافة معلم</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-lg">إضافة معلم جديد</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>

              {/* Auto-generated ID */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">رقم الدخول (مُولَّد تلقائياً)</label>
                <div className="flex gap-2">
                  <input value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-background border rounded-lg text-sm font-mono" dir="ltr"/>
                  <button onClick={() => setForm({ ...form, national_id: generateTeacherID() })}
                    className="p-2.5 rounded-lg border hover:bg-accent text-muted-foreground" title="توليد رقم جديد">
                    <RefreshCw className="w-4 h-4"/>
                  </button>
                  <button onClick={() => copyToClipboard(form.national_id, "رقم الدخول")}
                    className="p-2.5 rounded-lg border hover:bg-accent text-muted-foreground" title="نسخ">
                    <Copy className="w-4 h-4"/>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">يستخدم المعلم هذا الرقم لتسجيل الدخول</p>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">كلمة المرور</label>
                <div className="flex gap-2">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-background border rounded-lg text-sm" dir="ltr"/>
                  <button onClick={() => setShowPass(!showPass)} className="p-2.5 rounded-lg border hover:bg-accent text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <input placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <textarea placeholder="ملاحظات إضافية" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm resize-none h-16"/>

              {/* Credentials preview */}
              <div className="bg-info/5 border border-info/20 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-info">بيانات دخول المعلم:</p>
                <p>رقم الدخول: <span className="font-mono font-bold">{form.national_id}</span></p>
                <p>كلمة المرور: <span className="font-bold">{form.password_hash}</span></p>
                <p className="text-muted-foreground">احتفظ بهذه البيانات لإرسالها للمعلم</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                <button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id || !form.password_hash}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                  <Save className="w-3.5 h-3.5"/>حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>المعلم</th><th>رقم الدخول</th><th>الجوال</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {(teachers as any[]).map((t: any) => (
              <tr key={t.id} onClick={() => setSel(t)}>
                <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-heading font-bold text-primary">{t.full_name[0]}</div><span className="font-medium">{t.full_name}</span></div></td>
                <td><span className="font-mono text-xs bg-accent px-2 py-0.5 rounded">{t.national_id}</span></td>
                <td className="text-muted-foreground">{t.phone || "—"}</td>
                <td onClick={ev => ev.stopPropagation()}>
                  <button onClick={() => deleteMut.mutate(t.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {!isLoading && teachers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد معلمون</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Teacher detail view
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">{sel.full_name[0]}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground font-mono">{sel.national_id}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsEditing(!isEditing); setEditData({ full_name: sel.full_name, national_id: sel.national_id, phone: sel.phone || "", notes: sel.notes || "", password_hash: "" }); }}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">{isEditing ? "إلغاء" : "تعديل"}</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Personal info / edit */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h3 className="font-heading font-semibold text-sm">تعديل البيانات</h3>
              <div><label className="text-xs text-muted-foreground">الاسم</label><input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1"/></div>
              <div>
                <label className="text-xs text-muted-foreground">رقم الدخول</label>
                <div className="flex gap-2 mt-1">
                  <input value={editData.national_id} onChange={e => setEditData({ ...editData, national_id: e.target.value })} className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm font-mono" dir="ltr"/>
                  <button onClick={() => setEditData({ ...editData, national_id: generateTeacherID() })} className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"><RefreshCw className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">كلمة مرور جديدة (اتركها فارغة للاحتفاظ بالقديمة)</label>
                <div className="flex gap-2 mt-1">
                  <input type={showPass?"text":"password"} value={editData.password_hash} onChange={e => setEditData({ ...editData, password_hash: e.target.value })} className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm" dir="ltr"/>
                  <button onClick={() => setShowPass(!showPass)} className="p-2 rounded-lg border hover:bg-accent text-muted-foreground">{showPass?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                </div>
              </div>
              <div><label className="text-xs text-muted-foreground">الجوال</label><input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1"/></div>
              <div><label className="text-xs text-muted-foreground">ملاحظات</label><textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1 resize-none h-16"/></div>
              <button onClick={() => updateMut.mutate({ id: sel.id, full_name: editData.full_name, national_id: editData.national_id, phone: editData.phone, notes: editData.notes, ...(editData.password_hash ? { password_hash: editData.password_hash } : {}) })}
                className="w-full py-2.5 text-sm rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2"><Save className="w-4 h-4"/>حفظ التغييرات</button>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h3 className="font-heading font-semibold text-sm">بيانات الحساب</h3>
              {[["الاسم", sel.full_name], ["الجوال", sel.phone || "غير محدد"], ["ملاحظات", sel.notes || "—"]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium mt-0.5">{v}</p></div>
              ))}
              <div className="bg-info/5 border border-info/20 rounded-lg p-3 text-xs space-y-1.5">
                <p className="font-semibold text-info">بيانات تسجيل الدخول:</p>
                <div className="flex items-center justify-between">
                  <p>رقم الدخول: <span className="font-mono font-bold">{sel.national_id}</span></p>
                  <button onClick={() => copyToClipboard(sel.national_id, "رقم الدخول")} className="p-1 rounded hover:bg-info/10"><Copy className="w-3 h-3 text-info"/></button>
                </div>
                <p className="text-muted-foreground">كلمة المرور: محددة من المدير</p>
              </div>
            </div>
          )}
        </div>

        {/* Classes */}
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary"/>الفصول المخصصة</h3>
          <select onChange={e => { if (e.target.value) assignClass.mutate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
            <option value="">+ إضافة فصل</option>
            {(classes as any[]).filter(c => !assignedClassIds.has(c.id)).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="space-y-2">
            {(tClasses as any[]).map((tc: any) => (
              <div key={tc.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                <span className="text-sm">{tc.classes?.name}</span>
                <button onClick={() => removeClass.mutate(tc.class_id)} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5"/></button>
              </div>
            ))}
            {tClasses.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لم يُخصص لأي فصل</p>}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-info"/>المواد الدراسية</h3>
          <select onChange={e => { if (e.target.value) assignSubj.mutate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
            <option value="">+ إضافة مادة</option>
            {(subjects as any[]).filter(s => !assignedSubjIds.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="space-y-2">
            {(tSubjects as any[]).map((ts: any) => (
              <div key={ts.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                <div><p className="text-sm">{ts.subjects?.name}</p><p className="text-xs text-muted-foreground font-mono">{ts.subjects?.code}</p></div>
                <button onClick={() => removeSubj.mutate(ts.subject_id)} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5"/></button>
              </div>
            ))}
            {tSubjects.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لم تُخصص له مواد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
