-- Add phone to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- School settings table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings viewable" ON public.school_settings FOR SELECT TO public USING (true);
CREATE POLICY "settings manageable" ON public.school_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO public.school_settings (key, value) VALUES
  ('school_name', 'مدرسة الرِّفعة'),
  ('school_phone', '011-1234567'),
  ('school_email', 'info@rifaschool.edu'),
  ('school_address', 'الرياض - حي النزهة'),
  ('academic_year', '2025-2026'),
  ('semester', 'الفصل الثاني'),
  ('attendance_notifications', 'true'),
  ('grades_notifications', 'true'),
  ('messages_notifications', 'true'),
  ('weekly_reports', 'false')
ON CONFLICT (key) DO NOTHING;
