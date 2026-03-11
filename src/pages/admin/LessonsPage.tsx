import { LatexContent, LATEX_SNIPPETS } from "@/components/LatexContent";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLessons, addLesson, updateLesson, deleteLesson, getSubjects, getClasses, getTeachers, getLessonFiles, addLessonFile, deleteLessonFile, getTeacherClasses, getTeacherSubjects } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, Send, Link, Image, FileText, Bold, Italic, List, ChevronDown } from "lucide-react";

export default function LessonsPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [form, setForm] = useState({ title: "", subject_id: "", class_id: "", teacher_id: "", lesson_order: 1, content: "", is_published: false });
  const [fileForm, setFileForm] = useState({ file_name: "", file_url: "", file_type: "رابط" });
  const [showFile, setShowFile] = useState(false);

  const isTeacher = user?.role === "teacher";
  const { data: lessons = [], isLoading } = useQuery({ queryKey: ["lessons"], queryFn: () => getLessons() });
  const { data: allSubjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: allClasses = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user && isTeacher });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", user?.id], queryFn: () => getTeacherSubjects(user!.id), enabled: !!user && isTeacher });
  const assignedClassIds = new Set((tClasses as any[]).map((tc:any) => tc.class_id));
  const assignedSubjIds = new Set((tSubjects as any[]).map((ts:any) => ts.subject_id));
  const classes = isTeacher ? (allClasses as any[]).filter(c => assignedClassIds.has(c.id)) : allClasses;
  const subjects = isTeacher ? (allSubjects as any[]).filter(s => assignedSubjIds.has(s.id)) : allSubjects;
  // Teacher sees only their own lessons
  const visibleLessons = isTeacher ? (visibleLessons as any[]).filter(l => !l.teacher_id || l.teacher_id === user?.id) : lessons;
  const { data: files = [] } = useQuery({ queryKey: ["lesson-files", sel?.id], queryFn: () => getLessonFiles(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addLesson(form), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["lessons"] }); setShowAdd(false); setSel(d); toast.success("تم إنشاء الدرس"); }, onError: () => toast.error("خطأ") });
  const updateMut = useMutation({ mutationFn: ({ id, ...u }: any) => updateLesson(id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["lessons"] }); setSel(d); toast.success("تم الحفظ"); }, onError: () => toast.error("خطأ في الحفظ") });
  const deleteMut = useMutation({ mutationFn: deleteLesson, onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); setSel(null); toast.success("تم الحذف"); } });
  const addFileMut = useMutation({ mutationFn: () => addLessonFile({ lesson_id: sel!.id, ...fileForm }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["lesson-files", sel?.id] }); setShowFile(false); setFileForm({ file_name: "", file_url: "", file_type: "رابط" }); toast.success("تمت الإضافة"); } });
  const delFileMut = useMutation({ mutationFn: deleteLessonFile, onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-files", sel?.id] }) });
  const togglePub = useMutation({ mutationFn: (l: any) => updateLesson(l.id, { is_published: !l.is_published }), onSuccess: (d, l) => { qc.invalidateQueries({ queryKey: ["lessons"] }); if (sel?.id === l.id) setSel({ ...sel, is_published: !sel.is_published }); toast.success(l.is_published ? "تم إلغاء النشر" : "تم النشر للطلاب"); } });

  const filtered = lessons.filter((l: any) => (!filterClass || l.class_id === filterClass) && (!filterSubject || l.subject_id === filterSubject));

  const insertFormat = (tag: string) => {
    const ta = document.getElementById("lesson-content") as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel_text = ta.value.slice(s, e);
    let ins = "";
    if (tag === "bold") ins = `**${sel_text || "نص غامق"}**`;
    else if (tag === "italic") ins = `_${sel_text || "نص مائل"}_`;
    else if (tag === "list") ins = `\n- ${sel_text || "عنصر القائمة"}`;
    else if (tag === "link") ins = `[${sel_text || "نص الرابط"}](https://example.com)`;
    else if (tag === "h2") ins = `\n## ${sel_text || "عنوان"}\n`;
    else if (tag === "h3") ins = `\n### ${sel_text || "عنوان فرعي"}\n`;
    else if (tag.startsWith("latex:")) ins = `\n${tag.slice(6)}\n`;
    const newContent = ta.value.slice(0, s) + ins + ta.value.slice(e);
    if (sel) setSel({ ...sel, content: newContent });
    else setForm({ ...form, content: newContent });
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length; }, 10);
  };



  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الدروس</h1><p className="text-muted-foreground text-sm mt-1">{lessons.length} درس</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />درس جديد</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">درس جديد</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="عنوان الدرس *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة *</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل *</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المعلم *</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
              <div className="flex items-center gap-2"><label className="text-xs text-muted-foreground">ترتيب الدرس:</label><input type="number" min="1" value={form.lesson_order} onChange={e => setForm({ ...form, lesson_order: +e.target.value })} className="w-20 px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.title || !form.subject_id || !form.class_id || !form.teacher_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إنشاء</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل الفصول</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل المواد</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="col-span-3 text-center py-12 text-muted-foreground">جارٍ التحميل...</div>}
        {filtered.map((l: any) => (
          <div key={l.id} onClick={() => setSel(l)} className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center shrink-0">{l.lesson_order}</span>
                  <h3 className="font-heading font-semibold text-sm truncate">{l.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{l.subjects?.name} • {l.classes?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{l.teacher?.full_name}</p>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${l.is_published ? "badge-success" : "badge-warning"}`}>{l.is_published ? "منشور" : "مسودة"}</span>
            </div>
            {l.content && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{l.content.replace(/[#*_\[\]()]/g, "").slice(0, 80)}...</p>}
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={ev => ev.stopPropagation()}>
              <button onClick={() => togglePub.mutate(l)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${l.is_published ? "text-warning border-warning/20 hover:bg-warning/10" : "text-success border-success/20 hover:bg-success/10"}`}>{l.is_published ? "إلغاء النشر" : "نشر"}</button>
              <button onClick={() => deleteMut.mutate(l.id)} className="text-xs px-3 py-1 rounded-lg border text-destructive border-destructive/20 hover:bg-destructive/10">حذف</button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <div className="col-span-3 text-center py-12 text-muted-foreground">لا توجد دروس</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • {sel.classes?.name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => updateMut.mutate({ id: sel.id, title: sel.title, content: sel.content })} className="px-4 py-2 rounded-lg bg-info text-white text-sm font-heading hover:bg-info/90">حفظ التغييرات</button>
          <button onClick={() => togglePub.mutate(sel)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium ${sel.is_published ? "bg-warning/10 text-warning border border-warning/20" : "bg-success text-white hover:bg-success/90"}`}>
            {sel.is_published ? <><EyeOff className="w-4 h-4" />إلغاء النشر</> : <><Send className="w-4 h-4" />نشر للطلاب</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2 border-b bg-accent/30 flex-wrap">
              <span className="text-xs text-muted-foreground ml-2">تنسيق:</span>
              {[["bold", "غامق", <Bold className="w-3.5 h-3.5" />], ["italic", "مائل", <Italic className="w-3.5 h-3.5" />], ["h2", "عنوان", <span className="text-xs font-bold">H2</span>], ["h3", "فرعي", <span className="text-xs">H3</span>], ["list", "قائمة", <List className="w-3.5 h-3.5" />], ["link", "رابط", <Link className="w-3.5 h-3.5" />]].map(([t, label, icon]) => (
                <button key={t as string} onClick={() => insertFormat(t as string)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-accent border border-transparent hover:border-border transition-colors text-muted-foreground" title={label as string}>{icon as any}</button>
              ))}
              <div className="h-4 w-px bg-border mx-1" />
              <span className="text-xs text-muted-foreground">LaTeX + Markdown</span>
              <div className="h-4 w-px bg-border mx-1" />
              {LATEX_SNIPPETS.slice(0,5).map(s => (
                <button key={s.label} onClick={() => insertFormat("latex:"+s.insert)} className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-accent text-muted-foreground" title={s.label}>{s.label}</button>
              ))}
            </div>
            <input value={sel.title} onChange={e => setSel({ ...sel, title: e.target.value })} className="w-full px-4 py-3 border-b bg-background text-lg font-heading font-bold focus:outline-none" placeholder="عنوان الدرس" />
            <textarea id="lesson-content" value={sel.content || ""} onChange={e => setSel({ ...sel, content: e.target.value })} className="w-full px-4 py-4 bg-background text-sm resize-none h-80 focus:outline-none leading-7" placeholder="اكتب محتوى الدرس هنا...&#10;&#10;## عنوان رئيسي&#10;### عنوان فرعي&#10;**نص غامق** _نص مائل_&#10;- عنصر قائمة&#10;[نص الرابط](https://example.com)" />
          </div>

          {sel.content && (
            <div className="bg-card rounded-lg border p-5">
              <h3 className="font-heading font-semibold text-sm mb-3 text-muted-foreground">معاينة المحتوى</h3>
              <LatexContent content={sel.content} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">المرفقات والروابط</h3>
            {files.map((f: any) => (
              <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 group">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{f.file_name}</p><p className="text-xs text-muted-foreground">{f.file_type}</p></div>
                <a href={f.file_url} target="_blank" className="p-1 rounded hover:bg-accent"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></a>
                <button onClick={() => delFileMut.mutate(f.id)} className="p-1 rounded text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {showFile ? (
              <div className="space-y-2 pt-2 border-t">
                <input placeholder="اسم الملف/الرابط *" value={fileForm.file_name} onChange={e => setFileForm({ ...fileForm, file_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded text-xs" />
                <input placeholder="الرابط URL *" value={fileForm.file_url} onChange={e => setFileForm({ ...fileForm, file_url: e.target.value })} className="w-full px-3 py-2 bg-background border rounded text-xs" />
                <select value={fileForm.file_type} onChange={e => setFileForm({ ...fileForm, file_type: e.target.value })} className="w-full px-3 py-2 bg-background border rounded text-xs">
                  {["رابط", "PDF", "صورة", "فيديو", "ملف"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-2"><button onClick={() => setShowFile(false)} className="flex-1 py-1.5 text-xs rounded border hover:bg-accent">إلغاء</button><button onClick={() => addFileMut.mutate()} disabled={!fileForm.file_name || !fileForm.file_url} className="flex-1 py-1.5 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
              </div>
            ) : (
              <button onClick={() => setShowFile(true)} className="w-full py-2 border-dashed border-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />إضافة رابط أو ملف</button>
            )}
          </div>

          <div className="bg-card rounded-lg border p-4 space-y-2 text-sm">
            <h3 className="font-heading font-semibold text-sm mb-3">تفاصيل الدرس</h3>
            {[["المادة", sel.subjects?.name], ["الفصل", sel.classes?.name], ["المعلم", sel.teacher?.full_name], ["الترتيب", sel.lesson_order]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "-"}</span></div>
            ))}
          </div>

          <button onClick={() => deleteMut.mutate(sel.id)} className="w-full py-2.5 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف الدرس</button>
        </div>
      </div>
    </div>
  );
}
