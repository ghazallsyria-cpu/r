import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTimetableByClass } from "@/lib/api";
import { Video, Clock, MapPin, BookOpen, Calendar } from "lucide-react";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAY_INDICES = [0, 1, 2, 3, 4];
const todayNum = new Date().getDay();

export default function MySchedule() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number>(DAY_INDICES.includes(todayNum) ? todayNum : 0);

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ["timetable", user?.class_id],
    queryFn: () => getTimetableByClass(user!.class_id!),
    enabled: !!user?.class_id
  });

  const byDay: Record<number, any[]> = {};
  DAY_INDICES.forEach(d => { byDay[d] = []; });
  (timetable as any[]).forEach(s => { if (byDay[s.day_of_week] !== undefined) byDay[s.day_of_week].push(s); });

  const daySlots = (byDay[selectedDay] || []).sort((a: any, b: any) => a.period_number - b.period_number);
  const todaySlots = (byDay[todayNum] || []).filter((s: any) => s.subjects);

  if (!user?.class_id) return (
    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20"/>
      <p>لم يتم تخصيص فصل دراسي لحسابك. تواصل مع المدير.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">جدولي الدراسي</h1>
        <p className="text-muted-foreground text-sm mt-1">جدول الحصص الأسبوعي</p>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}

      {!isLoading && timetable.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20"/>
          <p className="font-heading">لم يتم إعداد الجدول الدراسي بعد</p>
          <p className="text-xs mt-1">سيظهر هنا بعد أن يضيفه المدير</p>
        </div>
      )}

      {timetable.length > 0 && (
        <>
          {/* Today highlight */}
          {DAY_INDICES.includes(todayNum) && todaySlots.length > 0 && selectedDay !== todayNum && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h2 className="font-heading font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4"/>حصص اليوم — {DAYS[todayNum]}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {todaySlots.map((s: any) => (
                  <div key={s.id} className="bg-card border rounded-lg px-3 py-2 text-xs">
                    <p className="font-semibold">{s.subjects?.name}</p>
                    <p className="text-muted-foreground">{s.start_time} - {s.end_time}</p>
                    {s.zoom_link && (
                      <a href={s.zoom_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-info hover:underline">
                        <Video className="w-3 h-3"/>انضم
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day tabs */}
          <div className="flex rounded-xl border overflow-hidden bg-card">
            {DAY_INDICES.map(day => (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`flex-1 py-3 text-sm font-heading font-medium transition-colors relative ${selectedDay===day?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent"}`}>
                <span>{DAYS[day]}</span>
                {day === todayNum && <span className={`absolute top-1.5 right-[calc(50%-10px)] w-1.5 h-1.5 rounded-full ${selectedDay===day?"bg-white":"bg-primary"}`}/>}
                <span className="text-xs block opacity-60 mt-0.5">{byDay[day]?.filter((s: any)=>s.subjects).length||0} حصص</span>
              </button>
            ))}
          </div>

          {/* Slots */}
          <div className="space-y-3">
            {daySlots.length > 0 ? daySlots.map((slot: any) => {
              const isBreak = !slot.subjects;
              const hasZoom = !!slot.zoom_link;
              return (
                <div key={slot.id} className={`bg-card rounded-xl border p-4 flex items-center gap-4 ${hasZoom?"border-info/30":""}  ${isBreak?"opacity-60":""}`}>
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-heading font-bold shrink-0 ${hasZoom?"bg-info/10 text-info":isBreak?"bg-accent text-muted-foreground":"bg-primary/10 text-primary"}`}>
                    <span className="text-base leading-none">{slot.period_number}</span>
                    <span className="font-normal opacity-70 mt-0.5">حصة</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-sm">{isBreak?"استراحة / نشاط":slot.subjects?.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3"/>{slot.start_time} — {slot.end_time}</span>
                      {slot.teacher && <span className="text-xs text-muted-foreground">👨‍🏫 {slot.teacher.full_name}</span>}
                      {slot.room && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3"/>{slot.room}</span>}
                    </div>
                    {slot.notes && <p className="text-xs text-muted-foreground mt-1 italic">{slot.notes}</p>}
                  </div>
                  {hasZoom && (
                    <a href={slot.zoom_link} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-info text-white rounded-xl text-sm font-heading font-semibold hover:bg-info/90 transition-colors shadow-sm">
                      <Video className="w-4 h-4"/>انضم للحصة
                    </a>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-10 text-muted-foreground bg-card rounded-lg border">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                <p className="text-sm">لا توجد حصص يوم {DAYS[selectedDay]}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
