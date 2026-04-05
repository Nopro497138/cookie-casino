
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
  {id:"blackjack",name:"Blackjack",icon:"🃏",desc:"Beat the dealer to 21",color:"#10b981"},
  {id:"mines",name:"Mines",icon:"💣",desc:"Avoid the mines, cash out",color:"#ef4444"},
  {id:"plinko",name:"Plinko",icon:"🔴",desc:"Drop the ball, win big",color:"#8b5cf6"},
  {id:"slots",name:"Slots",icon:"🎰",desc:"Spin to match symbols",color:"#f59e0b"},
  {id:"crash",name:"Crash",icon:"🚀",desc:"Cash out before it crashes",color:"#f97316"},
  {id:"dice",name:"Dice",icon:"🎲",desc:"Predict the roll",color:"#3b82f6"},
  {id:"roulette",name:"Roulette",icon:"🎡",desc:"Bet on red, black or numbers",color:"#ec4899"},
  {id:"fishing",name:"Fishing",icon:"🎣",desc:"Cast your line for prizes",color:"#06b6d4"},
  {id:"keno",name:"Keno",icon:"🔢",desc:"Pick numbers and match them",color:"#a855f7"},
  {id:"coinflip",name:"Coin Flip",icon:"🪙",desc:"Heads or tails, 50/50",color:"#6366f1"},
  {id:"wheel",name:"Fortune Wheel",icon:"☸️",desc:"Spin the wheel of fortune",color:"#14b8a6"},
];

function GameComponents({id,balance,onBalanceChange}:{id:string,balance:number,onBalanceChange:(n:number)=>void}) {
  const props = {balance,onBalanceChange};
  switch(id) {
    case "blackjack": return <Blackjack {...props} />;
    case "mines":     return <Mines {...props} />;
    case "plinko":    return <Plinko {...props} />;
    case "slots":     return <Slots {...props} />;
    case "crash":     return <Crash {...props} />;
    case "dice":      return <Dice {...props} />;
    case "roulette":  return <Roulette {...props} />;
    case "fishing":   return <Fishing {...props} />;
    case "keno":      return <Keno {...props} />;
    case "coinflip":  return <CoinFlip {...props} />;
    case "wheel":     return <Wheel {...props} />;
    default:          return <div className="flex items-center justify-center h-full text-slate-500">Game not found</div>;
  }
}

export default function CasinoPage() {
  const {data:session,status} = useSession();
  const router = useRouter();
  const [tab,setTab] = useState("games");
  const [activeGame,setActiveGame] = useState<string|null>(null);
  const [balance,setBalance] = useState(0);

  useEffect(()=>{
    if (status==="unauthenticated") router.push("/login");
    if (status==="authenticated"&&session?.user?.isBanned) router.push(`/login?error=banned&reason=${encodeURIComponent(session.user.banReason??"Banned")}`);
    if (session?.user?.balance!==undefined) setBalance(session.user.balance);
  },[status,session,router]);

  useEffect(()=>{
    if (status==="authenticated") {
      fetch("/api/user/balance").then(r=>r.json()).then(d=>{ if(d.balance!==undefined) setBalance(d.balance); });
    }
  },[status]);

  const handleBalanceChange = useCallback((newBal: number) => {
    setBalance(newBal);
  },[]);

  const claimDaily = async () => {
    const res = await fetch("/api/user/daily",{method:"POST"});
    const d = await res.json();
    if (d.bonus) { toast.success(`+🍪${fmt(d.bonus)} daily bonus!`); setBalance(d.newBalance); }
    else toast.error(d.error?.includes("Already")?`Already claimed today!`:d.error||"Error");
  };

  if (status==="loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (status!=="authenticated") return null;

  const admin = isAdmin(session?.user?.discordId);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar balance={balance} activeTab={tab} onTabChange={t=>{setTab(t);setActiveGame(null);}} onDailyBonus={claimDaily} />

        <main className="pt-20 md:pt-16 min-h-screen">
          <AnimatePresence mode="wait">

            {tab==="games" && !activeGame && (
              <motion.div key="game-list" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Choose Your Game</h1>
                  <p className="text-slate-400">11 games available • Balance: <span className="text-yellow-400 font-bold">🍪{fmt(balance)}</span></p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {GAMES.map((g,i)=>(
                    <motion.button key={g.id}
                      initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      whileHover={{scale:1.04,y:-3}} whileTap={{scale:0.97}}
                      onClick={()=>setActiveGame(g.id)}
                      className="rounded-2xl p-4 md:p-5 flex flex-col items-center gap-3 text-center transition-all"
                      style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${g.color}33`,boxShadow:`0 0 20px ${g.color}11`}}>
                      <span className="text-4xl md:text-5xl" style={{filter:`drop-shadow(0 0 12px ${g.color}88)`}}>{g.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm md:text-base">{g.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{g.desc}</p>
                      </div>
                      <div className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{background:`${g.color}22`,color:g.color,border:`1px solid ${g.color}44`}}>
                        Play
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {tab==="games" && activeGame && (
              <motion.div key="game-view" initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.97}}
                className="flex flex-col h-[calc(100vh-4rem)]">
                {/* Game header bar */}
                <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                  style={{borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(8,8,15,0.6)"}}>
                  <button onClick={()=>setActiveGame(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    ← Back
                  </button>
                  <span className="text-xl">{GAMES.find(g=>g.id===activeGame)?.icon}</span>
                  <span className="font-bold text-white">{GAMES.find(g=>g.id===activeGame)?.name}</span>
                  <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg" style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)"}}>
                    <span>🍪</span><span className="font-bold text-yellow-400 text-sm">{fmt(balance)}</span>
                  </div>
                </div>
                {/* Game area */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="max-w-2xl mx-auto h-full md:py-4 md:px-4">
                      <GameComponents id={activeGame} balance={balance} onBalanceChange={handleBalanceChange} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab==="leaderboard" && (
              <motion.div key="lb" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="py-4">
                <Leaderboard />
              </motion.div>
            )}

            {tab==="powerups" && (
              <motion.div key="pu" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="py-4">
                <PowerupsShop balance={balance} onBalanceChange={handleBalanceChange} />
              </motion.div>
            )}

            {tab==="admin" && admin && (
              <motion.div key="admin" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="py-4">
                <AdminPanel />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
