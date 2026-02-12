# CivicPulse - Local Community Problem Reporter

A production-ready, fully responsive, installable PWA for reporting and tracking local community issues. Built with Next.js 15, Supabase, Tailwind CSS, shadcn/ui, Framer Motion, and GSAP.

## Features

### Core

- **Report Issues** — Create reports with title, description, category, optional photo & location
- **Public Feed** — Browse all community reports with search, filter by category/status, and sort
- **Report Detail** — Full timeline with updates, comments, status flow, follow system
- **Status Flow** — Open → Acknowledged → In Progress → Closed (with community verification)
- **Follow System** — Follow any report; creators auto-follow their own reports
- **Google OAuth** — Sign in with Google via Supabase Auth

### Gamification

- **Points System** — Earn points for creating reports (+10), commenting (+2), voting (+3), confirmed closures (+20)
- **3 Badges**:
  - First Report — Create your first report
  - Helper — Post 5+ updates/comments
  - Resolver — Get 2+ closures confirmed by community

### Wow Features

- **Fix Proof Closure** — Before/after photo comparison slider when closing reports
- **Community Trust Lens / Duplicate Guard** — Smart duplicate detection during report creation using pg_trgm similarity
- **Followed Live Pulse** — Real-time notifications via Supabase Realtime for followed reports
- **Offline Draft** — Auto-saves report drafts when offline; restores with "Draft ready to submit" banner

### Nice-to-haves (Implemented)

- Search + filters (category, status, sort)
- Anti-spam (rate limits: 1 report/2min, 1 comment/20s, auto-hide at 3 flags)
- Flag button for reports/updates
- Admin dashboard (flagged items, hide/unhide, lock comments, ban users, mark duplicates)

### Technical

- **PWA** — Installable with manifest, service worker, offline page, install prompt
- **Dark/Light Mode** — System default + user toggle
- **Responsive** — Mobile-first with bottom nav + desktop top bar
- **Animations** — Framer Motion page transitions, card stagger, badge celebrations; GSAP landing parallax
- **Accessibility** — Skip link, ARIA labels, keyboard navigable, strong focus states, respects `prefers-reduced-motion`
- **SEO** — Metadata, OG tags, JSON-LD on report detail pages
- **Performance** — Lazy loading, Next/Image, skeleton loaders, dynamic imports, server components
- **Security** — Supabase RLS on all tables, server actions for all writes, input validation

## Tech Stack

| Layer             | Technology                                           |
| ----------------- | ---------------------------------------------------- |
| Framework         | Next.js 15 (App Router) + TypeScript                 |
| Auth & DB         | Supabase (Google OAuth, Postgres, Storage, Realtime) |
| Styling           | Tailwind CSS v4 + shadcn/ui                          |
| Animations        | Framer Motion + GSAP                                 |
| Icons             | Lucide React                                         |
| Toast             | Sonner                                               |
| Image compression | browser-image-compression                            |

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd Local-Community-Problem-Reporter
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

#### Run the migration

Go to your Supabase dashboard → SQL Editor → paste and run `supabase/migrations/00001_initial_schema.sql`.

#### Create storage bucket

In Supabase dashboard → Storage → Create bucket:

- Name: `report-photos`
- Public: Yes (or configure signed URLs)

#### Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase dashboard → Authentication → Providers → Google → Enable and paste Client ID + Secret

#### Enable Realtime

In Supabase dashboard → Database → Replication → Enable realtime for:

- `notifications`
- `report_updates`
- `reports`

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

```bash
npx vercel
```

Set environment variables in Vercel dashboard. Update the Google OAuth redirect URI to match your production URL.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/        # Landing + About pages
│   ├── (app)/              # Feed, Report, Create, Profile, Notifications
│   ├── (admin)/            # Admin dashboard
│   ├── auth/callback/      # OAuth callback
│   └── signin/             # Sign-in page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, MobileNav, Footer, SkipLink
│   ├── report/             # ReportCard, ReportDetail, StatusBadge, etc.
│   ├── landing/            # Hero, Features, CTA
│   ├── profile/            # BadgeDisplay
│   ├── notifications/      # NotificationBell
│   └── pwa/                # PWAProvider, install prompt
├── lib/
│   ├── supabase/           # Client, Server, Middleware helpers
│   ├── actions/            # Server actions (reports, updates, follows, etc.)
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── hooks/                  # useRealtime, useOfflineDraft, useReducedMotion
└── middleware.ts            # Auth + admin protection
```

## Data Model

### Enums

- `report_status`: OPEN, ACKNOWLEDGED, IN_PROGRESS, CLOSED
- `update_type`: COMMENT, UPDATE, STATUS_CHANGE, CLOSURE_REQUEST

### Tables

- `profiles` — User profiles with points, badges, role
- `reports` — Community problem reports
- `report_updates` — Comments and status changes
- `report_follows` — Follow system
- `closure_votes` — Community verification votes
- `flags` — Content moderation flags
- `notifications` — In-app notifications

## Location Privacy

- **Approximate area** (default): Coordinates rounded to 3 decimal places (~100m precision)
- **Exact pin** (opt-in): Full coordinates stored when user explicitly enables it
- UI clearly shows "Approximate area" badge when location is not exact

## Closure Verification Rules

1. Creator/admin closes report → status becomes "Closed (Awaiting Verification)"
2. Community members vote "Fixed" or "Not Fixed"
3. If ≥2 "Fixed" votes (excluding closer) AND true > false → **Confirmed Fixed** (+20 points to closer)
4. If ≥2 "Not Fixed" votes → Auto-reopens to **In Progress**

## Security & Abuse Prevention

CivicPulse implements multiple layers of security and abuse prevention to ensure a safe, trustworthy community platform.

### Row-Level Security (RLS)

All database tables have RLS enabled with strict policies:

- **profiles**: Users can only update their own `display_name` and `avatar_url`. Protected fields (`points`, `badges`, `role`, `is_banned`) are read-only to prevent privilege escalation.
- **reports**: Non-banned authenticated users can create reports. Only creators and admins can update their own reports. Admins can delete any report.
- **report_updates**: Only non-banned users can comment. Admins bypass comment locks.
- **notifications**: **No direct INSERT allowed** - notifications are created exclusively by database triggers, preventing users from creating fake notifications to spam others.
- **Admin-only**: Flags are only visible to admins.

### Rate Limiting & Anti-Spam

**Application-level rate limits** (enforced in server actions):

- **Report creation**: 1 report per 2 minutes per user
- **Comments/Updates**: 1 per 20 seconds per user
- **Points cap**: Comment/update points capped at 30 points/day (15 actions)

**Auto-moderation**:

- Reports with ≥3 flags are automatically hidden
- Triggers handle auto-hiding without manual intervention

### Admin Controls

Admins have full moderation capabilities:

- View all flagged content in `/admin`
- Hide/unhide reports
- Lock comments on reports
- Ban users (banned users cannot create reports, comments, or votes)
- Mark reports as duplicates
- Override all RLS policies for moderation

### Input Validation

**Server-side validation** on all user inputs:

- Report titles: 3-200 characters (database constraint)
- Image uploads: Client-side compression with `browser-image-compression`
- Location data: Optional, with clear "Approximate area" vs "Exact pin" distinction
- SQL injection protection: Supabase client with parameterized queries

### Image Upload Restrictions

- **Storage**: Supabase Storage with public bucket `report-photos`
- **Client-side compression**: Images compressed before upload to reduce storage costs and improve performance
- **Path validation**: All photo paths validated server-side
- **No executable uploads**: Storage bucket configured to serve images only

### Closure Verification Trust System

Prevents false closures:

- Community voting required (≥2 "Fixed" votes, excluding closer)
- Auto-reopens if ≥2 "Not Fixed" votes
- Before/after photo comparison for transparency
- Badges awarded only after community confirmation

### Privacy

- **Location privacy by default**: Coordinates rounded to 3 decimal places (~100m precision)
- **Opt-in exact location**: Users must explicitly enable "Exact pin"
- **No personal data required**: OAuth provides email, but app only stores display name and avatar

## Judge Mode: 10-Step Checklist

1. **Visit /** — Landing page with hero, features, CTA, animations (GSAP parallax)
2. **Sign in with Google** — Click "Sign In", authenticate via Google OAuth
3. **Create a report** — Go to /create, fill form, add photo + location. Note duplicate guard appears as you type the title
4. **Browse feed** — Visit /feed, use search, category filter, status filter
5. **View report detail** — Click a report, see timeline, status badge, follow button, location badge
6. **Follow + comment** — Follow the report, add a comment. Check /notifications for the live pulse
7. **Close a report** — Change status to Closed with closure note and optional "after" photo. See Before/After reveal slider on detail page
8. **Vote on closure** — Sign in as another user, vote "Fixed" or "Not Fixed" on the closed report
9. **Check profile** — Visit /me to see points, badges, reports, followed list. Visit /u/[id] for public profile
10. **Test PWA** — Open in Chrome/Edge, look for install prompt. Go offline → see offline page. Start a report offline → see "Draft ready to submit" banner when back online

### Bonus checks

- Toggle dark/light mode (system default + manual toggle)
- Resize to mobile → bottom nav with FAB appears
- Check "Approximate area" badge on report with location
- Flag a report → admin sees it in /admin
- Tab through the app → verify keyboard navigation and focus states
