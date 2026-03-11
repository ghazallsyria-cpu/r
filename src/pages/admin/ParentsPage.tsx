import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParents, addParent, updateParent, deleteParent, getStudents, getParentChildren, linkParentToStudent, removeParentLink } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Save, Users, Link } from "lucide-react";

export default function ParentsPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [form, setForm] = useState({ full_name: "", national_id: "", password_hash: "123456", phone: "" });

  const { data: parents = [], isLoading } = useQuery({ queryKey: ["parents"], queryFn: getParents });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const { data: children = [] } = useQuery({ queryKey: ["parent-children", sel?.id], queryFn: () => getParentChildren(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addParent(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); setShowAdd(false); setForm({ full_name: "", national_id: "", password_hash: "123456", phone: "" }); toast.success("تم إنشاء الحساب"); }, onError: () => toast.error("خطأ") });
  const updateMut = useMutation({ mutationFn: ({ id, ...u }: any) => updateParent(id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["parents"] }); setSel(d); setIsEditing(false); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteParent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); setSel(null); toast.success("تم الحذف"); } });
  const linkMut = useMutation({ mutationFn: (sid: string) => linkParentToStudent(sel!.id, sid), onSuccess: () => { qc.invalidateQueries({ queryKey: ["parent-children", sel?.id] }); toast.success("تم ربط الطالب"); }, onError: () => toast.error("الطالب مرتبط بالفعل") });
  const unlinkMut = useMutation({ mutationFn: (sid: string) => removeParentLink(sel!.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-children", sel?.id] }) });

  const childIds = new Set((children as any[]).map((c: any) => c.student_id));

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">أولياء الأمور</h1><p className="text-muted-foreground text-sm mt-1">{parents.length} ولي أمر</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />إضافة ولي أمر</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">إنشاء حساب ولي أمر</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="الرقم المدني الوطنية *" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="كلمة المرور (افتراضي: 123456)" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <p className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">بعد إنشاء الحساب يمكنك ربطه بالطلاب من صفحة التفاصيل</p>
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-1"><Save className="w-3.5 h-3.5" />حفظ</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ولي الأمر</th><th>الرقم المدني</th><th>الجوال</th><th>الأبناء</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {(parents as any[]).map((p: any) => (
              <tr key={p.id} onClick={() => setSel(p)}>
                <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-xs font-bold text-warning">{p.full_name[0]}</div><span className="font-medium">{p.full_name}</span></div></td>
                <td className="text-muted-foreground font-mono text-xs">{p.national_id}</td>
                <td className="text-muted-foreground">{p.phone || "-"}</td>
                <td><span className="badge-info flex items-center gap-1 w-fit"><Users className="w-3 h-3" />-</span></td>
                <td onClick={ev => ev.stopPropagation()}><button onClick={() => deleteMut.mutate(p.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!isLoading && parents.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد أولياء أمور</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center font-heading font-bold text-warning">{sel.full_name[0]}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">ولي أمر • {sel.national_id}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsEditing(!isEditing); setEditData({ full_name: sel.full_name, phone: sel.phone || "", password_hash: "" }); }} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">{isEditing ? "إلغاء" : "تعديل البيانات"}</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">حذف الحساب</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isEditing ? (
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">تعديل البيانات</h3>
            <div><label className="text-xs text-muted-foreground">الاسم</label><input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">الجوال</label><input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">كلمة مرور جديدة (اتركها فارغة للاحتفاظ بالقديمة)</label><input type="password" value={editData.password_hash} onChange={e => setEditData({ ...editData, password_hash: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
            <button onClick={() => updateMut.mutate({ id: sel.id, full_name: editData.full_name, phone: editData.phone, ...(editData.password_hash ? { password_hash: editData.password_hash } : {}) })} className="w-full py-2.5 text-sm rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2"><Save className="w-4 h-4" />حفظ التغييرات</button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">البيانات الشخصية</h3>
            {[["الرقم المدني", sel.national_id], ["الجوال", sel.phone || "غير محدد"]].map(([k, v]) => (
              <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>
            ))}
            <div className="bg-info/5 border border-info/20 rounded-lg p-3 text-xs text-info">
              <p className="font-semibold mb-1">بيانات تسجيل الدخول:</p>
              <p>الرقم الوطني: {sel.national_id}</p>
              <p>كلمة المرور: الافتراضية (123456) أو المُحددة</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" />الأبناء المرتبطون ({children.length})</h3>
          <select onChange={e => { if (e.target.value) linkMut.mutate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
            <option value="">+ ربط طالب</option>
            {(students as any[]).filter(s => !childIds.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.full_name} — {s.classes?.name || "بدون فصل"}</option>)}
          </select>
          <div className="space-y-2">
            {(children as any[]).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.student?.full_name?.[0]}</div>
                  <div><p className="text-sm font-medium">{c.student?.full_name}</p><p className="text-xs text-muted-foreground">{c.student?.classes?.name || "بدون فصل"}</p></div>
                </div>
                <button onClick={() => unlinkMut.mutate(c.student_id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {children.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">لم يُربط بأي طالب بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
