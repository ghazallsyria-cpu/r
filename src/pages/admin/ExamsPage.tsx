import { LatexContent } from "@/components/LatexContent";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExams, addExam, updateExam, deleteExam, getExamQuestions, addExamQuestion, updateExamQuestion, deleteExamQuestion, getSubjects, getClasses, getTeachers, getExamResults , getTeacherClasses, getTeacherSubjects } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, BarChart3, CheckCircle, Circle, AlignLeft, ToggleLeft, List, Send, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
type QType = "multiple_choice"|"true_false"|"short_answer";
const qTypeLabel=(t:string)=>t==="multiple_choice"?"اختيار متعدد":t==="true_false"?"صح / خطأ":"إجابة قصيرة";

export default function ExamsPage() {
  const qc = useQueryClient();
  const [tab,setTab]=useState<"list"|"builder"|"results">("list");
  const [sel,setSel]=useState<any>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [showAddQ,setShowAddQ]=useState(false);
  const [editingQ,setEditingQ]=useState<any>(null);
  const [filterClass,setFilterClass]=useState("");
  const [form,setForm]=useState({title:"",subject_id:"",class_id:"",teacher_id:"",duration_minutes:60,total_marks:100,exam_type:"اختبار"});
  const [newQ,setNewQ]=useState<{question_text:string;question_type:QType;correct_answer:string;marks:number;options:string[]}>({question_text:"",question_type:"multiple_choice",correct_answer:"",marks:1,options:["","","",""]});

  const {data:exams=[],isLoading}=useQuery({queryKey:["exams"],queryFn:()=>getExams()});
  const {data:subjects=[]}=useQuery({queryKey:["subjects"],queryFn:getSubjects});
  const {data:classes=[]}=useQuery({queryKey:["classes"],queryFn:getClasses});
  const {data:teachers=[]}=useQuery({queryKey:["teachers"],queryFn:getTeachers});
  const {data:questions=[]}=useQuery({queryKey:["exam-questions",sel?.id],queryFn:()=>getExamQuestions(sel!.id),enabled:!!sel});
  const {data:results=[]}=useQuery({queryKey:["exam-results",sel?.id],queryFn:()=>getExamResults(sel!.id),enabled:!!sel&&tab==="results"});

  const addMut=useMutation({mutationFn:()=>addExam(form),onSuccess:(d)=>{qc.invalidateQueries({queryKey:["exams"]});setShowAdd(false);setSel(d);setTab("builder");toast.success("تم إنشاء الاختبار");},onError:()=>toast.error("خطأ في الإنشاء")});
  const deleteMut=useMutation({mutationFn:deleteExam,onSuccess:()=>{qc.invalidateQueries({queryKey:["exams"]});setSel(null);setTab("list");toast.success("تم الحذف");}});
  const togglePub=useMutation({mutationFn:(e:any)=>updateExam(e.id,{is_published:!e.is_published}),onSuccess:(_,e)=>{qc.invalidateQueries({queryKey:["exams"]});if(sel?.id===e.id)setSel({...sel,is_published:!sel.is_published});toast.success("تم تحديث حالة النشر");}});
  const addQMut=useMutation({
    mutationFn:()=>addExamQuestion({exam_id:sel!.id,question_text:newQ.question_text,question_type:newQ.question_type,correct_answer:newQ.correct_answer,marks:newQ.marks,options:newQ.question_type==="multiple_choice"?newQ.options.filter(o=>o.trim()):["صح","خطأ"],question_order:(questions?.length||0)+1}),
    onSuccess:()=>{qc.invalidateQueries({queryKey:["exam-questions",sel?.id]});setShowAddQ(false);setNewQ({question_text:"",question_type:"multiple_choice",correct_answer:"",marks:1,options:["","","",""]});toast.success("تم إضافة السؤال");},
    onError:()=>toast.error("خطأ")
  });
  const updQMut=useMutation({mutationFn:({id,...u}:any)=>updateExamQuestion(id,u),onSuccess:()=>{qc.invalidateQueries({queryKey:["exam-questions",sel?.id]});setEditingQ(null);}});
  const delQMut=useMutation({mutationFn:deleteExamQuestion,onSuccess:()=>qc.invalidateQueries({queryKey:["exam-questions",sel?.id]})});

  const filtered=filterClass?exams.filter((e:any)=>e.class_id===filterClass):exams;
  const totalMrk=questions.reduce((s:number,q:any)=>s+Number(q.marks),0);
  const avgRes=results.length>0?(results.reduce((s:number,r:any)=>s+r.percentage,0)/results.length).toFixed(1):"0";
  const pieData=[{name:"ناجح",value:results.filter((r:any)=>r.percentage>=60).length},{name:"راسب",value:results.filter((r:any)=>r.percentage<60).length}];

  if(!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الاختبارات</h1><p className="text-muted-foreground text-sm mt-1">{exams.length} اختبار</p></div>
        <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>اختبار جديد</button>
      </div>
      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-lg mx-4" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">اختبار جديد</h2><button onClick={()=>setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button></div>
            <div className="space-y-3">
              <input placeholder="عنوان الاختبار *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة *</option>{subjects.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل *</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <select value={form.teacher_id} onChange={e=>setForm({...form,teacher_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المعلم *</option>{teachers.map((t:any)=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
              <div className="grid grid-cols-3 gap-3">
                <select value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})} className="px-3 py-2.5 bg-background border rounded-lg text-sm">{["اختبار","مسابقة","واجب","تقييم"].map(t=><option key={t} value={t}>{t}</option>)}</select>
                <div><label className="text-xs text-muted-foreground block mb-1">المدة (د)</label><input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:+e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
                <div><label className="text-xs text-muted-foreground block mb-1">الدرجة</label><input type="number" value={form.total_marks} onChange={e=>setForm({...form,total_marks:+e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
              </div>
              <div className="flex gap-2 justify-end pt-2"><button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addMut.mutate()} disabled={!form.title||!form.subject_id||!form.class_id||!form.teacher_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إنشاء</button></div>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل الفصول</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>الاختبار</th><th>المادة</th><th>الفصل</th><th>النوع</th><th>المدة</th><th>الدرجة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading&&<tr><td colSpan={8} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {filtered.map((e:any)=>(
              <tr key={e.id} onClick={()=>{setSel(e);setTab("builder");}}>
                <td className="font-medium">{e.title}</td><td className="text-muted-foreground">{e.subjects?.name||"-"}</td><td className="text-muted-foreground">{e.classes?.name||"-"}</td>
                <td><span className="badge-info">{e.exam_type}</span></td>
                <td className="text-muted-foreground text-xs">{e.duration_minutes} د</td>
                <td className="font-medium">{e.total_marks}</td>
                <td><span className={e.is_published?"badge-success":"badge-warning"}>{e.is_published?"منشور":"مسودة"}</span></td>
                <td onClick={ev=>ev.stopPropagation()}><div className="flex gap-1">
                  <button onClick={()=>togglePub.mutate(e)} className={`p-1.5 rounded transition-colors ${e.is_published?"text-success hover:bg-success/10":"text-warning hover:bg-warning/10"}`} title={e.is_published?"إلغاء النشر":"نشر"}>{e.is_published?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
                  <button onClick={()=>deleteMut.mutate(e.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </div></td>
              </tr>
            ))}
            {!isLoading&&filtered.length===0&&<tr><td colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد اختبارات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>{setSel(null);setTab("list");}} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • {sel.classes?.name} • {sel.duration_minutes} دقيقة</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            {["builder","results"].map(t=>(
              <button key={t} onClick={()=>setTab(t as any)} className={`px-3 py-1.5 text-xs font-heading ${tab===t?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent"}`}>{t==="builder"?"الأسئلة":"النتائج"}</button>
            ))}
          </div>
          <button onClick={()=>togglePub.mutate(sel)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-colors ${sel.is_published?"bg-warning/10 text-warning border border-warning/20":"bg-success text-success-foreground hover:bg-success/90"}`}>
            {sel.is_published?<><EyeOff className="w-4 h-4"/>إلغاء النشر</>:<><Send className="w-4 h-4"/>نشر للطلاب</>}
          </button>
        </div>
      </div>

      {tab==="builder"&&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-lg border p-3 text-center"><p className="text-xl font-bold text-primary">{questions.length}</p><p className="text-xs text-muted-foreground">سؤال</p></div>
              <div className="bg-card rounded-lg border p-3 text-center"><p className={`text-xl font-bold ${totalMrk===sel.total_marks?"text-success":totalMrk>sel.total_marks?"text-destructive":"text-warning"}`}>{totalMrk}/{sel.total_marks}</p><p className="text-xs text-muted-foreground">الدرجات</p></div>
              <div className="bg-card rounded-lg border p-3 text-center"><p className="text-xl font-bold text-info">{sel.duration_minutes}</p><p className="text-xs text-muted-foreground">دقيقة</p></div>
            </div>

            {questions.map((q:any,i:number)=>(
              <div key={q.id} className="bg-card rounded-lg border p-4 group">
                {editingQ?.id===q.id?(
                  <div className="space-y-3">
                    <textarea value={editingQ.question_text} onChange={e=>setEditingQ({...editingQ,question_text:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none h-20"/>
                    {editingQ.question_type==="multiple_choice"&&(
                      <div className="space-y-2">{(Array.isArray(editingQ.options)?editingQ.options:["","","",""]).map((opt:string,oi:number)=>(
                        <div key={oi} className="flex items-center gap-2">
                          <button onClick={()=>setEditingQ({...editingQ,correct_answer:opt})} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${editingQ.correct_answer===opt?"border-success bg-success":"border-muted-foreground"}`}>{editingQ.correct_answer===opt&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}</button>
                          <input value={opt} onChange={e=>{const o=[...editingQ.options];o[oi]=e.target.value;setEditingQ({...editingQ,options:o});}} className="flex-1 px-3 py-1.5 bg-background border rounded text-sm" placeholder={`خيار ${oi+1}`}/>
                        </div>
                      ))}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">الدرجة:</span><input type="number" min="0.5" step="0.5" value={editingQ.marks} onChange={e=>setEditingQ({...editingQ,marks:+e.target.value})} className="w-16 px-2 py-1 bg-background border rounded text-sm text-center"/></div>
                      <div className="flex gap-2"><button onClick={()=>setEditingQ(null)} className="px-3 py-1.5 text-xs rounded border hover:bg-accent">إلغاء</button><button onClick={()=>updQMut.mutate({id:editingQ.id,question_text:editingQ.question_text,correct_answer:editingQ.correct_answer,marks:editingQ.marks,options:editingQ.options})} className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground">حفظ</button></div>
                    </div>
                  </div>
                ):(
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center shrink-0">{i+1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-relaxed">{q.question_text}</p>
                          {q.question_type==="multiple_choice"&&Array.isArray(q.options)&&(
                            <div className="mt-2 grid grid-cols-2 gap-1">{(q.options as string[]).map((opt:string,oi:number)=>(
                              <div key={oi} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${opt===q.correct_answer?"bg-success/10 text-success":"bg-accent text-muted-foreground"}`}>
                                {opt===q.correct_answer?<CheckCircle className="w-3 h-3 shrink-0"/>:<Circle className="w-3 h-3 shrink-0"/>}{opt}
                              </div>
                            ))}</div>
                          )}
                          {q.question_type==="true_false"&&<div className="mt-2 flex gap-2">{["صح","خطأ"].map(opt=><span key={opt} className={`text-xs px-3 py-1 rounded ${opt===q.correct_answer?"bg-success/10 text-success font-semibold":"bg-accent text-muted-foreground"}`}>{opt}</span>)}</div>}
                          {q.question_type==="short_answer"&&<p className="mt-1 text-xs text-success bg-success/5 px-2 py-1 rounded">✓ {q.correct_answer}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-muted-foreground ml-1">{q.marks}د</span>
                        <button onClick={()=>setEditingQ({...q,options:Array.isArray(q.options)?q.options:["","","",""]})} className="p-1.5 rounded text-muted-foreground hover:bg-accent">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={()=>delQMut.mutate(q.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{qTypeLabel(q.question_type)} • {q.marks} {q.marks===1?"درجة":"درجات"}</p>
                  </>
                )}
              </div>
            ))}

            {!showAddQ?(
              <button onClick={()=>setShowAddQ(true)} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/>إضافة سؤال جديد
              </button>
            ):(
              <div className="bg-card rounded-lg border p-5 space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-heading font-semibold text-sm">سؤال جديد</h3><button onClick={()=>setShowAddQ(false)} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4 text-muted-foreground"/></button></div>
                <div className="flex gap-2">
                  {(["multiple_choice","true_false","short_answer"] as QType[]).map(t=>(
                    <button key={t} onClick={()=>setNewQ({...newQ,question_type:t,correct_answer:"",options:["","","",""]})}
                      className={`px-3 py-2 rounded-lg text-xs font-heading border transition-colors ${newQ.question_type===t?"bg-primary text-primary-foreground border-primary":"hover:bg-accent"}`}>
                      {qTypeLabel(t)}
                    </button>
                  ))}
                </div>
                <textarea value={newQ.question_text} onChange={e=>setNewQ({...newQ,question_text:e.target.value})} placeholder="اكتب نص السؤال هنا..." className="w-full px-4 py-3 bg-background border rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"/>
                {newQ.question_type==="multiple_choice"&&(
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">اضغط الدائرة لتحديد الإجابة الصحيحة</p>
                    {newQ.options.map((opt,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <button onClick={()=>setNewQ({...newQ,correct_answer:opt})} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${newQ.correct_answer===opt&&opt?"border-success bg-success":"border-muted-foreground hover:border-primary"}`}>
                          {newQ.correct_answer===opt&&opt&&<div className="w-2 h-2 rounded-full bg-white"/>}
                        </button>
                        <input value={opt} onChange={e=>{const o=[...newQ.options];o[i]=e.target.value;setNewQ({...newQ,options:o});}} placeholder={`خيار ${i+1}`} className={`flex-1 px-3 py-2 border rounded-lg text-sm ${newQ.correct_answer===opt&&opt?"bg-success/5 border-success/30":"bg-background"}`}/>
                      </div>
                    ))}
                    <button onClick={()=>setNewQ({...newQ,options:[...newQ.options,""]})} className="text-xs text-primary hover:underline">+ إضافة خيار</button>
                  </div>
                )}
                {newQ.question_type==="true_false"&&(
                  <div className="flex gap-3">{["صح","خطأ"].map(opt=>(
                    <button key={opt} onClick={()=>setNewQ({...newQ,correct_answer:opt})} className={`flex-1 py-3 rounded-lg border text-sm font-heading font-medium ${newQ.correct_answer===opt?"bg-success/10 border-success text-success":"hover:bg-accent"}`}>
                      {opt==="صح"?"✓ صح":"✗ خطأ"}
                    </button>
                  ))}</div>
                )}
                {newQ.question_type==="short_answer"&&(
                  <input value={newQ.correct_answer} onChange={e=>setNewQ({...newQ,correct_answer:e.target.value})} placeholder="الإجابة النموذجية..." className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">الدرجة:</span><input type="number" min="0.5" step="0.5" value={newQ.marks} onChange={e=>setNewQ({...newQ,marks:+e.target.value})} className="w-20 px-3 py-1.5 bg-background border rounded-lg text-sm text-center"/></div>
                  <div className="flex gap-2">
                    <button onClick={()=>setShowAddQ(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                    <button onClick={()=>addQMut.mutate()} disabled={!newQ.question_text.trim()||(newQ.question_type!=="short_answer"&&!newQ.correct_answer)} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h3 className="font-heading font-semibold text-sm">تفاصيل الاختبار</h3>
              <div className="space-y-2 text-sm">
                {[["المادة",sel.subjects?.name],["الفصل",sel.classes?.name],["المعلم",sel.teacher?.full_name],["المدة",`${sel.duration_minutes} دقيقة`],["الدرجة الكاملة",sel.total_marks]].map(([k,v])=>(
                  <div key={k as string} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v||"-"}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-muted-foreground">درجات الأسئلة</span><span className={`font-bold ${totalMrk===sel.total_marks?"text-success":totalMrk>sel.total_marks?"text-destructive":"text-warning"}`}>{totalMrk}</span></div>
              </div>
              {totalMrk!==sel.total_marks&&<p className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg">⚠️ مجموع الأسئلة ({totalMrk}) لا يساوي الدرجة الكاملة ({sel.total_marks})</p>}
            </div>
            <button onClick={()=>deleteMut.mutate(sel.id)} className="w-full py-2.5 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف الاختبار</button>
          </div>
        </div>
      )}

      {tab==="results"&&(
        <div className="space-y-4">
          {results.length>0?(
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{results.length}</p><p className="text-xs text-muted-foreground">أجرى الاختبار</p></div>
                <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{avgRes}%</p><p className="text-xs text-muted-foreground">المعدل العام</p></div>
                <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{results.filter((r:any)=>r.percentage>=60).length}</p><p className="text-xs text-muted-foreground">ناجح</p></div>
                <div className="stat-card text-center"><p className="text-2xl font-bold text-destructive">{results.filter((r:any)=>r.percentage<60).length}</p><p className="text-xs text-muted-foreground">راسب</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border p-4"><h3 className="font-heading font-semibold text-sm mb-3">درجات الطلاب</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={results.map((r:any)=>({name:r.student?.full_name?.split(" ")[0],score:r.percentage}))}>
                      <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/><Tooltip formatter={(v)=>[`${v}%`,"النسبة"]}/>
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-lg border p-4"><h3 className="font-heading font-semibold text-sm mb-3">نسبة النجاح</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {pieData.map((_,i)=><Cell key={i} fill={["hsl(var(--success))","hsl(var(--destructive))"][i]}/>)}
                    </Pie><Tooltip/></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="data-table"><thead><tr><th>#</th><th>الطالب</th><th>المحصلة</th><th>من</th><th>النسبة</th><th>الحالة</th></tr></thead>
                  <tbody>{results.sort((a:any,b:any)=>b.percentage-a.percentage).map((r:any,i:number)=>(
                    <tr key={r.id}><td className="text-muted-foreground">{i+1}</td><td className="font-medium">{r.student?.full_name}</td><td className="font-semibold">{r.obtained_marks}</td><td className="text-muted-foreground">{r.total_marks}</td>
                      <td><span className={`font-bold ${r.percentage>=60?"text-success":"text-destructive"}`}>{r.percentage}%</span></td>
                      <td><span className={r.percentage>=60?"badge-success":"badge-destructive"}>{r.percentage>=60?"ناجح":"راسب"}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ):(
            <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30"/><p className="font-heading">لا توجد نتائج بعد</p><p className="text-xs mt-1">ستظهر هنا بعد إجراء الطلاب الاختبار</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
