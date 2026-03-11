import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getLessons, getExams, getGradesByStudent, getAttendanceByStudent } from "@/lib/api";
import { BookOpen, PenTool, GraduationCap, ClipboardCheck } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: lessons } = useQuery({
    queryKey: ["student-lessons", user?.class_id],
    queryFn: () => getLessons({ class_id: user!.class_id! }),
    enabled: !!user?.class_id,
  });

  const { data: exams } = useQuery({
    queryKey: ["student-exams", user?.class_id],
    queryFn: () => getExams({ class_id: user!.class_id! }),
    enabled: !!user?.class_id,
  });

  const { data: grades } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: () => getGradesByStudent(user!.id),
    enabled: !!user,
  });

  const { data: attendance } = useQuery({
    queryKey: ["student-attendance", user?.id],
    queryFn: () => getAttendanceByStudent(user!.id),
    enabled: !!user,
  });

  const publishedLessons = lessons?.filter((l: any) => l.is_published) || [];
  const publishedExams = exams?.filter((e: any) => e.is_published) || [];
  const presentCount = attendance?.filter((a: any) => a.status === "حاضر").length || 0;
  const totalAttendance = attendance?.length || 0;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(0) : "0";

  const avgGrade = grades && grades.length > 0
    ? (grades.reduce((sum: number, g: any) => sum + (g.score / g.max_score) * 100, 0) / grades.length).toFixed(0)
    : "0";

  const stats = [
    { label: "الدروس المتاحة", value: publishedLessons.length, icon: BookOpen, color: "text-primary bg-primary/10" },
    { label: "الاختبارات", value: publishedExams.length, icon: PenTool, color: "text-warning bg-warning/10" },
    { label: "معدل الدرجات", value: `${avgGrade}%`, icon: GraduationCap, color: "text-info bg-info/10" },
    { label: "نسبة الحضور", value: `${attendanceRate}%`, icon: ClipboardCheck, color: "text-success bg-success/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">مرحباً، {user?.full_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">لوحة تحكم الطالب</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-heading">{s.label}</p>
                <p className="text-2xl font-bold font-heading mt-1">{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3">آخر الدروس</h2>
          <div className="space-y-2">
            {publishedLessons.slice(0, 5).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{l.title}</span>
                <span className="text-xs text-muted-foreground">{l.subjects?.name}</span>
              </div>
            ))}
            {publishedLessons.length === 0 && <p className="text-sm text-muted-foreground">لا توجد دروس متاحة</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3">آخر الدرجات</h2>
          <div className="space-y-2">
            {grades?.slice(0, 5).map((g: any) => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{g.subjects?.name}</span>
                <span className={`text-sm font-semibold ${(g.score / g.max_score) * 100 >= 60 ? "text-success" : "text-destructive"}`}>{g.score}/{g.max_score}</span>
              </div>
            ))}
            {(!grades || grades.length === 0) && <p className="text-sm text-muted-foreground">لا توجد درجات بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
