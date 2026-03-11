import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, getSubjects, getStudentsByClass, getGradesBySubjectAndClass, upsertGrade, deleteGrade, getTeacherClasses, getTeacherSubjects } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Trash2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GRADE_TYPES = ["اختبار فصلي","اختبار شهري","نشاط","واجب","مشاركة","مشروع"];
const SEMESTERS = ["الفصل الأول","الفصل الثاني","الفصل الثالث"];
const gradeLabel = (pct: number) => pct >= 90 ? "ممتاز" : pct >= 75 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "راسب";
const gradeColor = (pct: number) => pct >= 75 ? "text-success" : pct >= 60 ? "text-info" : pct >= 50 ? "text-warning" : "text-destructive";

export default function Grades() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cls, setCls] = useState("");
  const [subj, setSubj] = useState("");
  const [gradeType, setGradeType] = useState("اختبار فصلي");
  const [semester, setSemester] = useState("الفصل الأول");
  const [maxScore, setMaxScore] = useState(100);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"entry"|"stats">("entry");

  const isTeacher = user?.role === "teacher";
  const { data: allClasses = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: allSubjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user && isTeacher });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", user?.id], queryFn: () => getTeacherSubjects(user!.id), enabled: !!user && isTeacher });
  const assignedClassIds = new Set((tClasses as any[]).map((tc:any) => tc.class_id));
  const assignedSubjIds = new Set((tSubjects as any[]).map((ts:any) => ts.subject_id));
  const classes = isTeacher ? (allClasses as any[]).filter(c => assignedClassIds.has(c.id)) : allClasses;
  const subjects = isTeacher ? (allSubjects as any[]).filter(s => assignedSubjIds.has(s.id)) : allSubjects;
  const { data: students = [] } = useQuery({ queryKey: ["students-class", cls], queryFn: () => getStudentsByClass(cls), enabled: !!cls });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades-subj-class", subj, cls, gradeType, semester],
    queryFn: () => getGradesBySubjectAndClass(subj, cls),
    enabled: !!subj && !!cls,
    onSuccess: (data: any[]) => {
      const map: Record<string, string> = {};
      data.filter(g => g.grade_type === gradeType && g.semester === semester).forEach(g => { map[g.student_id] = String(g.score); });
      setScores(map);
    }
  } as any);

  const saveMut = useMutation({
    mutationFn: async () => {
      const promises = (students as any[]).filter(s => scores[s.id] !== undefined && scores[s.id] !== "").map(s =>
        upsertGrade({ student_id: s.id, subject_id: subj, class_id: cls, grade_type: gradeType, score: Number(scores[s.id]), max_score: maxScore, semester, recorded_by: user?.id })
      );
      return Promise.all(promises);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades-subj-class"] }); toast.success("تم حفظ الدرجات"); },
    onError: () => toast.error("خطأ في الحفظ")
  });

  const clsGrades = (grades as any[]).filter(g => g.grade_type === gradeType && g.semester === semester);
  const avgScore = clsGrades.length > 0 ? (clsGrades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / clsGrades.length).toFixed(1) : "0";
  const chartData = (students as any[]).map(s => {
    const g = clsGrades.find(g => g.student_id === s.id);
    return { name: s.full_name.split(" ")[0], score: g ? (g.score / g.max_score) * 100 : 0, fullName: s.full_name };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الدرجات</h1><p className="text-muted-foreground text-sm mt-1">إدارة درجات الطلاب</p></div>
        <div className="flex rounded-lg border overflow-hidden">
          {[["entry","إدخال الدرجات"],["stats","الإحصائيات"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`px-4 py-2 text-sm font-heading ${tab===t?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select value={cls} onChange={e=>setCls(e.target.value)} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل</option>{(classes as any[]).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={subj} onChange={e=>setSubj(e.target.value)} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة</option>{(subjects as any[]).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={gradeType} onChange={e=>setGradeType(e.target.value)} className="px-4 py-2.5 bg-background border rounded-lg text-sm">{GRADE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <select value={semester} onChange={e=>setSemester(e.target.value)} className="px-4 py-2.5 bg-background border rounded-lg text-sm">{SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <div><label className="text-xs text-muted-foreground block mb-1">الدرجة الكاملة</label><input type="number" min="1" max="1000" value={maxScore} onChange={e=>setMaxScore(+e.target.value)} className="w-full px-4 py-2 bg-background border rounded-lg text-sm"/></div>
        </div>
      </div>

      {tab === "entry" && (
        <>
          {cls && subj && students.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-card text-center"><p className="text-xl font-bold text-primary">{students.length}</p><p className="text-xs text-muted-foreground">إجمالي الطلاب</p></div>
                <div className="stat-card text-center"><p className="text-xl font-bold text-success">{Object.keys(scores).filter(id=>scores[id]!=="").length}</p><p className="text-xs text-muted-foreground">تم إدخال درجاتهم</p></div>
                <div className="stat-card text-center"><p className="text-xl font-bold text-info">{avgScore}%</p><p className="text-xs text-muted-foreground">المتوسط</p></div>
              </div>

              <div className="bg-card rounded-lg border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm">{gradeType} • {semester} • من {maxScore}</h3>
                  <button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-heading hover:bg-primary/90 disabled:opacity-70">
                    <Save className="w-4 h-4"/>{saveMut.isPending?"جارٍ الحفظ...":"حفظ الدرجات"}
                  </button>
                </div>
                <table className="data-table">
                  <thead><tr><th>#</th><th>الطالب</th><th>الدرجة (من {maxScore})</th><th>النسبة</th><th>التقدير</th></tr></thead>
                  <tbody>
                    {(students as any[]).map((s:any,i:number)=>{
                      const score = scores[s.id];
                      const pct = score && maxScore ? ((+score/maxScore)*100) : null;
                      return (
                        <tr key={s.id}>
                          <td className="text-muted-foreground">{i+1}</td>
                          <td className="font-medium">{s.full_name}</td>
                          <td>
                            <input type="number" min="0" max={maxScore} value={scores[s.id]||""} onChange={e=>setScores(prev=>({...prev,[s.id]:e.target.value}))} placeholder={`0-${maxScore}`} className={`w-28 px-3 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring ${pct!==null&&pct<50?"border-destructive/30 bg-destructive/5":""}`}/>
                          </td>
                          <td>{pct!==null?<span className={`font-semibold ${gradeColor(pct)}`}>{pct.toFixed(1)}%</span>:"-"}</td>
                          <td>{pct!==null?<span className={`text-xs font-heading px-2 py-0.5 rounded-full ${pct>=75?"badge-success":pct>=60?"badge-info":pct>=50?"badge-warning":"badge-destructive"}`}>{gradeLabel(pct)}</span>:"-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20"/>
              <p>اختر الفصل والمادة لإدخال الدرجات</p>
            </div>
          )}
        </>
      )}

      {tab === "stats" && cls && subj && (
        <div className="space-y-4">
          {chartData.some(d=>d.score>0)?(
            <div className="bg-card rounded-lg border p-5">
              <h3 className="font-heading font-semibold mb-4">توزيع الدرجات بالنسبة المئوية</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="name" tick={{fontSize:10}}/>
                  <YAxis domain={[0,100]} tick={{fontSize:10}}/>
                  <Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)}%`,"النسبة"]} labelFormatter={(l:any)=>chartData.find(d=>d.name===l)?.fullName||l}/>
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="النسبة">
                    {chartData.map((_,i)=>{
                      const score=chartData[i].score;
                      const fill=score>=75?"hsl(var(--success))":score>=60?"hsl(var(--info))":score>=50?"hsl(var(--warning))":"hsl(var(--destructive))";
                      return <rect key={i} fill={fill}/>;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ):(
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">لا توجد درجات لعرضها</div>
          )}
        </div>
      )}

      {tab === "stats" && (!cls || !subj) && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">اختر الفصل والمادة لعرض الإحصائيات</div>
      )}
    </div>
  );
}
