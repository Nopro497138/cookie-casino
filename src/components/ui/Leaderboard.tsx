
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { fmt } from "@/lib/utils";

interface LBUser {
  rank:number; id:string; discordId:string; name:string; image:string;
  balance:number; totalWon:number; gamesPlayed:number; isAdmin:boolean;
}

export function Leaderboard() {
  const [data,setData] = useState<LBUser[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    fetch("/api/leaderboard").then(r=>r.json()).then(d=>{setData(d.leaderboard||[]);setLoading(false);});
  },[]);

  const RANK_STYLE: Record<number,{bg:string,color:string,icon:string}> = {
    1:{bg:"rgba(245,158,11,0.15)",color:"#f59e0b",icon:"🥇"},
    2:{bg:"rgba(203,213,225,0.1)",color:"#94a3b8",icon:"🥈"},
    3:{bg:"rgba(180,83,9,0.1)",color:"#b45309",icon:"🥉"},
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-white mb-1">🏆 Leaderboard</h2>
        <p className="text-slate-400 text-sm">Top cookie holders</p>
      </div>

      {data.map((user,i)=>{
        const rs = RANK_STYLE[user.rank];
        return (
          <motion.div key={user.id}
            initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
            style={{
              background:user.isAdmin?"rgba(147,51,234,0.1)":rs?.bg??"rgba(255,255,255,0.03)",
              border:"1px solid",
              borderColor:user.isAdmin?"rgba(147,51,234,0.4)":rs?.color??"rgba(255,255,255,0.06)",
              boxShadow:user.isAdmin?"0 0 20px rgba(147,51,234,0.2), 0 0 40px rgba(147,51,234,0.1)":rs?.color?`0 0 15px ${rs.color}33`:"none",
            }}>

            {/* Rank */}
            <div className="w-10 text-center shrink-0">
              {rs ? (
                <span className="text-2xl">{rs.icon}</span>
              ) : (
                <span className="text-lg font-bold" style={{color:"#475569"}}>#{user.rank}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative shrink-0">
              {user.image ? (
                <Image src={user.image} alt={user.name} width={44} height={44} className="rounded-full"
                  style={user.isAdmin?{border:"2px solid #9333ea",boxShadow:"0 0 15px rgba(147,51,234,0.7)"}:{border:"2px solid rgba(139,92,246,0.2)"}} />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{background:"rgba(139,92,246,0.2)"}}>👤</div>
              )}
              {user.isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{background:"#9333ea",boxShadow:"0 0 8px rgba(147,51,234,0.8)"}}>⭐</div>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate" style={{color:user.isAdmin?"#c084fc":rs?.color??"#e2e8f0"}}>{user.name}</p>
                {user.isAdmin && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                    style={{background:"rgba(147,51,234,0.3)",color:"#c084fc",boxShadow:"0 0 8px rgba(147,51,234,0.4)"}}>
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{user.gamesPlayed} games</p>
            </div>

            {/* Balance */}
            <div className="text-right shrink-0">
              <p className="font-black text-lg" style={{color:user.isAdmin?"#c084fc":"#f59e0b"}}>
                🍪 {fmt(user.balance)}
              </p>
              <p className="text-xs text-slate-500">won {fmt(user.totalWon)}</p>
            </div>
          </motion.div>
        );
      })}

      {data.length===0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">🏆</div>
          <p>No players yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
