# 🏠 Sanchos Real Estate CRM
### Complete Next.js 14 + Supabase Mobile-First CRM

---

## 🚀 5-Minute Setup

### Step 1 — Create Supabase project
1. Go to [supabase.com](https://supabase.com) → **Start your project**
2. New Project → Name: `sanchos-crm` → Choose a region → Save password
3. Wait ~2 minutes for project to initialize

### Step 2 — Run database schema
1. Supabase Dashboard → **SQL Editor** → New query
2. Copy-paste entire contents of `supabase/schema.sql`
3. Click **Run** — all tables, policies, triggers created automatically

### Step 3 — Configure environment
```bash
cp .env.local.example .env.local
```
Fill in from **Supabase → Settings → API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Step 4 — Install and run
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Step 5 — Create your account
1. Go to `/auth/signup`
2. Sign up with your email (set role to `admin`)
3. Check email to confirm (or disable email confirmation in Supabase Auth settings for dev)

---

## 📱 All Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/auth/login` | Email + password, remember me, forgot password link |
| Signup | `/auth/signup` | Full name, phone, email, password, role |
| Forgot Password | `/auth/forgot-password` | Email reset link via Supabase |
| Reset Password | `/auth/reset-password` | Set new password from email link |
| Dashboard | `/dashboard` | KPIs, pipeline donut, recent leads, quick nav; **real-time updates** |
| Leads | `/leads` | Search, filter by stage, add lead (bottom sheet) |
| Lead Detail | `/leads/[id]` | 3-tab: Details / Activities / Notes; inline edit, stage change, delete |
| Properties | `/properties` | All listings, filter by status, add property |
| Property Detail | `/properties/[id]` | Edit/delete property, full specs |
| Activities | `/activities` | Timeline by day, schedule activity, mark complete |
| Reports | `/reports` | Pipeline donut, bar chart, lead sources, activity breakdown |
| Admin Panel | `/admin` | Admin/Manager only — all agents, top performer, per-agent stats |
| Profile | `/profile` | Edit name/phone, stats, notifications toggle, admin shortcuts, logout |

---

## 🗄️ Database Schema

### Tables
| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — full_name, phone, role |
| `leads` | Full CRM lead with 7 pipeline stages, source, notes |
| `properties` | Property listings with specs and status |
| `activities` | Calls, meetings, visits, follow-ups linked to leads |
| `notifications` | Auto-created when a lead is assigned (via trigger) |

### Lead Pipeline
```
new_lead → contacted → interested → property_visit → negotiation → closed
                                                                  ↘ lost
```

### Row Level Security
- **Agents**: see/edit only their own leads, activities, properties
- **Managers & Admins**: see ALL leads, properties, activities
- **Properties**: public read, authenticated write

### Storage
- Bucket: `property-images` (public) — for property photo uploads

---

## 🔐 Auth Flow
```
/auth/login  →  Supabase signInWithPassword
/auth/signup →  Supabase signUp + auto-creates profile via DB trigger
/auth/forgot-password → resetPasswordForEmail (email link)
/auth/reset-password  → updateUser({ password })

Middleware: protects all routes, redirects unauthenticated → /auth/login
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router, Server Components) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Styling | Tailwind CSS |
| Charts | Recharts (PieChart, BarChart) |
| Icons | Lucide React |
| Types | TypeScript (full end-to-end types) |
| Real-time | Supabase Realtime (postgres_changes) |

---

## 📁 Full Project Structure

```
sanchos-crm/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          ← Email login with house SVG
│   │   ├── signup/page.tsx         ← Role selector
│   │   ├── forgot-password/page.tsx← Email reset link
│   │   └── reset-password/page.tsx ← Set new password
│   ├── dashboard/
│   │   ├── page.tsx                ← Server: fetch leads + stats
│   │   └── DashboardClient.tsx     ← Client: donut + realtime subscription
│   ├── leads/
│   │   ├── page.tsx
│   │   ├── LeadsClient.tsx         ← Search/filter/add with bottom sheet
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── LeadDetailClient.tsx← 3 tabs, pipeline bar, inline edit
│   ├── properties/
│   │   ├── page.tsx
│   │   ├── PropertiesClient.tsx    ← Card grid, add form
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── PropertyDetailClient.tsx
│   ├── activities/
│   │   ├── page.tsx
│   │   └── ActivitiesClient.tsx    ← Timeline, add sheet, complete toggle
│   ├── reports/
│   │   ├── page.tsx                ← Server: all analytics queries
│   │   └── ReportsClient.tsx       ← Donut + bar chart + progress bars
│   ├── admin/
│   │   ├── page.tsx                ← Admin/Manager only
│   │   └── AdminClient.tsx         ← Top performer + per-agent stats
│   ├── profile/
│   │   ├── page.tsx
│   │   └── ProfileClient.tsx       ← Edit info, settings, admin shortcuts
│   ├── globals.css
│   ├── layout.tsx                  ← PWA metadata + viewport
│   └── page.tsx                    ← Redirects → /dashboard
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx              ← Header with logout
│   │   └── MobileNav.tsx          ← Bottom nav + FAB with active state
│   └── ui/
│       ├── SanchosLogo.tsx         ← SVG logo (full + small)
│       ├── Badge.tsx               ← Reusable badge
│       ├── BottomSheet.tsx         ← Modal bottom sheet
│       ├── EmptyState.tsx          ← Empty state with action
│       ├── FormField.tsx           ← Form label wrapper + input classes
│       └── LoadingSpinner.tsx
├── lib/
│   ├── constants.ts                ← STAGE_CONFIG, ACTIVITY_CONFIG, etc.
│   ├── utils.ts                    ← timeAgo, initials, formatCurrency, cn
│   └── supabase/
│       ├── client.ts               ← Browser client
│       ├── server.ts               ← Server client (SSR cookies)
│       └── middleware.ts           ← Session refresh
├── types/
│   ├── database.ts                 ← Full DB types
│   └── index.ts                    ← Re-exports
├── supabase/
│   └── schema.sql                  ← Complete schema: tables, RLS, triggers, storage
├── public/
│   └── manifest.json               ← PWA manifest
├── middleware.ts                    ← Route protection
├── .env.local.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or use Vercel Dashboard → Import Git repo → Add env vars → Deploy.

---

## 🔧 Optional: Disable Email Confirmation (Dev)
Supabase Dashboard → **Authentication** → **Providers** → **Email** → Toggle off "Confirm email"

---

## 📞 Support
Built for Sanchos Real Estate — Addis Ababa, Ethiopia 🇪🇹
