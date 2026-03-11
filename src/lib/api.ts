import { supabase } from "@/integrations/supabase/client";

// ===== Students =====
export async function getStudents() {
  const { data, error } = await supabase.from("users").select("*, classes(*)").eq("role", "student").order("full_name");
  if (error) throw error; return data;
}
export async function getStudentsByClass(classId: string) {
  const { data, error } = await supabase.from("users").select("*, classes(*)").eq("role", "student").eq("class_id", classId).order("full_name");
  if (error) throw error; return data;
}
export async function addStudent(s: { full_name: string; national_id: string; password_hash: string; class_id: string }) {
  const { data, error } = await supabase.from("users").insert({ ...s, role: "student" }).select().single();
  if (error) throw error; return data;
}
export async function updateStudent(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("users").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteStudent(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id); if (error) throw error;
}

// ===== Teachers =====
export async function getTeachers() {
  const { data, error } = await supabase.from("users").select("*").eq("role", "teacher").order("full_name");
  if (error) throw error; return data;
}
export async function addTeacher(t: { full_name: string; national_id: string; password_hash: string; phone?: string; notes?: string }) {
  const { data, error } = await supabase.from("users").insert({ ...t, role: "teacher" }).select().single();
  if (error) throw error; return data;
}
export async function updateTeacher(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("users").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteTeacher(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id); if (error) throw error;
}

// ===== Parents =====
export async function getParents() {
  const { data, error } = await supabase.from("users").select("*").eq("role", "parent").order("full_name");
  if (error) throw error; return data;
}
export async function addParent(p: { full_name: string; national_id: string; password_hash: string; phone?: string }) {
  const { data, error } = await supabase.from("users").insert({ ...p, role: "parent" }).select().single();
  if (error) throw error; return data;
}
export async function updateParent(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("users").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteParent(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id); if (error) throw error;
}
export async function linkParentToStudent(parentUserId: string, studentId: string) {
  const { error } = await supabase.from("parents").insert({ user_id: parentUserId, student_id: studentId }); if (error) throw error;
}
export async function getParentChildren(parentUserId: string) {
  const { data, error } = await supabase.from("parents").select("*, student:student_id(id, full_name, national_id, class_id, classes:class_id(name, grade, section))").eq("user_id", parentUserId);
  if (error) throw error; return data;
}
export async function removeParentLink(parentUserId: string, studentId: string) {
  const { error } = await supabase.from("parents").delete().eq("user_id", parentUserId).eq("student_id", studentId); if (error) throw error;
}

// ===== Classes =====
export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*").order("grade").order("section");
  if (error) throw error; return data;
}
export async function addClass(cls: { name: string; grade: string; section: string; track?: string }) {
  const { data, error } = await supabase.from("classes").insert(cls).select().single();
  if (error) throw error; return data;
}
export async function updateClass(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("classes").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteClass(id: string) {
  const { error } = await supabase.from("classes").delete().eq("id", id); if (error) throw error;
}
export async function getClassStats(classId: string) {
  const [sRes, tRes, gRes, aRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).eq("role", "student").eq("class_id", classId),
    supabase.from("teacher_classes").select("teacher_id", { count: "exact" }).eq("class_id", classId),
    supabase.from("grades").select("score, max_score").eq("class_id", classId),
    supabase.from("attendance").select("status").eq("class_id", classId),
  ]);
  const grades = gRes.data || [];
  const avgGrade = grades.length > 0 ? (grades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / grades.length).toFixed(1) : "0";
  const att = aRes.data || [];
  const present = att.filter(a => a.status === "حاضر").length;
  const attRate = att.length > 0 ? ((present / att.length) * 100).toFixed(1) : "0";
  return { studentCount: sRes.count || 0, teacherCount: tRes.count || 0, avgGrade: Number(avgGrade), attendanceRate: Number(attRate) };
}

// ===== Subjects =====
export async function getSubjects() {
  const { data, error } = await supabase.from("subjects").select("*").order("name");
  if (error) throw error; return data;
}
export async function addSubject(sub: { name: string; code: string }) {
  const { data, error } = await supabase.from("subjects").insert(sub).select().single();
  if (error) throw error; return data;
}
export async function updateSubject(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("subjects").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteSubject(id: string) {
  const { error } = await supabase.from("subjects").delete().eq("id", id); if (error) throw error;
}
export async function getSubjectStats(subjectId: string) {
  const [gRes, tRes, lRes, eRes] = await Promise.all([
    supabase.from("grades").select("score, max_score, student_id").eq("subject_id", subjectId),
    supabase.from("teacher_subjects").select("teacher_id, teacher:teacher_id(id, full_name, national_id)").eq("subject_id", subjectId),
    supabase.from("lessons").select("id", { count: "exact" }).eq("subject_id", subjectId),
    supabase.from("exams").select("id", { count: "exact" }).eq("subject_id", subjectId),
  ]);
  const grades = gRes.data || [];
  const avgGrade = grades.length > 0 ? (grades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / grades.length).toFixed(1) : "0";
  const passCount = grades.filter(g => (g.score / g.max_score) * 100 >= 50).length;
  return { avgGrade: Number(avgGrade), totalStudents: new Set(grades.map(g => g.student_id)).size, passCount, failCount: grades.length - passCount, teachers: tRes.data || [], lessonCount: lRes.count || 0, examCount: eRes.count || 0 };
}

// ===== Teacher Assignments =====
export async function getTeacherClasses(teacherId: string) {
  const { data, error } = await supabase.from("teacher_classes").select("*, classes(*)").eq("teacher_id", teacherId);
  if (error) throw error; return data;
}
export async function getTeacherSubjects(teacherId: string) {
  const { data, error } = await supabase.from("teacher_subjects").select("*, subjects(*)").eq("teacher_id", teacherId);
  if (error) throw error; return data;
}
export async function assignTeacherClass(tid: string, cid: string) {
  const { error } = await supabase.from("teacher_classes").insert({ teacher_id: tid, class_id: cid }); if (error) throw error;
}
export async function removeTeacherClass(tid: string, cid: string) {
  const { error } = await supabase.from("teacher_classes").delete().eq("teacher_id", tid).eq("class_id", cid); if (error) throw error;
}
export async function assignTeacherSubject(tid: string, sid: string) {
  const { error } = await supabase.from("teacher_subjects").insert({ teacher_id: tid, subject_id: sid }); if (error) throw error;
}
export async function removeTeacherSubject(tid: string, sid: string) {
  const { error } = await supabase.from("teacher_subjects").delete().eq("teacher_id", tid).eq("subject_id", sid); if (error) throw error;
}
export async function getTeachersByClass(classId: string) {
  const { data, error } = await supabase.from("teacher_classes").select("*, teacher:teacher_id(id, full_name, national_id, phone)").eq("class_id", classId);
  if (error) throw error; return data;
}
export async function getTeachersBySubject(subjectId: string) {
  const { data, error } = await supabase.from("teacher_subjects").select("*, teacher:teacher_id(id, full_name, national_id)").eq("subject_id", subjectId);
  if (error) throw error; return data;
}

// ===== Attendance =====
export async function getAttendanceByDate(date: string) {
  const { data, error } = await supabase.from("attendance").select("*, users:student_id(full_name, national_id, class_id, classes:class_id(name, grade, section))").eq("date", date);
  if (error) throw error; return data;
}
export async function getAttendanceByClassAndDate(classId: string, date: string) {
  const { data, error } = await supabase.from("attendance").select("*, users:student_id(full_name, national_id)").eq("class_id", classId).eq("date", date);
  if (error) throw error; return data;
}
export async function getAttendanceByStudent(studentId: string) {
  const { data, error } = await supabase.from("attendance").select("*").eq("student_id", studentId).order("date", { ascending: false }).limit(60);
  if (error) throw error; return data;
}
export async function upsertAttendance(records: { student_id: string; class_id: string; date: string; status: string; time?: string | null; recorded_by?: string }[]) {
  const { error } = await supabase.from("attendance").upsert(records, { onConflict: "student_id,date" }); if (error) throw error;
}
export async function getAttendanceRange(classId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase.from("attendance").select("date, status, student_id").eq("class_id", classId).gte("date", startDate).lte("date", endDate).order("date");
  if (error) throw error; return data;
}
export async function getAllAttendanceRange(startDate: string, endDate: string) {
  const { data, error } = await supabase.from("attendance").select("date, status").gte("date", startDate).lte("date", endDate);
  if (error) throw error; return data;
}

// ===== Grades =====
export async function getGradesByClass(classId: string) {
  const { data, error } = await supabase.from("grades").select("*, users:student_id(full_name, national_id), subjects:subject_id(name, code)").eq("class_id", classId);
  if (error) throw error; return data;
}
export async function getGradesByStudent(studentId: string) {
  const { data, error } = await supabase.from("grades").select("*, subjects:subject_id(name, code)").eq("student_id", studentId);
  if (error) throw error; return data;
}
export async function getGradesBySubjectAndClass(subjectId: string, classId: string) {
  const { data, error } = await supabase.from("grades").select("*, users:student_id(full_name, national_id)").eq("subject_id", subjectId).eq("class_id", classId);
  if (error) throw error; return data;
}
export async function upsertGrade(grade: { student_id: string; subject_id: string; class_id: string; grade_type: string; score: number; max_score: number; semester: string; recorded_by?: string }) {
  const { data, error } = await supabase.from("grades").upsert(grade, { onConflict: "student_id,subject_id,class_id,grade_type,semester" }).select().single();
  if (error) throw error; return data;
}
export async function deleteGrade(id: string) {
  const { error } = await supabase.from("grades").delete().eq("id", id); if (error) throw error;
}

// ===== Lessons =====
export async function getLessons(filters?: { subject_id?: string; class_id?: string; teacher_id?: string }) {
  let q = supabase.from("lessons").select("*, subjects:subject_id(name, code), classes:class_id(name, grade, section), teacher:teacher_id(full_name)").order("lesson_order");
  if (filters?.subject_id) q = q.eq("subject_id", filters.subject_id);
  if (filters?.class_id) q = q.eq("class_id", filters.class_id);
  if (filters?.teacher_id) q = q.eq("teacher_id", filters.teacher_id);
  const { data, error } = await q; if (error) throw error; return data;
}
export async function addLesson(lesson: { title: string; content?: string; subject_id: string; class_id: string; teacher_id: string; lesson_order?: number; is_published?: boolean }) {
  const { data, error } = await supabase.from("lessons").insert(lesson).select().single();
  if (error) throw error; return data;
}
export async function updateLesson(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("lessons").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteLesson(id: string) {
  const { error } = await supabase.from("lessons").delete().eq("id", id); if (error) throw error;
}
export async function getLessonFiles(lessonId: string) {
  const { data, error } = await supabase.from("lesson_files").select("*").eq("lesson_id", lessonId).order("created_at");
  if (error) throw error; return data;
}
export async function addLessonFile(file: { lesson_id: string; file_name: string; file_url: string; file_type: string; file_size?: number }) {
  const { data, error } = await supabase.from("lesson_files").insert(file).select().single();
  if (error) throw error; return data;
}
export async function deleteLessonFile(id: string) {
  const { error } = await supabase.from("lesson_files").delete().eq("id", id); if (error) throw error;
}

// ===== Exams =====
export async function getExams(filters?: { class_id?: string; subject_id?: string; teacher_id?: string }) {
  let q = supabase.from("exams").select("*, subjects:subject_id(name, code), classes:class_id(name, grade, section), teacher:teacher_id(full_name)").order("created_at", { ascending: false });
  if (filters?.class_id) q = q.eq("class_id", filters.class_id);
  if (filters?.subject_id) q = q.eq("subject_id", filters.subject_id);
  if (filters?.teacher_id) q = q.eq("teacher_id", filters.teacher_id);
  const { data, error } = await q; if (error) throw error; return data;
}
export async function addExam(exam: { title: string; subject_id: string; class_id: string; teacher_id: string; exam_type?: string; duration_minutes?: number; total_marks?: number; is_published?: boolean; start_time?: string; end_time?: string }) {
  const { data, error } = await supabase.from("exams").insert(exam).select().single();
  if (error) throw error; return data;
}
export async function updateExam(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("exams").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteExam(id: string) {
  const { error } = await supabase.from("exams").delete().eq("id", id); if (error) throw error;
}
export async function getExamQuestions(examId: string) {
  const { data, error } = await supabase.from("exam_questions").select("*").eq("exam_id", examId).order("question_order");
  if (error) throw error; return data;
}
export async function addExamQuestion(q: { exam_id: string; question_text: string; question_type?: string; options?: any; correct_answer: string; marks?: number; question_order?: number }) {
  const { data, error } = await supabase.from("exam_questions").insert(q).select().single();
  if (error) throw error; return data;
}
export async function updateExamQuestion(id: string, u: Record<string, any>) {
  const { data, error } = await supabase.from("exam_questions").update(u).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteExamQuestion(id: string) {
  const { error } = await supabase.from("exam_questions").delete().eq("id", id); if (error) throw error;
}
export async function submitExamAnswers(examId: string, studentId: string, answers: { question_id: string; answer: string }[]) {
  const records = answers.map(a => ({ exam_id: examId, student_id: studentId, ...a }));
  const { error } = await supabase.from("student_answers").insert(records); if (error) throw error;
}
export async function getExamResults(examId: string) {
  const { data, error } = await supabase.from("exam_results").select("*, student:student_id(full_name, national_id)").eq("exam_id", examId);
  if (error) throw error; return data;
}
export async function getStudentExamResults(studentId: string) {
  const { data, error } = await supabase.from("exam_results").select("*, exam:exam_id(title, subject_id, subjects:subject_id(name))").eq("student_id", studentId);
  if (error) throw error; return data;
}
export async function upsertExamResult(result: { exam_id: string; student_id: string; total_marks: number; obtained_marks: number; percentage: number; status: string; submitted_at?: string }) {
  const { data, error } = await supabase.from("exam_results").upsert(result, { onConflict: "exam_id,student_id" }).select().single();
  if (error) throw error; return data;
}

// ===== Messages =====
export async function getConversations(userId: string) {
  const { data, error } = await supabase.from("messages").select("*, sender:sender_id(id, full_name, role), receiver:receiver_id(id, full_name, role)").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false });
  if (error) throw error; return data;
}
export async function getAllMessages() {
  const { data, error } = await supabase.from("messages").select("*, sender:sender_id(id, full_name, role), receiver:receiver_id(id, full_name, role)").order("created_at", { ascending: false }).limit(200);
  if (error) throw error; return data;
}
export async function getMessagesBetween(userId1: string, userId2: string) {
  const { data, error } = await supabase.from("messages").select("*, sender:sender_id(full_name)").or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`).order("created_at");
  if (error) throw error; return data;
}
export async function sendMessage(msg: { sender_id: string; receiver_id: string; content: string }) {
  const { data, error } = await supabase.from("messages").insert(msg).select().single();
  if (error) throw error; return data;
}
export async function markMessagesRead(userId: string, senderId: string) {
  const { error } = await supabase.from("messages").update({ is_read: true }).eq("receiver_id", userId).eq("sender_id", senderId).eq("is_read", false);
  if (error) throw error;
}
export async function deleteMessage(id: string) {
  const { error } = await supabase.from("messages").delete().eq("id", id); if (error) throw error;
}

// ===== Notifications =====
export async function getNotifications(userId: string) {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error; return data;
}
export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id); if (error) throw error;
}
export async function createNotification(n: { user_id: string; title: string; body: string; type?: string }) {
  const { error } = await supabase.from("notifications").insert(n); if (error) throw error;
}

// ===== Dashboard Stats =====
export async function getDashboardStats() {
  const [students, teachers, classes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).eq("role", "student"),
    supabase.from("users").select("id", { count: "exact" }).eq("role", "teacher"),
    supabase.from("classes").select("id", { count: "exact" }),
  ]);
  const today = new Date().toISOString().split("T")[0];
  const attendance = await supabase.from("attendance").select("status").eq("date", today);
  const present = attendance.data?.filter(a => a.status === "حاضر").length || 0;
  const absent = attendance.data?.filter(a => a.status === "غائب").length || 0;
  const late = attendance.data?.filter(a => a.status === "متأخر").length || 0;
  const total = present + absent + late;
  return { totalStudents: students.count || 0, totalTeachers: teachers.count || 0, totalClasses: classes.count || 0, attendance: { present, absent, late, total, rate: total > 0 ? ((present / total) * 100).toFixed(1) : "0" } };
}

// ===== Reports =====
export async function getReportStats() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];
  const [students, teachers, classes, subjects, lessons, exams, grades, attendance] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).eq("role", "student"),
    supabase.from("users").select("id", { count: "exact" }).eq("role", "teacher"),
    supabase.from("classes").select("id", { count: "exact" }),
    supabase.from("subjects").select("id", { count: "exact" }),
    supabase.from("lessons").select("id, is_published"),
    supabase.from("exams").select("id, is_published"),
    supabase.from("grades").select("score, max_score"),
    supabase.from("attendance").select("status, date").gte("date", startDate).lte("date", endDate),
  ]);
  const gl = grades.data || [];
  const avgGrade = gl.length > 0 ? (gl.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / gl.length).toFixed(1) : "0";
  const al = attendance.data || [];
  const presentTotal = al.filter(a => a.status === "حاضر").length;
  const attRate = al.length > 0 ? ((presentTotal / al.length) * 100).toFixed(1) : "0";
  const attByDate: Record<string, { present: number; absent: number; late: number }> = {};
  al.forEach(a => {
    if (!attByDate[a.date]) attByDate[a.date] = { present: 0, absent: 0, late: 0 };
    if (a.status === "حاضر") attByDate[a.date].present++;
    else if (a.status === "غائب") attByDate[a.date].absent++;
    else attByDate[a.date].late++;
  });
  return {
    totalStudents: students.count || 0, totalTeachers: teachers.count || 0, totalClasses: classes.count || 0, totalSubjects: subjects.count || 0,
    totalLessons: lessons.data?.length || 0, publishedLessons: lessons.data?.filter(l => l.is_published).length || 0,
    totalExams: exams.data?.length || 0, publishedExams: exams.data?.filter(e => e.is_published).length || 0,
    avgGrade: Number(avgGrade), attendanceRate: Number(attRate),
    attendanceByDate: Object.entries(attByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, vals]) => ({ date: date.slice(5), ...vals })),
    gradeDistribution: [
      { range: "ممتاز 90+", count: gl.filter(g => (g.score / g.max_score) * 100 >= 90).length },
      { range: "جيد جداً 75-89", count: gl.filter(g => { const p = (g.score / g.max_score) * 100; return p >= 75 && p < 90; }).length },
      { range: "جيد 60-74", count: gl.filter(g => { const p = (g.score / g.max_score) * 100; return p >= 60 && p < 75; }).length },
      { range: "راسب -60", count: gl.filter(g => (g.score / g.max_score) * 100 < 60).length },
    ],
  };
}

// ===== Settings =====
export async function getSchoolSettings() {
  try {
    const { data, error } = await supabase.from("school_settings").select("*");
    if (error) throw error;
    return data;
  } catch {
    return [
      { key: "school_name", value: "مدرسة الرِّفعة" }, { key: "school_phone", value: "011-1234567" },
      { key: "school_email", value: "info@rifaschool.edu" }, { key: "school_address", value: "الرياض - حي النزهة" },
      { key: "academic_year", value: "2025-2026" }, { key: "semester", value: "الفصل الثاني" },
    ];
  }
}
export async function saveAllSchoolSettings(settings: Record<string, string>) {
  const records = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from("school_settings").upsert(records, { onConflict: "key" });
  if (error) throw error;
}

// ===== Users search =====
export async function searchUsers(query: string, excludeId?: string) {
  let q = supabase.from("users").select("id, full_name, role").ilike("full_name", `%${query}%`).limit(20);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q; if (error) throw error; return data;
}
export async function getAllUsers() {
  const { data, error } = await supabase.from("users").select("id, full_name, role").order("full_name");
  if (error) throw error; return data;
}

// ===== Timetable =====
export async function getTimetableByClass(classId: string) {
  const { data, error } = await supabase
    .from("timetable")
    .select("*, subjects:subject_id(id, name, code), teacher:teacher_id(id, full_name)")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("period_number");
  if (error) throw error;
  return data;
}
export async function upsertTimetableSlot(slot: {
  class_id: string; day_of_week: number; period_number: number;
  start_time: string; end_time: string;
  subject_id?: string | null; teacher_id?: string | null;
  room?: string; zoom_link?: string; notes?: string;
}) {
  const { data, error } = await supabase
    .from("timetable")
    .upsert(slot, { onConflict: "class_id,day_of_week,period_number" })
    .select().single();
  if (error) throw error;
  return data;
}
export async function deleteTimetableSlot(id: string) {
  const { error } = await supabase.from("timetable").delete().eq("id", id);
  if (error) throw error;
}
export async function getTimetableByTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from("timetable")
    .select("*, subjects:subject_id(id, name), classes:class_id(id, name, grade, section)")
    .eq("teacher_id", teacherId)
    .order("day_of_week").order("period_number");
  if (error) throw error;
  return data;
}

// ===== Attendance V2 (per-period) =====
export async function getAttendanceByClassDatePeriod(classId: string, date: string, periodNumber: number) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, users:student_id(id, full_name, national_id)")
    .eq("class_id", classId)
    .eq("date", date)
    .eq("period_number", periodNumber);
  if (error) throw error;
  return data;
}

export async function upsertAttendanceV2(records: {
  student_id: string; class_id: string; date: string;
  period_number: number; subject_id?: string | null;
  status: string; recorded_by?: string;
}[]) {
  const { error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "student_id,date,period_number" });
  if (error) throw error;
}

export async function getAttendanceForClassDay(classId: string, date: string) {
  // Returns all attendance records for a class on a given day, grouped by period
  const { data, error } = await supabase
    .from("attendance")
    .select("*, users:student_id(id, full_name, national_id), subjects:subject_id(id, name)")
    .eq("class_id", classId)
    .eq("date", date)
    .order("period_number");
  if (error) throw error;
  return data;
}

export async function getStudentAttendanceDetailed(studentId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, subjects:subject_id(id, name, code)")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .order("period_number")
    .limit(200);
  if (error) throw error;
  return data;
}

export async function getAttendanceStatsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("status, subject_id, period_number, date, subjects:subject_id(name)")
    .eq("student_id", studentId);
  if (error) throw error;

  const total = data?.length || 0;
  const present = data?.filter(r => r.status === "حاضر").length || 0;
  const absent = data?.filter(r => r.status === "غائب").length || 0;
  const late = data?.filter(r => r.status === "متأخر").length || 0;

  // Per-subject stats
  const bySubject: Record<string, any> = {};
  data?.forEach(r => {
    const name = (r.subjects as any)?.name || "غير محدد";
    if (!bySubject[name]) bySubject[name] = { name, total: 0, present: 0, absent: 0, late: 0 };
    bySubject[name].total++;
    if (r.status === "حاضر") bySubject[name].present++;
    else if (r.status === "غائب") bySubject[name].absent++;
    else bySubject[name].late++;
  });

  return {
    total, present, absent, late,
    rate: total > 0 ? ((present / total) * 100).toFixed(1) : "0",
    bySubject: Object.values(bySubject),
    records: data || []
  };
}

// ===== Teacher-scoped queries =====
export async function getTeacherTimetableSlots(teacherId: string) {
  const { data, error } = await supabase
    .from("timetable")
    .select("*, classes:class_id(id, name, grade, section), subjects:subject_id(id, name, code)")
    .eq("teacher_id", teacherId)
    .order("day_of_week")
    .order("period_number");
  if (error) throw error;
  return data;
}

export async function getTeacherDaySlots(teacherId: string, dayOfWeek: number) {
  const { data, error } = await supabase
    .from("timetable")
    .select("*, classes:class_id(id, name, grade, section), subjects:subject_id(id, name, code)")
    .eq("teacher_id", teacherId)
    .eq("day_of_week", dayOfWeek)
    .order("period_number");
  if (error) throw error;
  return data;
}
