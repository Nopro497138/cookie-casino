
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatText } from "@/lib/formatText";

interface Notification { id: string; type: string; title: string; message: string; read: boolean; createdAt: string; }

const TYPE_ICON: Record<string, string> = {
  admin_balance: "🍪", announcement: "📢", daily_bonus: "🎁", purchase: "🛍️",
  chat_message: "💬", order_complete: "✅", deposit: "💵", appeal_approved: "✅",
  appeal_denied: "❌", unban: "🔓", shop_order: "🛍️", default: "🔔",
};

export function Inbox({ onUnreadCount }: { onUnreadCount?: (n: number) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const d = await fetch("/api/notifications").then(r => r.json());
    setNotifications(d.notifications ?? []);
    const unread = (d.notifications ?? []).filter((n: Notification) => !n.read).length;
    onUnreadCount?.(unread);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read" }) });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onUnreadCount?.(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">🔔 Inbox</h2>
          <p className="text-slate-400 text-sm">Notifications & messages</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500"><div className="text-5xl mb-3">📭</div><p>No notifications yet</p></div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex gap-3 p-4 rounded-xl transition-all"
              style={{ background: n.read ? "rgba(255,255,255,0.03)" : "rgba(139,92,246,0.08)", border: `1px solid ${n.read ? "rgba(255,255,255,0.06)" : "rgba(139,92,246,0.25)"}` }}>
              <span className="text-2xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.default}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-white">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5" />}
                </div>
                <div className="text-xs text-slate-300 mt-1">{formatText(n.message)}</div>
                <p className="text-xs text-slate-500 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
