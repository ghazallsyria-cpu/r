-- ============================================================
-- Migration: Per-period attendance system
-- ============================================================

-- Step 1: Add period_number + subject_id to attendance
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS period_number INT DEFAULT 1 CHECK (period_number BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS timetable_slot_id UUID REFERENCES public.timetable(id) ON DELETE SET NULL;

-- Step 2: Drop old unique constraint (student_id, date) and add new one (student_id, date, period_number)
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_date_period_key UNIQUE (student_id, date, period_number);

-- Step 3: Update existing records to period_number = 1 (backward compat)
UPDATE public.attendance SET period_number = 1 WHERE period_number IS NULL;

-- Rebuild index
DROP INDEX IF EXISTS idx_attendance_student_date;
CREATE INDEX idx_attendance_student_date_period ON public.attendance(student_id, date, period_number);
CREATE INDEX idx_attendance_class_date_period ON public.attendance(class_id, date, period_number);
CREATE INDEX idx_attendance_subject ON public.attendance(subject_id);
