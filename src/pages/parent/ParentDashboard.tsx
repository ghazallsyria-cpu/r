import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getParentChildren, getGradesByStudent, getAttendanceStatsByStudent, getStudentExamResults, getTimetableByClass } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GraduationCap, Calendar, FileText, Clock, TrendingUp, Video, ChevronDown, ChevronUp } from "lucide-react";

const gradeLabel = (p:number) => p>=90?"ممتاز":p>=75?"جيد جداً":p>=60?"جيد":p>=50?"مقبول":"راسب";
const gradeColor = (p:number) => p>=75?"text-success":p>=60?"text-info":p>=50?"text-warning":"text-destructive";
const gradeBg = (p:number) => p>=75?"badge-success":p>=60?"badge-info":p>=50?"badge-warning":"badge-destructive";
const DAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];

function ChildCard({ child }:{ child:any }) {
  const { student, student_id } = child;
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"grades"|"attendance"|"exams"|"schedule">("grades");

  const enabled = expanded;
  const { data: grades = [] } = useQuery({ queryKey:["grades-student",student_id], queryFn:()=>getGradesByStudent(student_id), enabled });
  const { data: attStats } = useQuery({ queryKey:["att-stats",student_id], queryFn:()=>getAttendanceStatsByStudent(student_id), enabled });
  const { data: examResults = [] } = useQuery({ queryKey:["exam-results",student_id], queryFn:()=>getStudentExamResults(student_id), enabled });
  const { data: timetable = [] } = useQuery({ queryKey:["timetable",student?.class_id], queryFn:()=>getTimetableByClass(student!.class_id), enabled:enabled&&!!student?.class_id });

  const avgGrade = grades.length>0 ? ((grades as any[]).reduce((s,g)=>s+(g.score/g.max_score)*100,0)/grades.length).toFixed(1) : "—";
  const attRate = attStats?.rate || "—";

  const byDay:Record<number,any[]> = {};
  [0,1,2,3,4].forEach(d=>{byDay[d]=[];});
  (timetable as any[]).forEach(s=>{if(byDay[s.day_of_week]!==undefined)byDay[s.day_of_week].push(s);});
  const today = new Date().getDay();

  const bySubjGrades:Record<string,{sum:number;count:number}> = {};
  (grades as any[]).forEach(g=>{const n=g.subjects?.name||"—";if(!bySubjGrades[n])bySubjGrades[n]={sum:0,count:0};bySubjGrades[n].sum+=(g.score/g.max_score)*100;bySubjGrades[n].count++;});
  const gradeChartData = Object.entries(bySubjGrades).map(([name,{sum,count}])=>({name,avg:+(sum/count).toFixed(1)}));

  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={()=>setExpanded(!expanded)}>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-xl">{student?.full_name?.[0]}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg">{student?.full_name}</h3>
          <p className="text-sm text-muted-foreground">{student?.classes?.name||"—"} • {student?.classes?.grade||"—"}</p>
          <p className="text-xs text-muted-foreground">الرقم المدني: {student?.national_id}</p>
        </div>
        <div className="hidden sm:flex gap-6 text-center">
          <div><p className={`text-xl font-bold font-heading ${gradeColor(Number(avgGrade))}`}>{avgGrade}%</p><p className="text-xs text-muted-foreground">المعدل</p></div>
          <div><p className={`text-xl font-bold font-heading ${Number(attRate)>=80?"text-success":Number(attRate)>=60?"text-warning":"text-destructive"}`}>{attRate}%</p><p className="text-xs text-muted-foreground">الحضور</p></div>
        </div>
        <button className="p-2 rounded-lg hover:bg-accent shrink-0">{expanded?<ChevronUp className="w-5 h-5 text-muted-foreground"/>:<ChevronDown className="w-5 h-5 text-muted-foreground"/>}</button>
      </div>

      {expanded && (
        <>
          <div className="flex border-t border-b overflow-x-auto bg-accent/10">
            {([["grades","الدرجات",<GraduationCap className="w-3.5 h-3.5"/>],["attendance","الحضور",<Calendar className="w-3.5 h-3.5"/>],["exams","الاختبارات",<FileText className="w-3.5 h-3.5"/>],["schedule","الجدول",<Clock className="w-3.5 h-3.5"/>]] as const).map(([t,l,icon])=>(
              <button key={t} onClick={()=>setActiveTab(t as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-heading border-b-2 whitespace-nowrap transition-colors ${activeTab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:bg-accent"}`}>
                {icon}{l}
              </button>
            ))}
          </div>

          {activeTab==="grades"&&(
            <div className="p-4 space-y-4">
              {grades.length>0 ? (
                <>
                  {gradeChartData.length>0&&<div className="bg-accent/20 rounded-lg p-3"><h4 className="font-heading font-semibold text-xs text-muted-foreground mb-2">متوسط كل مادة</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={gradeChartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis domain={[0,100]} tick={{fontSize:9}}/><Tooltip formatter={(v:any)=>[`${v}%`]}/><Bar dataKey="avg" fill="hsl(var(--primary))" radius={[3,3,0,0]}/></BarChart>
                    </ResponsiveContainer>
                  </div>}
                  <table className="w-full text-sm"><thead className="bg-accent/20"><tr>
                    <th className="text-right px-3 py-2 text-xs text-muted-foreground">المادة</th>
                    <th className="text-right px-3 py-2 text-xs text-muted-foreground">النوع</th>
                    <th className="text-right px-3 py-2 text-xs text-muted-foreground">الدرجة</th>
                    <th className="text-right px-3 py-2 text-xs text-muted-foreground">التقدير</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(grades as any[]).map(g=>{const pct=(g.score/g.max_score)*100;return(
                      <tr key={g.id} className="hover:bg-accent/20">
                        <td className="px-3 py-2 font-medium">{g.subjects?.name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{g.grade_type}</td>
                        <td className="px-3 py-2"><span className={`font-bold ${gradeColor(pct)}`}>{g.score}/{g.max_score}</span></td>
                        <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${gradeBg(pct)}`}>{gradeLabel(pct)}</span></td>
                      </tr>
                    );})}
                  </tbody></table>
                </>
              ):<p className="text-center py-8 text-sm text-muted-foreground">لا توجد درجات</p>}
            </div>
          )}

          {activeTab==="attendance"&&attStats&&(
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[["نسبة الحضور",`${attStats.rate}%`,Number(attStats.rate)>=80?"text-success":Number(attStats.rate)>=60?"text-warning":"text-destructive"],["حاضر",attStats.present,"text-success"],["غائب",attStats.absent,"text-destructive"],["متأخر",attStats.late,"text-warning"]].map(([l,v,c])=>(
                  <div key={l as string} className="text-center bg-accent/20 rounded-lg p-3">
                    <p className={`text-xl font-bold font-heading ${c}`}>{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              {attStats.bySubject.length>0&&(
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-sm">الحضور لكل مادة</h4>
                  {attStats.bySubject.map((s:any)=>{
                    const pct = s.total>0?Math.round(s.present/s.total*100):0;
                    return (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="text-sm min-w-20 truncate">{s.name}</span>
                        <div className="flex-1 h-2.5 bg-accent rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct>=80?"bg-success":pct>=60?"bg-warning":"bg-destructive"}`} style={{width:`${pct}%`}}/>
                        </div>
                        <span className={`text-xs font-bold min-w-10 text-left ${pct>=80?"text-success":pct>=60?"text-warning":"text-destructive"}`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1">
                {attStats.records.slice(0,40).map((r:any)=>(
                  <div key={r.id} className={`p-1 rounded text-center text-[10px] ${r.status==="حاضر"?"bg-success/10 text-success":r.status==="غائب"?"bg-destructive/10 text-destructive":"bg-warning/10 text-warning"}`}>
                    <p className="font-bold">{r.status==="حاضر"?"✓":r.status==="غائب"?"✗":"~"}</p>
                    <p>{r.date?.slice(5)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==="exams"&&(
            <div className="p-4 space-y-2">
              {(examResults as any[]).length>0 ? (examResults as any[]).map((r:any)=>(
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border ${r.percentage>=60?"border-success/20 bg-success/5":"border-destructive/20 bg-destructive/5"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm ${r.percentage>=60?"bg-success/10 text-success":"bg-destructive/10 text-destructive"}`}>{r.percentage}%</div>
                  <div className="flex-1"><p className="font-heading font-semibold text-sm">{r.exams?.title||"اختبار"}</p><p className="text-xs text-muted-foreground">{r.obtained_marks}/{r.total_marks} درجة</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.percentage>=60?"badge-success":"badge-destructive"}`}>{r.percentage>=60?"ناجح":"راسب"}</span>
                </div>
              )):<p className="text-center py-8 text-sm text-muted-foreground">لا توجد نتائج اختبارات</p>}
            </div>
          )}

          {activeTab==="schedule"&&(
            <div className="p-4 space-y-3">
              {timetable.length>0 ? [0,1,2,3,4].map(day=>{
                const slots = byDay[day].sort((a:any,b:any)=>a.period_number-b.period_number);
                if(slots.length===0) return null;
                return (
                  <div key={day}>
                    <h4 className={`font-heading font-semibold text-sm mb-2 flex items-center gap-2 ${day===today?"text-primary":""}`}>
                      {DAYS_AR[day]}{day===today&&<span className="text-xs badge-success">اليوم</span>}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((s:any)=>(
                        <div key={s.id} className={`rounded-lg border p-2.5 text-sm ${s.zoom_link?"border-info/30 bg-info/5":""}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{s.period_number}</span>
                            <span className="text-[10px] text-muted-foreground">{s.start_time}–{s.end_time}</span>
                          </div>
                          <p className="font-heading font-semibold text-xs">{s.subjects?.name||"نشاط"}</p>
                          {s.teacher&&<p className="text-[10px] text-muted-foreground">{s.teacher.full_name}</p>}
                          {s.zoom_link&&<a href={s.zoom_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-info mt-1"><Video className="w-2.5 h-2.5"/>أون لاين</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }) : <p className="text-center py-8 text-sm text-muted-foreground">لم يُعدّ الجدول بعد</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useQuery({ queryKey:["my-children",user?.id], queryFn:()=>getParentChildren(user!.id), enabled:!!user });
  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">لوحة ولي الأمر</h1><p className="text-muted-foreground text-sm mt-1">مرحباً {user?.full_name} — تابع أداء أبنائك</p></div>
      {isLoading&&<div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>}
      {!isLoading&&children.length===0&&<div className="text-center py-16 bg-card rounded-xl border text-muted-foreground"><TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20"/><p className="font-heading">لم يتم ربط أبناء بحسابك</p><p className="text-sm mt-1">تواصل مع إدارة المدرسة</p></div>}
      <div className="space-y-4">{(children as any[]).map(c=><ChildCard key={c.id} child={c}/>)}</div>
    </div>
  );
}
