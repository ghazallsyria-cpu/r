import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, getSubjects, getTeachersByClass, getTimetableByClass, upsertTimetableSlot, deleteTimetableSlot } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Save, Link, Clock, Edit3, Calendar } from "lucide-react";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAY_INDICES = [0, 1, 2, 3, 4]; // Sun-Thu (Saudi school week)

const DEFAULT_TIMES = [
  { start: "07:30", end: "08:15" },
  { start: "08:15", end: "09:00" },
  { start: "09:00", end: "09:45" },
  { start: "09:45", end: "10:30" },
  { start: "10:30", end: "10:50" }, // break
  { start: "10:50", end: "11:35" },
  { start: "11:35", end: "12:20" },
  { start: "12:20", end: "13:05" },
];

type SlotForm = {
  subject_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  room: string;
  zoom_link: string;
  notes: string;
};

const emptyForm: SlotForm = {
  subject_id: "", teacher_id: "", start_time: "", end_time: "",
  room: "", zoom_link: "", notes: ""
};

export default function SchedulePage() {
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("");
  const [periods, setPeriods] = useState(6);
  const [editSlot, setEditSlot] = useState<{ day: number; period: number; existing?: any } | null>(null);
  const [form, setForm] = useState<SlotForm>(emptyForm);

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: classTeachers = [] } = useQuery({
    queryKey: ["teachers-class", selectedClass],
    queryFn: () => getTeachersByClass(selectedClass),
    enabled: !!selectedClass
  });
  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ["timetable", selectedClass],
    queryFn: () => getTimetableByClass(selectedClass),
    enabled: !!selectedClass
  });

  const saveMut = useMutation({
    mutationFn: () => upsertTimetableSlot({
      class_id: selectedClass,
      day_of_week: editSlot!.day,
      period_number: editSlot!.period,
      start_time: form.start_time || DEFAULT_TIMES[editSlot!.period - 1]?.start || "07:30",
      end_time: form.end_time || DEFAULT_TIMES[editSlot!.period - 1]?.end || "08:15",
      subject_id: form.subject_id || null,
      teacher_id: form.teacher_id || null,
      room: form.room,
      zoom_link: form.zoom_link,
      notes: form.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable", selectedClass] });
      setEditSlot(null);
      toast.success("تم حفظ الحصة");
    },
    onError: () => toast.error("خطأ في الحفظ")
  });

  const deleteMut = useMutation({
    mutationFn: deleteTimetableSlot,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timetable", selectedClass] }); toast.success("تم الحذف"); }
  });

  // Build slot map: [day][period] => slot
  const slotMap: Record<string, any> = {};
  (timetable as any[]).forEach(s => { slotMap[`${s.day_of_week}-${s.period_number}`] = s; });

  const openEdit = (day: number, period: number) => {
    const existing = slotMap[`${day}-${period}`];
    const defTime = DEFAULT_TIMES[period - 1];
    setEditSlot({ day, period, existing });
    setForm({
      subject_id: existing?.subject_id || "",
      teacher_id: existing?.teacher_id || "",
      start_time: existing?.start_time || defTime?.start || "07:30",
      end_time: existing?.end_time || defTime?.end || "08:15",
      room: existing?.room || "",
      zoom_link: existing?.zoom_link || "",
      notes: existing?.notes || "",
    });
  };

  const periodNumbers = Array.from({ length: periods }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">الجدول الدراسي</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الجداول الأسبوعية للفصول الدراسية</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-lg border p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-muted-foreground block mb-1.5">الفصل الدراسي</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"
          >
            <option value="">اختر فصلاً</option>
            {(classes as any[]).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} — {c.grade}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">عدد الحصص يومياً</label>
          <select
            value={periods}
            onChange={e => setPeriods(+e.target.value)}
            className="px-4 py-2.5 bg-background border rounded-lg text-sm"
          >
            {[4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} حصص</option>)}
          </select>
        </div>
        {selectedClass && (
          <div className="text-xs text-muted-foreground bg-accent/50 px-3 py-2 rounded-lg">
            <span className="font-semibold text-foreground">💡 نصيحة:</span> اضغط على أي خلية لإضافة أو تعديل الحصة
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      {selectedClass ? (
        isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="border border-border px-3 py-3 text-right font-heading text-xs text-muted-foreground w-24">
                      الحصة
                    </th>
                    {DAYS.map((day, i) => (
                      <th key={i} className="border border-border px-3 py-3 text-center font-heading font-semibold min-w-40">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodNumbers.map(period => {
                    const defTime = DEFAULT_TIMES[period - 1];
                    return (
                      <tr key={period} className="hover:bg-accent/20 transition-colors">
                        <td className="border border-border px-3 py-2 bg-accent/10 text-center">
                          <p className="font-heading font-bold text-xs text-primary">{period}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {defTime?.start || "--:--"}
                          </p>
                        </td>
                        {DAY_INDICES.map(day => {
                          const slot = slotMap[`${day}-${period}`];
                          return (
                            <td
                              key={day}
                              onClick={() => openEdit(day, period)}
                              className="border border-border px-2 py-2 cursor-pointer group relative"
                            >
                              {slot ? (
                                <div className="rounded-lg p-2 bg-primary/8 border border-primary/20 hover:border-primary/40 transition-colors min-h-16">
                                  <p className="font-heading font-semibold text-xs text-primary leading-tight">{slot.subjects?.name || "—"}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{slot.teacher?.full_name || ""}</p>
                                  {slot.room && <p className="text-[10px] text-muted-foreground">🏫 {slot.room}</p>}
                                  {slot.zoom_link && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-info mt-0.5">
                                      <Link className="w-2.5 h-2.5" /> أون لاين
                                    </span>
                                  )}
                                  <button
                                    onClick={e => { e.stopPropagation(); deleteMut.mutate(slot.id); }}
                                    className="absolute top-1 left-1 p-0.5 rounded text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="min-h-16 rounded-lg border-2 border-dashed border-transparent group-hover:border-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Plus className="w-4 h-4 text-primary/50" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-3 border-t bg-accent/10 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20 border border-primary/30 inline-block" />حصة مضافة</span>
              <span className="flex items-center gap-1.5"><Link className="w-3 h-3 text-info" />حصة أون لاين (زوم)</span>
              <span>اضغط على الخلية للتعديل • اضغط ✕ للحذف</span>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-heading text-lg">اختر فصلاً دراسياً</p>
          <p className="text-sm mt-1">لعرض وتعديل جدوله الدراسي</p>
        </div>
      )}

      {/* Edit/Add Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setEditSlot(null)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-heading font-bold text-lg">
                  {editSlot.existing ? "تعديل الحصة" : "إضافة حصة"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {DAYS[editSlot.day]} • الحصة {editSlot.period}
                </p>
              </div>
              <button onClick={() => setEditSlot(null)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">وقت البداية</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">وقت النهاية</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">المادة الدراسية</label>
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
                  <option value="">— بدون مادة (استراحة/نشاط) —</option>
                  {(subjects as any[]).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">المعلم</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
                  <option value="">— اختر معلماً —</option>
                  {(classTeachers as any[]).map((t: any) => (
                    <option key={t.teacher_id} value={t.teacher_id}>{t.teacher?.full_name}</option>
                  ))}
                </select>
                {classTeachers.length === 0 && (
                  <p className="text-xs text-warning mt-1">لا يوجد معلمون مخصصون لهذا الفصل. أضفهم من صفحة المعلمين أولاً.</p>
                )}
              </div>

              {/* Room */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">رقم/اسم القاعة (اختياري)</label>
                <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                  placeholder="مثال: قاعة 101" className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              </div>

              {/* Zoom Link */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-info" />
                  رابط زوم / اجتماع أون لاين (اختياري)
                </label>
                <input value={form.zoom_link} onChange={e => setForm({ ...form, zoom_link: e.target.value })}
                  placeholder="https://zoom.us/j/..." className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm font-mono text-xs" dir="ltr" />
                {form.zoom_link && (
                  <p className="text-xs text-info mt-1 bg-info/5 border border-info/20 rounded px-2 py-1">
                    ✓ سيظهر للطالب زر "الانضمام للحصة" في جدوله
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ملاحظات (اختياري)</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="أي ملاحظات للطالب..." className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button onClick={() => setEditSlot(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                {editSlot.existing && (
                  <button onClick={() => { deleteMut.mutate(editSlot.existing!.id); setEditSlot(null); }}
                    className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">
                    حذف الحصة
                  </button>
                )}
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
                  <Save className="w-4 h-4" />
                  {saveMut.isPending ? "جارٍ الحفظ..." : "حفظ الحصة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
