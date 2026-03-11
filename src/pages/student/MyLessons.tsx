import { LatexContent } from "@/components/LatexContent";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getLessons, getLessonFiles } from "@/lib/api";
import { BookOpen, FileText, Link, ChevronDown, ChevronUp } from "lucide-react";



function LessonCard({ lesson }: { lesson: any }) {
  const [open, setOpen] = useState(false);
  const { data: files = [] } = useQuery({ queryKey: ["lesson-files", lesson.id], queryFn: () => getLessonFiles(lesson.id), enabled: open });
  return (
    <div className={`bg-card rounded-lg border transition-all ${open ? "shadow-md" : ""}`}>
      <div onClick={() => setOpen(!open)} className="p-4 cursor-pointer flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-heading font-bold flex items-center justify-center shrink-0">{lesson.lesson_order}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-sm">{lesson.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{lesson.subjects?.name} • {lesson.teacher?.full_name}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 border-t pt-4">
          {lesson.content ? (
            <LatexContent content={lesson.content} />
          ) : <p className="text-muted-foreground text-sm">لا يوجد محتوى</p>}
          {(files as any[]).length > 0 && (
            <div className="mt-4 pt-3 border-t space-y-2">
              <p className="text-xs font-heading font-semibold text-muted-foreground">المرفقات:</p>
              {(files as any[]).map((f: any) => (
                <a key={f.id} href={f.file_url} target="_blank" className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent text-sm text-primary">
                  <FileText className="w-4 h-4 shrink-0" />{f.file_name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyLessons() {
  const { user } = useAuth();
  const [filterSubject, setFilterSubject] = useState("");

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["my-lessons", user?.class_id],
    queryFn: () => getLessons({ class_id: user!.class_id || undefined }),
    enabled: !!user?.class_id
  });

  const published = (lessons as any[]).filter(l => l.is_published && (!filterSubject || l.subject_id === filterSubject));
  const subjects = Array.from(new Map((lessons as any[]).filter(l=>l.is_published).map(l=>[l.subject_id, l.subjects])).entries()).map(([id, s]) => ({ id, ...s }));

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">دروسي</h1><p className="text-muted-foreground text-sm mt-1">{published.length} درس متاح</p></div>
      {!user?.class_id && <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-warning text-sm">لم يتم تخصيص فصل دراسي لحسابك. تواصل مع المدير.</div>}
      {subjects.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterSubject("")} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${!filterSubject ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>الكل</button>
          {subjects.map(s => <button key={s.id} onClick={() => setFilterSubject(s.id)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${filterSubject === s.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{s.name}</button>)}
        </div>
      )}
      <div className="space-y-3">
        {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}
        {published.map(l => <LessonCard key={l.id} lesson={l} />)}
        {!isLoading && published.length === 0 && user?.class_id && <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20"/><p>لا توجد دروس منشورة بعد</p></div>}
      </div>
    </div>
  );
}
