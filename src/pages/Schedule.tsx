const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const periods = ["الأولى\n7:30-8:15", "الثانية\n8:20-9:05", "الثالثة\n9:10-9:55", "الرابعة\n10:15-11:00", "الخامسة\n11:05-11:50", "السادسة\n11:55-12:40"];

const schedule: Record<string, string[]> = {
  "الأحد": ["رياضيات", "عربي", "إنجليزي", "علوم", "تاريخ", "فيزياء"],
  "الاثنين": ["علوم", "رياضيات", "تاريخ", "عربي", "فيزياء", "إنجليزي"],
  "الثلاثاء": ["إنجليزي", "فيزياء", "رياضيات", "تاريخ", "عربي", "علوم"],
  "الأربعاء": ["تاريخ", "علوم", "عربي", "فيزياء", "إنجليزي", "رياضيات"],
  "الخميس": ["فيزياء", "إنجليزي", "علوم", "رياضيات", "عربي", "نشاط"],
};

const subjectColors: Record<string, string> = {
  "رياضيات": "bg-info/10 text-info border-info/20",
  "عربي": "bg-primary/10 text-primary border-primary/20",
  "إنجليزي": "bg-warning/10 text-warning border-warning/20",
  "علوم": "bg-success/10 text-success border-success/20",
  "تاريخ": "bg-accent text-foreground border-border",
  "فيزياء": "bg-destructive/10 text-destructive border-destructive/20",
  "نشاط": "bg-muted text-muted-foreground border-border",
};

export default function Schedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">الجدول الدراسي</h1>
        <p className="text-muted-foreground text-sm mt-1">الصف الثاني عشر - شعبة أ</p>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 bg-card px-4 py-3 text-right font-heading font-semibold text-muted-foreground border-b text-xs uppercase tracking-wider min-w-[80px]">
                  اليوم / الحصة
                </th>
                {periods.map((p, i) => (
                  <th key={i} className="sticky top-0 bg-card px-3 py-3 text-center font-heading font-semibold text-muted-foreground border-b text-xs min-w-[120px]">
                    <span className="whitespace-pre-line">{p}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-heading font-semibold text-sm bg-accent/30">{day}</td>
                  {schedule[day].map((subject, i) => (
                    <td key={i} className="px-2 py-2">
                      <div className={`rounded-lg border px-3 py-2.5 text-center text-sm font-heading font-medium ${subjectColors[subject] || "bg-muted"}`}>
                        {subject}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(subjectColors).map(([subject, cls]) => (
          <span key={subject} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-heading ${cls}`}>
            {subject}
          </span>
        ))}
      </div>
    </div>
  );
}
