// Sound effect system — gracefully no-ops when files are missing
type SFXKey =
  | "win" | "lose" | "click" | "coin" | "spin"
  | "roulette_spin" | "roulette_land"
  | "slot_spin" | "slot_win" | "slot_stop"
  | "card_deal" | "card_flip" | "blackjack_win" | "blackjack_bust"
  | "mine_reveal" | "mine_explode" | "mine_cashout"
  | "plinko_drop" | "plinko_bounce" | "plinko_land"
  | "dice_roll" | "dice_land"
  | "crash_start" | "crash_fly" | "crash_boom" | "crash_cashout"
  | "fish_cast" | "fish_bite" | "fish_catch" | "fish_junk"
  | "keno_draw" | "keno_match"
  | "coin_flip" | "coin_land"
  | "wheel_spin" | "wheel_tick" | "wheel_land"
  | "notification" | "purchase" | "daily_bonus" | "chat_message";

const cache: Record<string, HTMLAudioElement | null> = {};

function getAudio(key: SFXKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (key in cache) return cache[key];
  // Try multiple formats
  for (const ext of ["mp3", "ogg", "wav"]) {
    const path = `/sfx/${key}.${ext}`;
    // We do a synchronous check via Audio load — if it errors we skip
    const audio = new Audio(path);
    audio.preload = "none";
    cache[key] = audio;
    return audio;
  }
  cache[key] = null;
  return null;
}

export function playSFX(key: SFXKey, volume = 0.5) {
  try {
    const audio = getAudio(key);
    if (!audio) return;
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = Math.min(1, Math.max(0, volume));
    clone.play().catch(() => {
      // File missing or autoplay blocked — silently ignore
      cache[key] = null;
    });
  } catch {
    // Never crash the game due to missing audio
  }
}
