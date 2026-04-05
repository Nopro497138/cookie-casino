export type Rarity = "common" | "rare" | "epic" | "legendary";
export interface Powerup {
  id: string; name: string; description: string; icon: string;
  price: number; color: string; rarity: Rarity; game: string;
}
export const POWERUPS: Powerup[] = [
  { id:"enchanted_rod", name:"Enchanted Fishing Rod", description:"2x fish value + rarer catches", icon:"🎣", price:150, color:"#3b82f6", rarity:"rare", game:"fishing" },
  { id:"lucky_charm", name:"Lucky Charm", description:"+3% win chance for 10 plays", icon:"🍀", price:200, color:"#10b981", rarity:"rare", game:"all" },
  { id:"cookie_multiplier", name:"Cookie Multiplier", description:"Next 3 wins pay 1.5x normal", icon:"✨", price:250, color:"#f59e0b", rarity:"epic", game:"all" },
  { id:"insurance_card", name:"Insurance Card", description:"Recover 40% of next loss", icon:"🛡️", price:100, color:"#6366f1", rarity:"common", game:"all" },
  { id:"miners_helmet", name:"Miner's Helmet", description:"Reveals 2 mines at start", icon:"⛏️", price:120, color:"#f97316", rarity:"common", game:"mines" },
  { id:"slot_booster", name:"Slot Booster", description:"98% RTP for next 5 slot spins", icon:"🎰", price:180, color:"#ec4899", rarity:"rare", game:"slots" },
  { id:"loaded_dice", name:"Loaded Dice", description:"Free reroll in Dice once", icon:"🎲", price:80, color:"#8b5cf6", rarity:"common", game:"dice" },
  { id:"crash_shield", name:"Crash Shield", description:"Auto cash-out at 2x if you forget", icon:"🚀", price:130, color:"#14b8a6", rarity:"common", game:"crash" },
  { id:"fortune_teller", name:"Fortune Teller", description:"Hints 1 wrong Keno number (x3 uses)", icon:"🔮", price:160, color:"#a855f7", rarity:"rare", game:"keno" },
  { id:"cookie_jar", name:"Cookie Jar", description:"+1,000 daily cookies for 7 days", icon:"🍪", price:300, color:"#d97706", rarity:"epic", game:"all" },
  { id:"black_card", name:"Black Card", description:"VIP: 5x higher bet limits", icon:"♠️", price:500, color:"#374151", rarity:"legendary", game:"all" },
  { id:"time_warp", name:"Time Warp", description:"Undo your last bet entirely", icon:"⏰", price:350, color:"#06b6d4", rarity:"legendary", game:"all" },
  { id:"hot_streak", name:"Hot Streak Gloves", description:"+5% payout per consecutive win (max 5x)", icon:"🔥", price:220, color:"#ef4444", rarity:"epic", game:"all" },
  { id:"aces_sleeve", name:"Ace's Sleeve", description:"Peek at dealer's hidden card (x3)", icon:"🃏", price:200, color:"#dc2626", rarity:"rare", game:"blackjack" },
];
export const RARITY_COLOR: Record<Rarity, string> = {
  common:"#9ca3af", rare:"#3b82f6", epic:"#a855f7", legendary:"#f59e0b",
};
export const RARITY_GLOW: Record<Rarity, string> = {
  common:"rgba(156,163,175,0.3)", rare:"rgba(59,130,246,0.4)",
  epic:"rgba(168,85,247,0.5)", legendary:"rgba(245,158,11,0.6)",
};
