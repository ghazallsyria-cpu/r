import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExams, getExamQuestions, submitExamAnswers, upsertExamResult, getStudentExamResults } from "@/lib/api";
import { toast } from "sonner";
import { Clock, CheckCircle, FileText, Lock, Send } from "lucide-react";

export default function MyExams() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeExam, setActiveExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ obtained: number; total: number; pct: number } | null>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["my-exams", user?.class_id],
    queryFn: () => getExams({ class_id: user!.class_id || undefined }),
    enabled: !!user?.class_id
  });
  const { data: questions = [] } = useQuery({
    queryKey: ["exam-questions", activeExam?.id],
    queryFn: () => getExamQuestions(activeExam!.id),
    enabled: !!activeExam
  });
  const { data: myResults = [] } = useQuery({
    queryKey: ["my-exam-results", user?.id],
    queryFn: () => getStudentExamResults(user!.id),
    enabled: !!user
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      const qs = questions as any[];
      let obtained = 0;
      const records = qs.map((q: any) => {
        const ans = answers[q.id] || "";
        const correct = ans.trim() === q.correct_answer.trim();
        if (correct) obtained += Number(q.marks);
        return { question_id: q.id, answer: ans };
      });
      await submitExamAnswers(activeExam.id, user!.id, records);
      const total = qs.reduce((s: number, q: any) => s + Number(q.marks), 0);
      const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
      await upsertExamResult({ exam_id: activeExam.id, student_id: user!.id, total_marks: total, obtained_marks: obtained, percentage: pct, status: pct >= 60 ? "pass" : "fail", submitted_at: new Date().toISOString() });
      return { obtained, total, pct };
    },
    onSuccess: (res) => { setScore(res); setSubmitted(true); qc.invalidateQueries({ queryKey: ["my-exam-results"] }); toast.success("تم تسليم الاختبار"); },
    onError: () => toast.error("خطأ في التسليم")
  });

  const published = (exams as any[]).filter(e => e.is_published);
  const completedIds = new Set((myResults as any[]).map((r: any) => r.exam_id));

  if (activeExam) {
    if (submitted && score) return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`rounded-xl border p-8 text-center ${score.pct >= 60 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${score.pct >= 60 ? "bg-success/10" : "bg-destructive/10"}`}>
            <CheckCircle className={`w-8 h-8 ${score.pct >= 60 ? "text-success" : "text-destructive"}`} />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">{score.pct >= 60 ? "أحسنت! لقد نجحت" : "للأسف لم تنجح"}</h2>
          <p className="text-4xl font-bold font-heading my-4">{score.pct}%</p>
          <p className="text-muted-foreground">{score.obtained} من {score.total} درجة</p>
          <button onClick={() => { setActiveExam(null); setAnswers({}); setSubmitted(false); setScore(null); }} className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading">العودة للقائمة</button>
        </div>
      </div>
    );

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-card rounded-lg border p-4 flex items-center justify-between">
          <div><h2 className="font-heading font-bold">{activeExam.title}</h2><p className="text-xs text-muted-foreground">{activeExam.subjects?.name} • {activeExam.duration_minutes} دقيقة • {activeExam.total_marks} درجة</p></div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{activeExam.duration_minutes} د</div>
        </div>

        <div className="space-y-4">
          {(questions as any[]).map((q: any, i: number) => (
            <div key={q.id} className="bg-card rounded-lg border p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm font-medium leading-relaxed flex-1">{q.question_text}</p>
                <span className="text-xs text-muted-foreground shrink-0">{q.marks}د</span>
              </div>

              {q.question_type === "multiple_choice" && Array.isArray(q.options) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-10">
                  {(q.options as string[]).map((opt: string, oi: number) => (
                    <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={`text-right px-4 py-3 rounded-lg border text-sm transition-colors ${answers[q.id] === opt ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === "true_false" && (
                <div className="flex gap-3 pr-10">
                  {["صح", "خطأ"].map(opt => (
                    <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={`flex-1 py-3 rounded-lg border text-sm font-heading font-medium transition-colors ${answers[q.id] === opt ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
                      {opt === "صح" ? "✓ صح" : "✗ خطأ"}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === "short_answer" && (
                <input value={answers[q.id] || ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="اكتب إجابتك هنا..." className="w-full mr-10 px-4 py-2.5 bg-background border rounded-lg text-sm" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{Object.keys(answers).length} من {questions.length} سؤال تمت الإجابة عليه</p>
          <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 bg-success text-white rounded-lg text-sm font-heading hover:bg-success/90 disabled:opacity-70">
            <Send className="w-4 h-4" />{submitMut.isPending ? "جارٍ التسليم..." : "تسليم الاختبار"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">اختباراتي</h1><p className="text-muted-foreground text-sm mt-1">{published.length} اختبار متاح</p></div>
      {!user?.class_id && <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-warning text-sm">لم يتم تخصيص فصل دراسي لحسابك. تواصل مع المدير.</div>}
      <div className="space-y-3">
        {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}
        {published.map((e: any) => {
          const done = completedIds.has(e.id);
          const result = (myResults as any[]).find((r: any) => r.exam_id === e.id);
          return (
            <div key={e.id} className="bg-card rounded-lg border p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-success/10" : "bg-primary/10"}`}>
                {done ? <CheckCircle className="w-5 h-5 text-success" /> : <FileText className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{e.subjects?.name} • {e.duration_minutes} دقيقة • {e.total_marks} درجة</p>
                {done && result && <p className={`text-xs mt-1 font-semibold ${result.percentage >= 60 ? "text-success" : "text-destructive"}`}>نتيجتك: {result.percentage}% • {result.percentage >= 60 ? "ناجح ✓" : "راسب ✗"}</p>}
              </div>
              {!done ? (
                <button onClick={() => { setActiveExam(e); setAnswers({}); setSubmitted(false); setScore(null); }} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-heading shrink-0">ابدأ الاختبار</button>
              ) : (
                <span className="px-3 py-1.5 text-xs rounded-lg bg-success/10 text-success font-heading shrink-0">مكتمل</span>
              )}
            </div>
          );
        })}
        {!isLoading && published.length === 0 && user?.class_id && <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border"><FileText className="w-12 h-12 mx-auto mb-3 opacity-20"/><p>لا توجد اختبارات متاحة حالياً</p></div>}
      </div>
    </div>
  );
}
