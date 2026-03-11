
-- Parents table
CREATE TABLE public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'ولي أمر',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents viewable" ON public.parents FOR SELECT TO public USING (true);
CREATE POLICY "parents manageable" ON public.parents FOR ALL TO public USING (true) WITH CHECK (true);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications viewable" ON public.notifications FOR SELECT TO public USING (true);
CREATE POLICY "notifications manageable" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- Lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  lesson_order int NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons viewable" ON public.lessons FOR SELECT TO public USING (true);
CREATE POLICY "lessons manageable" ON public.lessons FOR ALL TO public USING (true) WITH CHECK (true);

-- Lesson files table
CREATE TABLE public.lesson_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  file_size bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_files viewable" ON public.lesson_files FOR SELECT TO public USING (true);
CREATE POLICY "lesson_files manageable" ON public.lesson_files FOR ALL TO public USING (true) WITH CHECK (true);

-- Exams table
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_type text NOT NULL DEFAULT 'اختبار',
  duration_minutes int NOT NULL DEFAULT 60,
  total_marks numeric NOT NULL DEFAULT 100,
  is_published boolean NOT NULL DEFAULT false,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams viewable" ON public.exams FOR SELECT TO public USING (true);
CREATE POLICY "exams manageable" ON public.exams FOR ALL TO public USING (true) WITH CHECK (true);

-- Exam questions table
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb DEFAULT '[]',
  correct_answer text NOT NULL DEFAULT '',
  marks numeric NOT NULL DEFAULT 1,
  question_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_questions viewable" ON public.exam_questions FOR SELECT TO public USING (true);
CREATE POLICY "exam_questions manageable" ON public.exam_questions FOR ALL TO public USING (true) WITH CHECK (true);

-- Student answers table
CREATE TABLE public.student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer text DEFAULT '',
  is_correct boolean,
  marks_obtained numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_answers viewable" ON public.student_answers FOR SELECT TO public USING (true);
CREATE POLICY "student_answers manageable" ON public.student_answers FOR ALL TO public USING (true) WITH CHECK (true);

-- Exam results summary
CREATE TABLE public.exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_marks numeric NOT NULL DEFAULT 0,
  obtained_marks numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_results viewable" ON public.exam_results FOR SELECT TO public USING (true);
CREATE POLICY "exam_results manageable" ON public.exam_results FOR ALL TO public USING (true) WITH CHECK (true);

-- Messages table (replacing mock data)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages viewable" ON public.messages FOR SELECT TO public USING (true);
CREATE POLICY "messages manageable" ON public.messages FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add indexes
CREATE INDEX idx_lessons_subject ON public.lessons(subject_id);
CREATE INDEX idx_lessons_class ON public.lessons(class_id);
CREATE INDEX idx_lessons_teacher ON public.lessons(teacher_id);
CREATE INDEX idx_exams_class ON public.exams(class_id);
CREATE INDEX idx_exams_subject ON public.exams(subject_id);
CREATE INDEX idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX idx_student_answers_exam ON public.student_answers(exam_id);
CREATE INDEX idx_student_answers_student ON public.student_answers(student_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_parents_user ON public.parents(user_id);
CREATE INDEX idx_parents_student ON public.parents(student_id);
