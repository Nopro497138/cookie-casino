
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";

interface BanScreenProps { reason?: string; userId: string; }

export function BanScreen({ reason, userId }: BanScreenProps) {
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!appealReason.trim()) { setError("Please explain why you should be unbanned."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/appeal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: appealReason, additionalInfo }) });
    const d = await res.json();
    setLoading(false);
    if (d.appeal) setSubmitted(true);
    else setError(d.error ?? "Failed to submit appeal.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "radial-gradient(ellipse at center, rgba(127,29,29,0.3) 0%, rgba(8,8,15,1) 70%)" }}>

      {/* Animated particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute animate-particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 15}s`, fontSize: "1.5rem", opacity: 0 }}>💀</div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10">
        <div className="glass rounded-3xl p-8 text-center" style={{ border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 80px rgba(239,68,68,0.2), 0 0 160px rgba(239,68,68,0.05)" }}>

          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-7xl mb-4">🚫</motion.div>
          <h1 className="text-3xl font-black text-red-400 mb-2">You Are Banned</h1>
          <p className="text-slate-400 mb-6">Your account has been suspended from Cream Casino.</p>

          {reason && (
            <div className="p-4 rounded-xl mb-6 text-left" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">Reason</p>
              <p className="text-red-200">{reason}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showAppeal && !submitted && (
              <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <button onClick={() => setShowAppeal(true)}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
                  ✉️ Submit an Appeal
                </button>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full py-3 rounded-xl font-semibold text-slate-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Sign Out
                </button>
              </motion.div>
            )}

            {showAppeal && !submitted && (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-left">
                <h2 className="text-lg font-bold text-white text-center">Submit Ban Appeal</h2>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Why should you be unbanned? *</label>
                  <textarea value={appealReason} onChange={e => setAppealReason(e.target.value)} rows={4}
                    placeholder="Explain your situation clearly and honestly…"
                    className="w-full bg-transparent border rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ borderColor: "rgba(139,92,246,0.3)" }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Additional information (optional)</label>
                  <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} rows={2}
                    placeholder="Any other context, evidence, etc…"
                    className="w-full bg-transparent border rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setShowAppeal(false)} className="flex-1 py-2 rounded-xl text-slate-400 hover:text-white text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    ← Back
                  </button>
                  <button onClick={submit} disabled={loading} className="flex-1 py-2 rounded-xl font-bold text-white btn-primary">
                    {loading ? "Submitting…" : "Submit Appeal"}
                  </button>
                </div>
              </motion.div>
            )}

            {submitted && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
                <div className="text-5xl">✅</div>
                <p className="text-green-400 font-bold text-lg">Appeal Submitted!</p>
                <p className="text-slate-400 text-sm">An admin will review your appeal. You will receive a notification when a decision is made.</p>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-500 text-sm hover:text-slate-300 transition-colors">Sign out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
