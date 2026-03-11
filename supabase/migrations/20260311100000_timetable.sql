-- Timetable / Schedule table
-- Each row = one period slot in the weekly schedule for a class
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun,1=Mon...6=Sat
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  start_time TEXT NOT NULL DEFAULT '07:30',
  end_time TEXT NOT NULL DEFAULT '08:15',
  room TEXT DEFAULT '',
  zoom_link TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, day_of_week, period_number)
);
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timetable viewable" ON public.timetable FOR SELECT TO public USING (true);
CREATE POLICY "timetable manageable" ON public.timetable FOR ALL TO public USING (true) WITH CHECK (true);
CREATE INDEX idx_timetable_class ON public.timetable(class_id);
CREATE INDEX idx_timetable_teacher ON public.timetable(teacher_id);

-- Trigger for updated_at
CREATE TRIGGER update_timetable_updated_at
  BEFORE UPDATE ON public.timetable
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
