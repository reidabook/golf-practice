# Golf Practice Tracker

Mobile-first PWA for tracking golf practice drill scores across training blocks.
Add to iPhone home screen via Safari → Share → Add to Home Screen.

## Stack

- **Vite + React** (JSX, no TypeScript)
- **Supabase** (Postgres + JS SDK v2)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router v7** (SPA routing)
- **Recharts** (progress charts)
- **vite-plugin-pwa** (PWA manifest + service worker)

## File Index

### Config
| File | Purpose |
|---|---|
| `package.json` | Dependencies |
| `vite.config.js` | Vite + PWA + Tailwind plugins |
| `vercel.json` | SPA rewrite for Vercel |
| `.env.local.example` | Env var template |
| `schema.sql` | Supabase Postgres DDL + seed + RLS policies |

### Source (`src/`)
| File | Purpose |
|---|---|
| `src/main.jsx` | Entry point — BrowserRouter + StrictMode |
| `src/App.jsx` | Route definitions |
| `src/index.css` | Tailwind v4 + theme tokens + body styles |
| `src/lib/supabase.js` | Supabase client singleton |
| `src/lib/db.js` | All database queries and mutations |

### Pages (`src/pages/`)
| File | Route | Purpose |
|---|---|---|
| `Home.jsx` | `/` | Dashboard: active block, CTA, last session scores |
| `History.jsx` | `/history` | All blocks list |
| `BlockDetail.jsx` | `/history/:blockId` | Block detail + completion summary |
| `SessionView.jsx` | `/history/:blockId/sessions/:sessionId` | Read-only completed session |
| `SessionOverview.jsx` | `/sessions/:sessionId` | Drill list, reorder, Begin Session |
| `DrillEntry.jsx` | `/sessions/:sessionId/drill/:drillId` | Full-screen score wizard |
| `Progress.jsx` | `/progress` | All-time charts per drill |
| `Drills.jsx` | `/drills` | Block Templates + Drill Library CRUD |

### Components (`src/components/`)
| File | Purpose |
|---|---|
| `Layout.jsx` | Page wrapper with bottom nav padding |
| `BottomNav.jsx` | Fixed 4-tab bottom navigation (Home/History/Progress/Drills) |
| `ScoreInput.jsx` | Stepper ±1 + tap score → numpad overlay |
| `Numpad.jsx` | Custom 0-9 numpad overlay |
| `DrillInstructions.jsx` | Collapsible drill instructions |

### Public (`public/`)
| File | Purpose |
|---|---|
| `icon-192.png` | App icon 192×192 (placeholder from bocce — replace with real golf icon) |
| `icon-512.png` | App icon 512×512 (placeholder from bocce — replace with real golf icon) |

---

## Setup

### Prerequisites
- Node.js 20+
- Supabase project (free tier works)

### 1. Install dependencies

> Note: npmjs.org is blocked on UKG networks (Zscaler). Run this on a personal network or phone hotspot.

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In the SQL editor, paste and run `schema.sql` (includes DDL + seed + RLS policies)
3. Go to Project Settings → API → copy **Project URL** and **anon public** key

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key
```

### 4. Dev server

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel deploy --prod
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel dashboard → Settings → Environment Variables
```

---

## Pending Actions
- [x] Placeholder icon files added to `public/` (bocce icons — functional for PWA install)
- [ ] Replace `public/icon-192.png` and `public/icon-512.png` with real golf icons
- [ ] Create Supabase project and run `schema.sql` in the SQL editor
- [ ] Copy `.env.local.example` to `.env.local` and fill in Supabase credentials
- [ ] Connect to a non-UKG network and run `npm install` (npmjs.org blocked by Zscaler)
- [ ] Run `npm run dev` to test locally
- [ ] Deploy to Vercel: `npx vercel deploy --prod` (set env vars in Vercel dashboard)
