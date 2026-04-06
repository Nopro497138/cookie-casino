
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/ui/Navbar";
import { Leaderboard } from "@/components/ui/Leaderboard";
import { PowerupsShop } from "@/components/ui/PowerupsShop";
import { AdminPanel } from "@/components/ui/AdminPanel";
import { Inbox } from "@/components/ui/Inbox";
import { Shop } from "@/components/ui/Shop";
import { DepositModal } from "@/components/ui/DepositModal";
import { PlayerCount } from "@/components/ui/PlayerCount";
import { BanScreen } from "@/components/ui/BanScreen";

import { Blackjack } from "@/components/games/Blackjack";
import { Mines } from "@/components/games/Mines";
import { Plinko } from "@/components/games/Plinko";
import { Dice } from "@/components/games/Dice";
import { Slots } from "@/components/games/Slots";
import { Crash } from "@/components/games/Crash";
import { Fishing } from "@/components/games/Fishing";
import { Roulette } from "@/components/games/Roulette";
import { Keno } from "@/components/games/Keno";
import { CoinFlip } from "@/components/games/CoinFlip";
import { Wheel } from "@/components/games/Wheel";
import { fmt } from "@/lib/utils";
import { isAdmin } from "@/lib/config";

const GAMES = [
  { id:"blackjack",  name:"Blackjack",      icon:"🃏", desc:"Beat the dealer to 21",         color:"#10b981" },
  { id:"mines",      name:"Mines",           icon:"💣", desc:"Avoid mines, cash out anytime",  color:"#ef4444" },
  { id:"plinko",     name:"Plinko",          icon:"🔴", desc:"Drop the ball, win big",         color:"#8b5cf6" },
  { id:"slots",      name:"Slots",           icon:"🎰", desc:"Spin to match symbols",           color:"#f59e0b" },
  { id:"crash",      name:"Crash",           icon:"🚀", desc:"Cash out before it crashes",      color:"#f97316" },
  { id:"dice",       name:"Dice",            icon:"🎲", desc:"Predict the roll",                color:"#3b82f6" },
  { id:"roulette",   name:"Roulette",        icon:"🎡", desc:"Bet on red, black or numbers",    color:"#ec4899" },
  { id:"fishing",    name:"Fishing",         icon:"🎣", desc:"Cast your line for prizes",       color:"#06b6d4" },
  { id:"keno",       name:"Keno",            icon:"🔢", desc:"Pick numbers and match them",     color:"#a855f7" },
  { id:"coinflip",   name:"Coin Flip",       icon:"🪙", desc:"Heads or tails, 50/50",          color:"#6366f1" },
  { id:"wheel",      name:"Fortune Wheel",   icon:"☸️", desc:"Spin the wheel of fortune",      color:"#14b8a6" },
];

function GameComponent({ id, balance, onBalanceChange, activePowerups }: { id:string; balance:number; onBalanceChange:(n:number)=>void; activePowerups:string[] }) {
  const p = { balance, onBalanceChange };
  const hasRod = activePowerups.includes("enchanted_rod");
  switch(id) {
    case "blackjack":  return <Blackjack {...p} />;
    case "mines":      return <Mines {...p} />;
    case "plinko":     return <Plinko {...p} />;
    case "slots":      return <Slots {...p} />;
    case "crash":      return <Crash {...p} />;
    case "dice":       return <Dice {...p} />;
    case "roulette":   return <Roulette {...p} />;
    case "fishing":    return <Fishing {...p} hasRod={hasRod} />;
    case "keno":       return <Keno {...p} />;
    case "coinflip":   return <CoinFlip {...p} />;
    case "wheel":      return <Wheel {...p} />;
    default:           return <div className="flex items-center justify-center h-full text-slate-500">Game not found</div>;
  }
}

export default function CasinoPage() {
  const { data:session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("games");
  const [activeGame, setActiveGame] = useState<string|null>(null);
  const [balance, setBalance] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [depositOpen, setDepositOpen] = useState(false);
  const [activePowerups, setActivePowerups] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if (session?.user?.balance !== undefined) setBalance(session.user.balance);
      fetch("/api/user/balance").then(r=>r.json()).then(d => { if (d.balance !== undefined) setBalance(d.balance); });
      // Fetch USD balance
      fetch("/api/user/balance").then(r=>r.json()); // extend as needed
    }
  }, [status, session, router]);

  const handleBalanceChange = useCallback((n: number) => setBalance(n), []);
  const handleUsdChange = useCallback((n: number) => setUsdBalance(v => v + n), []);

  const claimDaily = async () => {
    const res = await fetch("/api/user/daily", { method:"POST" });
    const d = await res.json();
    if (d.bonus) { toast.success(`🎁 +🍪${fmt(d.bonus)} daily bonus!`); setBalance(d.newBalance); }
    else toast.error(d.error?.includes("Already") ? "Already claimed today!" : d.error ?? "Error");
  };

  const handlePowerupUse = (id: string) => {
    setActivePowerups(prev => [...prev, id]);
    setTimeout(() => setActivePowerups(prev => prev.filter(p => p !== id)), 60_000);
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // BANNED — show full ban screen
  if (status === "authenticated" && session?.user?.isBanned) {
    return <BanScreen reason={session.user.banReason} userId={session.user.id} />;
  }

  if (status !== "authenticated") return null;

  const admin = isAdmin(session?.user?.discordId);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar
          balance={balance}
          usdBalance={usdBalance}
          activeTab={tab}
          onTabChange={t => { setTab(t); setActiveGame(null); }}
          onDailyBonus={claimDaily}
          inboxUnread={inboxUnread}
        />

        <main className="pt-20 md:pt-14 min-h-screen">
          <AnimatePresence mode="wait">

            {/* ── GAME LIST ── */}
            {tab==="games" && !activeGame && (
              <motion.div key="game-list" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Choose Your Game</h1>
                  <p className="text-slate-400 text-sm">11 games • Balance: <span className="text-yellow-400 font-bold">🍪{fmt(balance)}</span></p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {GAMES.map((g, i) => (
                    <motion.button key={g.id}
                      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                      whileHover={{ scale:1.04, y:-3 }} whileTap={{ scale:0.97 }}
                      onClick={() => setActiveGame(g.id)}
                      className="rounded-2xl p-4 flex flex-col items-center gap-3 text-center transition-all"
                      style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${g.color}33`, boxShadow:`0 0 20px ${g.color}0d` }}>
                      <span className="text-4xl md:text-5xl" style={{ filter:`drop-shadow(0 0 12px ${g.color}88)` }}>{g.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm md:text-base">{g.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{g.desc}</p>
                      </div>
                      <div className="w-full py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background:`${g.color}1a`, color:g.color, border:`1px solid ${g.color}33` }}>
                        Play
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ACTIVE GAME ── */}
            {tab==="games" && activeGame && (
              <motion.div key="game-active" initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="flex flex-col" style={{ height:"calc(100vh - 3.5rem)" }}>
                {/* Header bar */}
                <div className="flex items-center gap-3 px-4 py-2 shrink-0"
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(8,8,15,0.7)", backdropFilter:"blur(10px)" }}>
                  <button onClick={() => setActiveGame(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm">
                    ← Back
                  </button>
                  <span className="text-lg">{GAMES.find(g=>g.id===activeGame)?.icon}</span>
                  <span className="font-bold text-white text-sm">{GAMES.find(g=>g.id===activeGame)?.name}</span>
                  <PlayerCount game={activeGame} />
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)" }}>
                    <span className="text-sm">🍪</span>
                    <span className="font-bold text-yellow-400 text-sm">{fmt(balance)}</span>
                  </div>
                </div>
                {/* Game area */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="max-w-2xl mx-auto min-h-full md:py-4 md:px-4">
                      <GameComponent id={activeGame} balance={balance} onBalanceChange={handleBalanceChange} activePowerups={activePowerups} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab==="powerups" && (
              <motion.div key="powerups" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="py-4">
                <PowerupsShop balance={balance} onBalanceChange={handleBalanceChange} onUsePowerup={handlePowerupUse} />
              </motion.div>
            )}

            {tab==="shop" && (
              <motion.div key="shop" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="py-4">
                <Shop usdBalance={usdBalance} onUsdChange={handleUsdChange} onDepositClick={() => setDepositOpen(true)} isAdmin={admin} />
              </motion.div>
            )}

            {tab==="leaderboard" && (
              <motion.div key="lb" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="py-4">
                <Leaderboard />
              </motion.div>
            )}

            {tab==="inbox" && (
              <motion.div key="inbox" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="py-4">
                <Inbox onUnreadCount={setInboxUnread} />
              </motion.div>
            )}

            {tab==="admin" && admin && (
              <motion.div key="admin" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="py-4">
                <AdminPanel />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onSuccess={n => setUsdBalance(v => v + n)} />
    </div>
  );
}
