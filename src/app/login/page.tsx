
"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({length:20}).map((_,i) => (
        <div key={i} className="absolute animate-particle" style={{
          left:`${Math.random()*100}%`,
          animationDelay:`${Math.random()*18}s`,
          animationDuration:`${15+Math.random()*10}s`,
          fontSize:`${0.8+Math.random()*1.2}rem`,
          opacity:0,
        }}>🍪</div>
      ))}
    </div>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"home"|"login"|"register">("home");
  const [loading, setLoading] = useState(false);
  const bannedReason = params.get("reason");
  const isBanned = params.get("error") === "banned";

  const handleDiscord = () => {
    setLoading(true);
    signIn("discord", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full animate-glow-pulse" style={{background:"radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)"}} />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-glow-pulse" style={{background:"radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)",animationDelay:"1.5s"}} />

      <FloatingParticles />

      <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:"easeOut"}}
        className="glass rounded-2xl p-8 md:p-12 w-full max-w-md relative z-10"
        style={{boxShadow:"0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(139,92,246,0.05)"}}>

        {/* Logo */}
        <motion.div className="text-center mb-8" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.2}}>
          <div className="text-6xl mb-4 animate-float inline-block">🍪</div>
          <h1 className="text-3xl font-bold" style={{background:"linear-gradient(135deg,#f59e0b,#fbbf24)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Cookie Casino
          </h1>
          <p className="text-slate-400 mt-2 text-sm">The Premier Cookie Gambling Experience</p>
        </motion.div>

        {isBanned && (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
            className="mb-6 p-4 rounded-xl text-center"
            style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)"}}>
            <div className="text-2xl mb-2">🚫</div>
            <p className="text-red-400 font-semibold">You are banned</p>
            {bannedReason && <p className="text-red-300 text-sm mt-1">{bannedReason}</p>}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === "home" && (
            <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
              <button onClick={()=>setMode("login")} className="w-full btn-primary text-base py-3">
                Log In
              </button>
              <button onClick={()=>setMode("register")}
                className="w-full py-3 rounded-lg font-semibold transition-all duration-200 text-slate-300 hover:text-white"
                style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
                Register
              </button>
            </motion.div>
          )}

          {mode === "login" && (
            <motion.div key="login" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-6">Log in with your Discord account to access Cookie Casino.</p>
              <DiscordButton onClick={handleDiscord} loading={loading} />
              <button onClick={()=>setMode("home")} className="w-full text-slate-500 text-sm hover:text-slate-400 transition-colors mt-2">
                ← Back
              </button>
            </motion.div>
          )}

          {mode === "register" && (
            <motion.div key="register" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
                className="p-4 rounded-xl text-sm text-slate-300"
                style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)"}}>
                <p className="font-medium text-indigo-300 mb-1">ℹ️ Registration</p>
                <p>Cookie Casino uses Discord for authentication. No email or password needed — just authorize with your Discord account and you&apos;re in!</p>
              </motion.div>
              <DiscordButton onClick={handleDiscord} loading={loading} label="Sign up with Discord" />
              <button onClick={()=>setMode("home")} className="w-full text-slate-500 text-sm hover:text-slate-400 transition-colors mt-2">
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-600 text-xs mt-8">
          By playing you confirm you are of legal age. This is for entertainment only.
        </p>
      </motion.div>
    </div>
  );
}

function DiscordButton({ onClick, loading, label="Continue with Discord" }: { onClick:()=>void; loading:boolean; label?:string }) {
  return (
    <motion.button onClick={onClick} disabled={loading} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
      className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200"
      style={{background:loading?"rgba(88,101,242,0.5)":"linear-gradient(135deg,#5865F2,#4752c4)",boxShadow:"0 0 30px rgba(88,101,242,0.4)"}}>
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.8a40.9 40.9 0 0 0-1.8 3.7 54.1 54.1 0 0 0-16.3 0 38.7 38.7 0 0 0-1.8-3.7A58.4 58.4 0 0 0 10.8 5C1.6 18.6-1 31.9.3 45a58.8 58.8 0 0 0 17.9 9 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.3 38.3 0 0 1-6 2.9 43.4 43.4 0 0 0 3.8 6.2 58.7 58.7 0 0 0 17.9-9C72 29.7 68.2 16.5 60.1 4.9ZM23.8 37.2c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.3 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z"/></svg>
      )}
      {loading ? "Connecting…" : label}
    </motion.button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
