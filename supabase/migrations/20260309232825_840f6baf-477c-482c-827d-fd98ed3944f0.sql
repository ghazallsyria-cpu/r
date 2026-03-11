
-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects viewable by everyone" ON public.subjects FOR SELECT TO public USING (true);
CREATE POLICY "Subjects manageable by authenticated" ON public.subjects FOR ALL TO public USING (true) WITH CHECK (true);

-- Teacher-Class assignments
CREATE TABLE public.teacher_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_classes viewable by everyone" ON public.teacher_classes FOR SELECT TO public USING (true);
CREATE POLICY "teacher_classes manageable" ON public.teacher_classes FOR ALL TO public USING (true) WITH CHECK (true);

-- Teacher-Subject assignments
CREATE TABLE public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_subjects viewable by everyone" ON public.teacher_subjects FOR SELECT TO public USING (true);
CREATE POLICY "teacher_subjects manageable" ON public.teacher_subjects FOR ALL TO public USING (true) WITH CHECK (true);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'حاضر' CHECK (status IN ('حاضر', 'غائب', 'متأخر')),
  time TEXT,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance viewable by everyone" ON public.attendance FOR SELECT TO public USING (true);
CREATE POLICY "attendance manageable" ON public.attendance FOR ALL TO public USING (true) WITH CHECK (true);

-- Grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  grade_type TEXT NOT NULL DEFAULT 'اختبار',
  score NUMERIC NOT NULL DEFAULT 0,
  max_score NUMERIC NOT NULL DEFAULT 100,
  semester TEXT NOT NULL DEFAULT 'الفصل الأول',
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades viewable by everyone" ON public.grades FOR SELECT TO public USING (true);
CREATE POLICY "grades manageable" ON public.grades FOR ALL TO public USING (true) WITH CHECK (true);

-- Add INSERT/UPDATE/DELETE policies to users and classes tables
CREATE POLICY "Users manageable" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Classes manageable" ON public.classes FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_grades_subject ON public.grades(subject_id);
CREATE INDEX idx_grades_class ON public.grades(class_id);
CREATE INDEX idx_teacher_classes_teacher ON public.teacher_classes(teacher_id);
CREATE INDEX idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_id);
