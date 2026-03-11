import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import ParentsPage from "@/pages/admin/ParentsPage";
import ClassesPage from "@/pages/admin/ClassesPage";
import Courses from "@/pages/Courses";
import Grades from "@/pages/Grades";
import Attendance from "@/pages/Attendance";
import SchedulePage from "@/pages/admin/SchedulePage";
import LessonsPage from "@/pages/admin/LessonsPage";
import ExamsPage from "@/pages/admin/ExamsPage";
import Reports from "@/pages/Reports";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";

// Teacher pages
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import MyClasses from "@/pages/teacher/MyClasses";
import TeacherLessons from "@/pages/teacher/TeacherLessons";
import TeacherExams from "@/pages/teacher/TeacherExams";
import TeacherAttendance from "@/pages/Attendance";

// Student pages
import StudentDashboard from "@/pages/student/StudentDashboard";
import MySchedule from "@/pages/student/MySchedule";
import MyLessons from "@/pages/student/MyLessons";
import MyExams from "@/pages/student/MyExams";
import MyGrades from "@/pages/student/MyGrades";
import MyAttendance from "@/pages/student/MyAttendance";

// Parent pages
import ParentDashboard from "@/pages/parent/ParentDashboard";
import MyChildren from "@/pages/parent/MyChildren";
import ChildrenGrades from "@/pages/parent/ChildrenGrades";
import ChildrenAttendance from "@/pages/parent/ChildrenAttendance";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case "teacher": return <TeacherDashboard />;
    case "student": return <StudentDashboard />;
    case "parent": return <ParentDashboard />;
    default: return <AdminDashboard />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Dynamic dashboard */}
            <Route path="/" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
            <Route path="/parents" element={<ProtectedRoute><ParentsPage /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Teacher routes */}
            <Route path="/my-classes" element={<ProtectedRoute><MyClasses /></ProtectedRoute>} />
            <Route path="/teacher-lessons" element={<ProtectedRoute><TeacherLessons /></ProtectedRoute>} />
            <Route path="/teacher-exams" element={<ProtectedRoute><TeacherExams /></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/my-schedule" element={<ProtectedRoute><MySchedule /></ProtectedRoute>} />
            <Route path="/my-lessons" element={<ProtectedRoute><MyLessons /></ProtectedRoute>} />
            <Route path="/my-exams" element={<ProtectedRoute><MyExams /></ProtectedRoute>} />
            <Route path="/my-grades" element={<ProtectedRoute><MyGrades /></ProtectedRoute>} />
            <Route path="/my-attendance" element={<ProtectedRoute><MyAttendance /></ProtectedRoute>} />

            {/* Parent routes */}
            <Route path="/my-children" element={<ProtectedRoute><MyChildren /></ProtectedRoute>} />
            <Route path="/children-grades" element={<ProtectedRoute><ChildrenGrades /></ProtectedRoute>} />
            <Route path="/children-attendance" element={<ProtectedRoute><ChildrenAttendance /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
