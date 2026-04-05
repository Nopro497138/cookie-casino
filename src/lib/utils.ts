import { clsx, type ClassValue } from "clsx";
export const cn = (...i: ClassValue[]) => clsx(i);
export const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M` :
  n >= 1_000 ? `${(n / 1e3).toFixed(1)}K` : String(n);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export const shuffle = <T>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
