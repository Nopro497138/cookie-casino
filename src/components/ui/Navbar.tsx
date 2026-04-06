
"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/utils";
import { isAdmin } from "@/lib/config";
import { Bell } from "./Bell";

interface NavbarProps {
  balance: number;
  usdBalance: number;
  onTabChange: (tab: string) => void;
  activeTab: string;
  onDailyBonus: () => void;
  inboxUnread: number;
}

const TABS = [
  { id:"games",       label:"Games",       icon:"🎮" },
  { id:"powerups",    label:"Powerups",    icon:"⚡" },
  { id:"shop",        label:"Shop",        icon:"🛍️" },
  { id:"leaderboard", label:"Leaderboard", icon:"🏆" },
  { id:"inbox",       label:"Inbox",       icon:"🔔" },
];

export function Navbar({ balance, usdBalance, onTabChange, activeTab, onDailyBonus, inboxUnread }: NavbarProps) {
  const { data:session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const admin = isAdmin(session?.user?.discordId);
  const tabs = admin ? [...TABS, { id:"admin", label:"Admin", icon:"👑" }] : TABS;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background:"rgba(8,8,15,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(139,92,246,0.12)" }}>
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 flex items-center gap-2">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🍪</span>
          <span className="font-black text-base hidden sm:block" style={{ color:"#f59e0b" }}>Cream Casino</span>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className="relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
              style={activeTab===tab.id
                ? { background:"rgba(139,92,246,0.18)", color:"#a78bfa", border:"1px solid rgba(139,92,246,0.35)" }
                : { color:"#94a3b8", border:"1px solid transparent" }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id==="inbox" && inboxUnread>0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-black" style={{ background:"#ef4444", fontSize:"0.6rem" }}>{inboxUnread>9?"9+":inboxUnread}</span>
              )}
              {tab.id==="admin" && (
                <span className="text-xs px-1.5 py-0.5 rounded-full ml-0.5" style={{ background:"rgba(147,51,234,0.3)", color:"#c084fc" }}>ADMIN</span>
              )}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Balances */}
          <motion.div key={balance} initial={{ scale:1.05 }} animate={{ scale:1 }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)" }}>
            <span>🍪</span>
            <span className="font-bold text-xs" style={{ color:"#f59e0b" }}>{fmt(balance)}</span>
          </motion.div>
          {usdBalance > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <span className="text-xs font-bold text-green-400">💵${usdBalance.toFixed(2)}</span>
            </div>
          )}

          {/* Daily bonus */}
          <button onClick={onDailyBonus} title="Daily Bonus"
            className="p-2 rounded-lg text-base transition-all hover:scale-105"
            style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)" }}>
            🎁
          </button>

          {/* Bell */}
          <Bell />

          {/* Avatar */}
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-all">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="avatar" width={30} height={30} className="rounded-full"
                  style={admin ? { border:"2px solid #9333ea", boxShadow:"0 0 10px rgba(147,51,234,0.7)" } : { border:"2px solid rgba(139,92,246,0.3)" }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"rgba(139,92,246,0.3)" }}>👤</div>
              )}
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity:0, y:6, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
                  className="absolute right-0 top-full mt-2 glass rounded-xl p-2 min-w-[160px]" style={{ zIndex:100 }}>
                  <div className="px-3 py-1.5 text-xs text-slate-400 truncate">{session?.user?.name}</div>
                  <div className="px-3 py-1 text-xs text-yellow-400">🍪{fmt(balance)}</div>
                  {usdBalance > 0 && <div className="px-3 py-1 text-xs text-green-400">💵${usdBalance.toFixed(2)}</div>}
                  {admin && <div className="px-3 py-1.5 text-xs font-semibold rounded-lg mt-1" style={{ color:"#c084fc", background:"rgba(147,51,234,0.2)" }}>⭐ Admin</div>}
                  <hr className="border-white/5 my-1" />
                  <button onClick={() => signOut({ callbackUrl:"/login" })} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    🚪 Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex items-center gap-0.5 px-2 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className="shrink-0 relative px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            style={activeTab===tab.id
              ? { background:"rgba(139,92,246,0.2)", color:"#a78bfa", border:"1px solid rgba(139,92,246,0.4)" }
              : { color:"#94a3b8", border:"1px solid transparent" }}>
            {tab.icon} {tab.label}
            {tab.id==="inbox"&&inboxUnread>0&&<span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center" style={{ fontSize:"0.55rem" }}>{inboxUnread}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
