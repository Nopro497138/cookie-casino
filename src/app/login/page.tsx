
"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Particles() {
  const [items] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 18, dur: 14 + Math.random() * 10,
    }))
  );
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {items.map(p => (
        <div key={p.id} className="absolute animate-particle text-2xl" style={{ left:`${p.left}%`, animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s`, opacity:0 }}>🍪</div>
      ))}
    </div>
  );
}

function DiscordBtn({ onClick, loading, label="Continue with Discord" }: { onClick:()=>void; loading:boolean; label?:string }) {
  return (
    <motion.button onClick={onClick} disabled={loading} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
      className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all"
      style={{ background: loading ? "rgba(88,101,242,0.5)" : "linear-gradient(135deg,#5865F2,#4752c4)", boxShadow:"0 0 30px rgba(88,101,242,0.4)" }}>
      {loading
        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <svg className="w-5 h-5" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.8a40.9 40.9 0 0 0-1.8 3.7 54.1 54.1 0 0 0-16.3 0 38.7 38.7 0 0 0-1.8-3.7A58.4 58.4 0 0 0 10.8 5C1.6 18.6-1 31.9.3 45a58.8 58.8 0 0 0 17.9 9 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.3 38.3 0 0 1-6 2.9 43.4 43.4 0 0 0 3.8 6.2 58.7 58.7 0 0 0 17.9-9C72 29.7 68.2 16.5 60.1 4.9ZM23.8 37.2c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.3 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z" /></svg>
      }
      {loading ? "Connecting…" : label}
    </motion.button>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"home"|"login"|"register">("home");
  const [loading, setLoading] = useState(false);
  const banned = params.get("error") === "banned";
  const banReason = params.get("reason");

  const handle = () => { setLoading(true); signIn("discord", { callbackUrl:"/" }); };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none animate-glow-pulse"
        style={{ background:"radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)" }} />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none animate-glow-pulse"
        style={{ background:"radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)", animationDelay:"1.5s" }} />
      <Particles />

      <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }}
        className="glass rounded-2xl p-8 md:p-12 w-full max-w-sm relative z-10"
        style={{ boxShadow:"0 0 60px rgba(139,92,246,0.12), 0 0 120px rgba(139,92,246,0.05)" }}>

        <motion.div className="text-center mb-8" initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.15 }}>
          <div className="text-6xl mb-3 inline-block animate-float">🍪</div>
          <h1 className="text-3xl font-black" style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Cream Casino
          </h1>
          <p className="text-slate-500 text-xs mt-1.5">The Premier Cookie Gambling Experience</p>
        </motion.div>

        {banned && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            className="mb-6 p-4 rounded-xl text-center"
            style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
            <div className="text-2xl mb-1">🚫</div>
            <p className="text-red-400 font-semibold text-sm">Account Suspended</p>
            {banReason && <p className="text-red-300 text-xs mt-1">{banReason}</p>}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === "home" && (
            <motion.div key="home" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
              <button onClick={() => setMode("login")} className="btn-primary w-full py-3 text-sm">Log In</button>
              <button onClick={() => setMode("register")}
                className="w-full py-3 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition-all"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}>
                Register
              </button>
            </motion.div>
          )}

          {mode === "login" && (
            <motion.div key="login" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} className="space-y-4">
              <p className="text-slate-400 text-sm text-center">Sign in with your Discord account.</p>
              <DiscordBtn onClick={handle} loading={loading} />
              <button onClick={() => setMode("home")} className="w-full text-slate-500 text-xs hover:text-slate-400 transition-colors">← Back</button>
            </motion.div>
          )}

          {mode === "register" && (
            <motion.div key="register" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} className="space-y-4">
              <div className="p-4 rounded-xl text-sm text-slate-300"
                style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.25)" }}>
                <p className="font-semibold text-indigo-300 mb-1">ℹ️ No account needed</p>
                <p className="text-xs text-slate-400">Cream Casino uses Discord for sign-in. Just authorize and you&apos;re in — no email or password required. You start with 🍪1,000 free cookies!</p>
              </div>
              <DiscordBtn onClick={handle} loading={loading} label="Sign up with Discord" />
              <button onClick={() => setMode("home")} className="w-full text-slate-500 text-xs hover:text-slate-400 transition-colors">← Back</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-700 text-xs mt-8">For entertainment only · 18+</p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
