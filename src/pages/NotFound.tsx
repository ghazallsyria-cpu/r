import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted" dir="rtl">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-xl font-heading font-semibold text-foreground">الصفحة غير موجودة</p>
        <p className="mb-6 text-muted-foreground text-sm">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
        <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-medium hover:bg-primary/90 transition-colors">
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
};

export default NotFound;
