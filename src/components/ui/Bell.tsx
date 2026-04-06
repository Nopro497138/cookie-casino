"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatText } from "@/lib/formatText";

interface Announcement {
  id: string;
  title: string;
  message: string;
  adminName: string;
  createdAt: string;
  pinned: boolean;
}

export function Bell() {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(0);
  const [ringing, setRinging] = useState(false);

  const seenRef = useRef<Set<string>>(
    new Set(
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("seen_anns") ?? "[]")
        : []
    )
  );

  useEffect(() => {
    const load = () =>
      fetch("/api/announcements")
        .then((r) => r.json())
        .then((d) => {
          const anns: Announcement[] = d.announcements ?? [];
          setAnnouncements(anns);

          const newCount = anns.filter((a) => !seenRef.current.has(a.id)).length;

          if (newCount > unread && unread > 0) {
            setRinging(true);
            setTimeout(() => setRinging(false), 2000);
          }

          setUnread(newCount);
        });

    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [unread]);

  const markAllRead = () => {
    announcements.forEach((a) => seenRef.current.add(a.id));
    localStorage.setItem("seen_anns", JSON.stringify(Array.from(seenRef.current)));
    setUnread(0);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        animate={ringing ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.6 }}
        className="relative p-2.5 rounded-xl transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,191,36,0.1))",
          border: "1px solid rgba(245,158,11,0.4)",
          boxShadow:
            unread > 0
              ? "0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2)"
              : "0 0 10px rgba(245,158,11,0.2)",
        }}
      >
        <motion.span
          animate={{ rotate: ringing ? [0, -20, 20, -15, 15, 0] : [0, -8, 8, -4, 4, 0] }}
          transition={{
            duration: ringing ? 0.5 : 2,
            repeat: ringing ? 3 : Infinity,
            repeatDelay: ringing ? 0 : 5,
          }}
          className="text-xl block"
          style={{ display: "inline-block", transformOrigin: "top center" }}
        >
          🔔
        </motion.span>

        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.8)" }}
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(13,13,26,0.97)",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              zIndex: 100,
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3 className="font-bold text-white">📢 Announcements</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No announcements yet</div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="px-4 py-3 hover:bg-white/3 transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {a.pinned && <span className="text-xs text-yellow-500 font-semibold">📌 Pinned</span>}
                    <p className="font-semibold text-white text-sm">{a.title}</p>
                    <div className="text-xs text-slate-300 mt-1">{formatText(a.message)}</div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      by {a.adminName} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
