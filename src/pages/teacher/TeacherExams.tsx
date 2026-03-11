import { useAuth } from "@/contexts/AuthContext";
import ExamsPage from "@/pages/admin/ExamsPage";

// Teacher sees the same exam builder but filtered to their exams
export default function TeacherExams() {
  return <ExamsPage />;
}
