# مدرسة الرِّفعة - نظام إدارة متكامل

## Design System
- Fonts: Cairo (headings), IBM Plex Sans Arabic (body)
- Colors: Papyrus White bg (#F8F5F0), Courtyard Green primary (#007B5F), Ink Black text (#2D2A26), Dry Clay muted (#A8A199), Terracotta Red destructive (#C94444)
- RTL layout with right-hand sidebar navigation
- Focus Panel pattern for detail views (responsive: full mobile, 45% desktop)

## Architecture
- AuthContext with 4 roles: admin, teacher, student, parent
- Role-based navigation in DashboardLayout (different nav per role)
- Role-based dashboard routing (RoleDashboard component)
- Custom auth via users table (national_id + password_hash)
- Admin: 1000000001 / admin123

## Database Tables
- users (students, teachers, admin, parent with role field)
- classes, subjects, teacher_classes, teacher_subjects
- attendance, grades
- parents (user_id -> student_id links)
- lessons, lesson_files
- exams, exam_questions, student_answers, exam_results
- messages (sender_id, receiver_id, content)
- notifications (user_id, title, body, type, is_read)

## Pages by Role
- Admin: Dashboard, Students, Teachers, Parents, Classes, Courses, Grades, Attendance, Lessons, Exams, Reports, Messages, Settings
- Teacher: Dashboard, MyClasses, Lessons, Exams, Grades, Attendance, Students, Messages
- Student: Dashboard, MyLessons, MyExams, MyGrades, MyAttendance, Messages
- Parent: Dashboard, MyChildren, ChildrenGrades, ChildrenAttendance, Messages
