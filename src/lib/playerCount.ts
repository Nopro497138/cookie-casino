// In-memory player presence (resets on server restart, perfect for Vercel serverless)
const counts: Record<string, Set<string>> = {};

export function joinGame(game: string, userId: string) {
  if (!counts[game]) counts[game] = new Set();
  counts[game].add(userId);
}

export function leaveGame(game: string, userId: string) {
  counts[game]?.delete(userId);
}

export function getCount(game: string): number {
  return counts[game]?.size ?? 0;
}

export function getAllCounts(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [g, s] of Object.entries(counts)) result[g] = s.size;
  return result;
}
