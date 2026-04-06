
# 🍪 Cream Casino

A full-stack gambling site with Discord OAuth, 11 games, powerups, shop, chat, admin panel and more.

## Quick Setup

### 1. Install
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` → `.env.local` and fill in:
```env
DATABASE_URL=        # PostgreSQL (Railway plugin)
NEXTAUTH_SECRET=     # openssl rand -base64 32
NEXTAUTH_URL=        # https://your-app.vercel.app
DISCORD_CLIENT_ID=   # discord.com/developers
DISCORD_CLIENT_SECRET=
```

### 3. Discord OAuth
1. discord.com/developers → New Application
2. OAuth2 → Add redirect: `https://your-app.vercel.app/api/auth/callback/discord`
3. Copy Client ID + Secret

### 4. Database
```bash
npm run db:push
```

### 5. Set yourself as Admin
Edit `config/config.json`:
```json
{ "admins": ["YOUR_DISCORD_USER_ID"] }
```
Get your Discord ID: Settings → Advanced → Developer Mode → right-click your name → Copy ID

### 6. Deploy
```bash
vercel --prod
```
Add all env vars in Vercel dashboard.

## Customization files

| File | What you can change |
|------|-------------------|
| `config/config.json` | Starting balance, daily bonus, min/max bet, admin IDs, site name |
| `config/shop.json` | Shop items, prices, availability |
| `public/sfx/` | Sound effects (mp3/ogg/wav) — see `public/sfx/README.md` |

## Features
- **11 Games**: Blackjack, Mines, Plinko (physics), Slots, Crash, Dice, Roulette, Fishing, Keno, Coin Flip, Fortune Wheel
- **14 Powerups** with USE button
- **Shop** with USD deposit + order chat
- **Inbox** with Discord-style formatting
- **Announcements** with animated bell
- **Ban Screen** with appeal form
- **Admin Panel**: Users, Logs, Appeals, Announce
- **Leaderboard** with admin glow
- **Player count** per game
- **SFX system** (graceful no-op if files missing)
