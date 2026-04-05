
"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/utils";
import { isAdmin } from "@/lib/config";

interface NavbarProps {
  balance: number;
  onTabChange: (tab: string) => void;
  activeTab: string;
  onDailyBonus: () => void;
}

const TABS = [
  {id:"games",label:"Games",icon:"🎮"},
  {id:"powerups",label:"Powerups",icon:"⚡"},
  {id:"leaderboard",label:"Leaderboard",icon:"🏆"},
];

export function Navbar({balance,onTabChange,activeTab,onDailyBonus}: NavbarProps) {
  const {data:session} = useSession();
  const [menuOpen,setMenuOpen] = useState(false);
  const admin = isAdmin(session?.user?.discordId);
  const tabs = admin ? [...TABS,{id:"admin",label:"Admin",icon:"👑"}] : TABS;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{background:"rgba(8,8,15,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(139,92,246,0.15)"}}>
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🍪</span>
          <span className="font-bold text-base hidden sm:block" style={{color:"#f59e0b"}}>Cookie Casino</span>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={()=>onTabChange(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
              style={activeTab===tab.id
                ?{background:"rgba(139,92,246,0.2)",color:"#a78bfa",border:"1px solid rgba(139,92,246,0.4)",boxShadow:"0 0 15px rgba(139,92,246,0.2)"}
                :{color:"#94a3b8",border:"1px solid transparent"}}>
              <span>{tab.icon}</span>{tab.label}
              {tab.id==="admin"&&<span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{background:"rgba(147,51,234,0.3)",color:"#c084fc"}}>ADMIN</span>}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Balance */}
          <motion.div key={balance} initial={{scale:1.1}} animate={{scale:1}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)"}}>
            <span className="text-base">🍪</span>
            <span className="font-bold text-sm" style={{color:"#f59e0b"}}>{fmt(balance)}</span>
          </motion.div>

          {/* Daily bonus */}
          <button onClick={onDailyBonus} title="Daily Bonus"
            className="p-2 rounded-lg text-base transition-all duration-200 hover:scale-105"
            style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)"}}>
            🎁
          </button>

          {/* Avatar / menu */}
          <div className="relative">
            <button onClick={()=>setMenuOpen(v=>!v)} className="flex items-center gap-2 p-1.5 rounded-lg transition-all hover:bg-white/5">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full" style={admin?{border:"2px solid #9333ea",boxShadow:"0 0 12px rgba(147,51,234,0.6)"}:{border:"2px solid rgba(139,92,246,0.3)"}} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:"rgba(139,92,246,0.3)"}}>👤</div>
              )}
              <span className="hidden sm:block text-sm text-slate-300 max-w-[100px] truncate">{session?.user?.name}</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.95}}
                  className="absolute right-0 top-full mt-2 glass rounded-xl p-2 min-w-[160px]" style={{zIndex:100}}>
                  {admin&&(
                    <div className="px-3 py-1.5 text-xs font-semibold rounded-lg mb-1" style={{color:"#c084fc",background:"rgba(147,51,234,0.2)"}}>
                      ⭐ Admin
                    </div>
                  )}
                  <button onClick={()=>{signOut({callbackUrl:"/login"});setMenuOpen(false);}}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    🚪 Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5" onClick={()=>setMenuOpen(v=>!v)}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={()=>onTabChange(tab.id)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={activeTab===tab.id
              ?{background:"rgba(139,92,246,0.2)",color:"#a78bfa",border:"1px solid rgba(139,92,246,0.4)"}
              :{color:"#94a3b8",border:"1px solid transparent"}}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
