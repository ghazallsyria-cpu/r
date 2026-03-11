import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSchoolSettings, saveAllSchoolSettings } from "@/lib/api";
import { toast } from "sonner";
import { Save, School, Bell, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [activeTab, setActiveTab] = useState("school");

  const { data = [], isLoading } = useQuery({ queryKey: ["school-settings"], queryFn: getSchoolSettings });

  useEffect(() => {
    if (data.length > 0) {
      const map: Record<string,string> = {};
      (data as any[]).forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  }, [data]);

  const saveMut = useMutation({ mutationFn: () => saveAllSchoolSettings(settings), onSuccess: () => toast.success("تم حفظ الإعدادات بنجاح"), onError: () => toast.error("خطأ في الحفظ") });

  const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));

  const tabs = [
    { id: "school", label: "المدرسة", icon: <School className="w-4 h-4" /> },
    { id: "notifications", label: "الإشعارات", icon: <Bell className="w-4 h-4" /> },
    { id: "account", label: "الحساب", icon: <User className="w-4 h-4" /> },
  ];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الإعدادات</h1><p className="text-muted-foreground text-sm mt-1">إدارة إعدادات النظام</p></div>
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90 disabled:opacity-70">
          <Save className="w-4 h-4" />{saveMut.isPending ? "جارٍ الحفظ..." : "حفظ جميع الإعدادات"}
        </button>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-heading border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "school" && (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-5 space-y-4">
            <h2 className="font-heading font-semibold">بيانات المدرسة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[["school_name","اسم المدرسة","text"],["school_phone","رقم الهاتف","text"],["school_email","البريد الإلكتروني","email"],["school_address","العنوان","text"]].map(([k,label,type])=>(
                <div key={k}>
                  <label className="text-sm text-muted-foreground block mb-1.5">{label}</label>
                  <input type={type} value={settings[k]||""} onChange={e=>set(k,e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-5 space-y-4">
            <h2 className="font-heading font-semibold">السنة الدراسية</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm text-muted-foreground block mb-1.5">السنة الدراسية</label><input value={settings["academic_year"]||""} onChange={e=>set("academic_year",e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/></div>
              <div><label className="text-sm text-muted-foreground block mb-1.5">الفصل الدراسي الحالي</label>
                <select value={settings["semester"]||""} onChange={e=>set("semester",e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
                  {["الفصل الأول","الفصل الثاني","الفصل الثالث"].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-heading font-semibold">إعدادات الإشعارات</h2>
          {[["attendance_notifications","إشعارات الغياب والحضور","إرسال إشعار لولي الأمر عند تسجيل غياب الطالب"],["grades_notifications","إشعارات الدرجات","إرسال إشعار عند إضافة درجة جديدة"],["messages_notifications","إشعارات الرسائل","إشعار عند استلام رسالة جديدة"],["weekly_reports","التقارير الأسبوعية","إرسال تقرير أسبوعي لأولياء الأمور"]].map(([k,label,desc])=>(
            <div key={k} className="flex items-center justify-between py-3 border-b last:border-0">
              <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
              <button onClick={()=>toggle(k)} className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${settings[k]==="true"?"bg-primary":"bg-muted"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings[k]==="true"?"translate-x-[20px]":"translate-x-[2px]"}`}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "account" && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-heading font-semibold">بيانات الحساب</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-lg">{user?.full_name?.[0]}</div>
              <div><p className="font-semibold">{user?.full_name}</p><p className="text-sm text-muted-foreground">{user?.role === "admin" ? "مدير" : user?.role}</p><p className="text-xs text-muted-foreground">{user?.national_id}</p></div>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 text-xs text-warning">
              ⚠️ لتغيير بيانات حسابك الشخصي يرجى التواصل مع مدير النظام
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
