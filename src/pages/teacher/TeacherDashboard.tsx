import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherClasses, getTeacherSubjects, getTeacherTimetableSlots } from "@/lib/api";
import { BookOpen, FolderOpen, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const today = new Date().getDay();

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: myClasses = [] } = useQuery({ queryKey:["teacher-classes",user?.id], queryFn:()=>getTeacherClasses(user!.id), enabled:!!user });
  const { data: mySubjects = [] } = useQuery({ queryKey:["teacher-subjects",user?.id], queryFn:()=>getTeacherSubjects(user!.id), enabled:!!user });
  const { data: mySlots = [] } = useQuery({ queryKey:["teacher-slots",user?.id], queryFn:()=>getTeacherTimetableSlots(user!.id), enabled:!!user });

  const todaySlots = (mySlots as any[]).filter(s=>s.day_of_week===today).sort((a:any,b:any)=>a.period_number-b.period_number);

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">لوحة المعلم</h1><p className="text-muted-foreground text-sm mt-1">مرحباً {user?.full_name}</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card text-center cursor-pointer hover:shadow-md" onClick={()=>navigate("/my-classes")}>
          <FolderOpen className="w-8 h-8 text-primary mx-auto mb-2"/>
          <p className="text-2xl font-bold font-heading text-primary">{myClasses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">فصولي</p>
        </div>
        <div className="stat-card text-center cursor-pointer hover:shadow-md" onClick={()=>navigate("/teacher-lessons")}>
          <BookOpen className="w-8 h-8 text-info mx-auto mb-2"/>
          <p className="text-2xl font-bold font-heading text-info">{mySubjects.length}</p>
          <p className="text-xs text-muted-foreground mt-1">موادي</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-8 h-8 text-success mx-auto mb-2"/>
          <p className="text-2xl font-bold font-heading text-success">{todaySlots.length}</p>
          <p className="text-xs text-muted-foreground mt-1">حصص اليوم</p>
        </div>
        <div className="stat-card text-center cursor-pointer hover:shadow-md" onClick={()=>navigate("/attendance")}>
          <Calendar className="w-8 h-8 text-warning mx-auto mb-2"/>
          <p className="text-2xl font-bold font-heading text-warning">تسجيل</p>
          <p className="text-xs text-muted-foreground mt-1">الحضور</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today schedule */}
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary"/>جدول اليوم — {DAYS_AR[today]}</h2>
          {todaySlots.length>0 ? (
            <div className="space-y-2">
              {todaySlots.map((s:any)=>(
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-heading font-bold flex items-center justify-center">{s.period_number}</span>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-sm">{s.subjects?.name||"نشاط"}</p>
                    <p className="text-xs text-muted-foreground">{s.classes?.name} • {s.start_time}–{s.end_time}</p>
                  </div>
                </div>
              ))}
            </div>
          ):<p className="text-center py-6 text-sm text-muted-foreground">لا توجد حصص مجدولة اليوم</p>}
        </div>

        {/* My classes and subjects */}
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-4">فصولي ومواد</h2>
          <div className="space-y-2">
            {(myClasses as any[]).map((c:any)=>(
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50">
                <FolderOpen className="w-4 h-4 text-primary shrink-0"/>
                <span className="text-sm font-medium">{c.classes?.name}</span>
                <span className="text-xs text-muted-foreground">{c.classes?.grade}</span>
              </div>
            ))}
            {(mySubjects as any[]).map((s:any)=>(
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50">
                <BookOpen className="w-4 h-4 text-info shrink-0"/>
                <span className="text-sm font-medium">{s.subjects?.name}</span>
                <span className="text-xs font-mono text-muted-foreground">{s.subjects?.code}</span>
              </div>
            ))}
            {myClasses.length===0&&mySubjects.length===0&&<p className="text-center py-6 text-sm text-muted-foreground">لم تُخصص لك فصول أو مواد بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
