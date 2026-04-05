
# 🍪 Cookie Casino

A full-stack gambling website with Discord OAuth, 11 games, powerups, leaderboards, and an admin panel.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Railway)
- **Auth**: NextAuth.js + Discord OAuth
- **Deploy**: Vercel (frontend) + Railway (database)

## Setup

### 1. Clone and install
```bash
git clone <your-repo>
cd cookie-casino
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in:
```env
DATABASE_URL=        # PostgreSQL URL from Railway
NEXTAUTH_SECRET=     # openssl rand -base64 32
NEXTAUTH_URL=        # https://your-app.vercel.app
DISCORD_CLIENT_ID=   # From discord.com/developers
DISCORD_CLIENT_SECRET=
```

### 3. Create Discord OAuth App
1. Go to [discord.com/developers](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 → Add redirect: `https://your-app.vercel.app/api/auth/callback/discord`
4. Copy Client ID and Secret to `.env.local`

### 4. Set up database (Railway)
1. Create a Railway project
2. Add PostgreSQL plugin
3. Copy the DATABASE_URL to your `.env.local`
4. Run `npm run db:push`

### 5. Set yourself as admin
Edit `config/config.json`:
```json
{
  "admins": ["YOUR_DISCORD_USER_ID"]
}
```
Get your Discord ID: Enable Developer Mode in Discord → Right-click your name → Copy ID

### 6. Deploy to Vercel
```bash
vercel --prod
```
Add all environment variables in the Vercel dashboard.

## Games
| Game | Description |
|------|-------------|
| 🃏 Blackjack | Beat the dealer to 21 |
| 💣 Mines | Avoid bombs, cash out anytime |
| 🔴 Plinko | Drop the ball through pins |
| 🎰 Slots | Match symbols across 5 reels |
| 🚀 Crash | Cash out before it crashes |
| 🎲 Dice | Predict over/under roll |
| 🎡 Roulette | Bet on colors, numbers, groups |
| 🎣 Fishing | Cast line for rare fish |
| 🔢 Keno | Pick numbers, match draws |
| 🪙 Coin Flip | Heads or tails, 2× payout |
| ☸️ Fortune Wheel | Spin for multipliers |

## Admin Features
- Give/take cookies from any user
- Ban/unban users
- Reset user balance
- Search users by name or Discord ID
- View site-wide statistics

## Powerups (14 total)
Purchasable in-game with cookies. Includes: Enchanted Fishing Rod, Lucky Charm, Cookie Multiplier, Insurance Card, Miner's Helmet, Slot Booster, Loaded Dice, Crash Shield, Fortune Teller, Cookie Jar, Black Card, Time Warp, Hot Streak Gloves, Ace's Sleeve.
