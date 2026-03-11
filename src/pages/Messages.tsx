import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations, getMessagesBetween, sendMessage, markMessagesRead, getAllMessages, getAllUsers, searchUsers } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, Search, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const roleLabel = (r: string) => r === "admin" ? "مدير" : r === "teacher" ? "معلم" : r === "student" ? "طالب" : "ولي أمر";
const roleColor = (r: string) => r === "admin" ? "text-destructive" : r === "teacher" ? "text-info" : r === "student" ? "text-success" : "text-warning";

export default function Messages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [adminView, setAdminView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({ queryKey: ["conversations", user?.id], queryFn: () => getConversations(user!.id), enabled: !!user, refetchInterval: 5000 });
  const { data: thread = [] } = useQuery({ queryKey: ["messages", user?.id, selectedUser?.id], queryFn: () => getMessagesBetween(user!.id, selectedUser!.id), enabled: !!user && !!selectedUser, refetchInterval: 3000 });
  const { data: allMessages = [] } = useQuery({ queryKey: ["all-messages"], queryFn: getAllMessages, enabled: user?.role === "admin" && adminView });
  const { data: allUsers = [] } = useQuery({ queryKey: ["all-users"], queryFn: getAllUsers, enabled: !!user });

  const sendMut = useMutation({
    mutationFn: () => sendMessage({ sender_id: user!.id, receiver_id: selectedUser!.id, content: message.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["conversations"] }); setMessage(""); },
    onError: () => toast.error("خطأ في الإرسال")
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);
  useEffect(() => {
    if (selectedUser && user) markMessagesRead(user.id, selectedUser.id).catch(() => {});
  }, [selectedUser, thread.length]);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const r = await searchUsers(q, user?.id);
    setSearchResults(r || []);
  };

  // Build unique conversations list
  const convMap = new Map<string, any>();
  (conversations as any[]).forEach((m: any) => {
    const otherId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
    const other = m.sender_id === user?.id ? m.receiver : m.sender;
    if (!convMap.has(otherId) || new Date(m.created_at) > new Date(convMap.get(otherId).created_at)) {
      convMap.set(otherId, { ...m, other, otherId });
    }
  });
  const convList = Array.from(convMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const unread = (conversations as any[]).filter((m: any) => m.receiver_id === user?.id && !m.is_read).length;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div><h1 className="font-heading text-2xl font-bold">الرسائل</h1>{unread > 0 && <span className="text-xs text-primary">{unread} رسالة غير مقروءة</span>}</div>
        {user?.role === "admin" && (
          <button onClick={() => setAdminView(!adminView)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${adminView ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
            <Eye className="w-4 h-4" />{adminView ? "عرضي" : "مراقبة الرسائل"}
          </button>
        )}
      </div>

      {adminView && user?.role === "admin" ? (
        <div className="bg-card rounded-lg border overflow-hidden flex-1 overflow-y-auto">
          <div className="p-3 border-b bg-accent/30"><h3 className="font-heading font-semibold text-sm">جميع الرسائل في النظام</h3></div>
          <div className="divide-y">
            {(allMessages as any[]).map((m: any) => (
              <div key={m.id} className="p-3 hover:bg-accent/30">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={`font-semibold ${roleColor(m.sender?.role)}`}>{m.sender?.full_name}</span>
                  <span className="text-muted-foreground">({roleLabel(m.sender?.role)})</span>
                  <span className="text-muted-foreground">→</span>
                  <span className={`font-semibold ${roleColor(m.receiver?.role)}`}>{m.receiver?.full_name}</span>
                  <span className="text-muted-foreground">({roleLabel(m.receiver?.role)})</span>
                  <span className="text-muted-foreground mr-auto">{new Date(m.created_at).toLocaleString("ar-SA")}</span>
                </div>
                <p className="text-sm">{m.content}</p>
              </div>
            ))}
            {allMessages.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">لا توجد رسائل</div>}
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-72 shrink-0 flex flex-col bg-card border rounded-lg overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="ابحث عن مستخدم..." className="w-full pr-9 pl-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 bg-card border rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map((u: any) => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setSearch(""); setSearchResults([]); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-right">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.full_name[0]}</div>
                      <div><p className="text-sm font-medium">{u.full_name}</p><p className={`text-xs ${roleColor(u.role)}`}>{roleLabel(u.role)}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {convList.map((c: any) => (
                <button key={c.otherId} onClick={() => setSelectedUser(c.other)} className={`w-full flex items-center gap-3 p-3 text-right hover:bg-accent/50 transition-colors ${selectedUser?.id === c.otherId ? "bg-accent" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading font-bold text-primary shrink-0">{c.other?.full_name?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium truncate">{c.other?.full_name}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{new Date(c.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.content}</p>
                  </div>
                </button>
              ))}
              {convList.length === 0 && <div className="text-center py-8 text-muted-foreground text-xs">لا توجد محادثات<br/>ابحث عن مستخدم للبدء</div>}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-card border rounded-lg overflow-hidden">
            {selectedUser ? (
              <>
                <div className="p-3 border-b flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">{selectedUser.full_name[0]}</div>
                  <div><p className="font-heading font-semibold text-sm">{selectedUser.full_name}</p><p className={`text-xs ${roleColor(selectedUser.role)}`}>{roleLabel(selectedUser.role)}</p></div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(thread as any[]).map((m: any) => {
                    const isMine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine ? "bg-primary text-primary-foreground rounded-bl-sm" : "bg-accent rounded-br-sm"}`}>
                          <p>{m.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && message.trim()) { e.preventDefault(); sendMut.mutate(); } }} placeholder="اكتب رسالتك..." className="flex-1 px-4 py-2.5 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => sendMut.mutate()} disabled={!message.trim() || sendMut.isPending} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-heading text-lg">اختر محادثة</p>
                <p className="text-sm mt-1">أو ابحث عن مستخدم جديد</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
