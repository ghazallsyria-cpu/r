import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherClasses, getStudentsByClass } from "@/lib/api";
import { useState } from "react";
import { FolderOpen, Users, X } from "lucide-react";

export default function MyClasses() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const { data: myClasses, isLoading } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: () => getTeacherClasses(user!.id),
    enabled: !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["class-students", selectedClass?.class_id],
    queryFn: () => getStudentsByClass(selectedClass.class_id),
    enabled: !!selectedClass,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">فصولي</h1>
        <p className="text-muted-foreground text-sm mt-1">الفصول المسندة إليك</p>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && <p className="text-muted-foreground col-span-full text-center py-8">جارٍ التحميل...</p>}
            {myClasses?.map((tc: any) => (
              <div key={tc.id} onClick={() => setSelectedClass(tc)}
                className={`bg-card rounded-lg border p-5 cursor-pointer hover:shadow-md transition-shadow ${selectedClass?.id === tc.id ? "ring-2 ring-primary" : ""}`}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold">{tc.classes?.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">المرحلة {tc.classes?.grade} - شعبة {tc.classes?.section}</p>
              </div>
            ))}
            {!isLoading && (!myClasses || myClasses.length === 0) && <p className="text-muted-foreground col-span-full text-center py-8">لم تُسند إليك فصول بعد</p>}
          </div>
        </div>

        {selectedClass && (
          <div className="w-full lg:w-[380px] bg-card rounded-lg border p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> طلاب الفصل</h3>
              <button onClick={() => setSelectedClass(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {students?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2 text-sm">
                  <span>{s.full_name}</span>
                  <span className="text-xs text-muted-foreground">{s.national_id}</span>
                </div>
              ))}
              {(!students || students.length === 0) && <p className="text-xs text-muted-foreground text-center py-4">لا يوجد طلاب</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
