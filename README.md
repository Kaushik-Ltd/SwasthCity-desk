# 🏙️ SwasthCity

**Report civic issues. Get them resolved.**

SwasthCity is a full-stack civic engagement platform that gives residents a fast, transparent way to report neighborhood problems — potholes, broken streetlights, garbage, water leaks, graffiti, fallen trees — and gives local authorities the tools to triage, assign, and resolve them in the open.

Snap a photo, let AI fill in the details, and watch the report move from **Reported → Accepted → In Progress → Resolved** in full public view.

---

## ✨ Features

### For citizens
- 📸 **Photo-first reporting** — capture or upload a photo and pin a location; the report is ready to submit in under a minute.
- 🤖 **AI-assisted triage** — an AI vision model looks at the photo and automatically drafts a title, description, category, severity, and the department it should be routed to.
- 🧭 **Smart duplicate detection** — before you submit, SwasthCity searches nearby reports (within 100m) and uses AI to check whether your issue is already being tracked, so you can add support instead of filing a duplicate.
- 🗺️ **Community map** — an interactive map of every open issue nearby, filterable by status.
- 🔔 **Live status tracking** — a full audit trail of status changes, notes, and resolution photos for every report you file.
- 👍 **Community support** — back reports your neighbors have already filed to help surface what matters most.

### For authorities
- 🛡️ **Authority dashboard** — a queue of all incoming reports across the city, with reporter info attached.
- ✅ **Status & assignment workflow** — accept, reject (with a required reason), assign to a team/person, and move issues through to resolution (with a required resolution photo).
- 📊 **Analytics** — breakdowns of issues by category, severity, and status to spot trends and bottlenecks.
- 📁 **Assigned-to-me view** — a personal queue for whoever is handling a given issue.
- 🕵️ **Full transparency** — every status change is timestamped and attributed, building public trust in the resolution process.

### Platform
- 🔐 Role-based accounts (**Citizen** vs **Authority**) with a guided onboarding/profile-completion flow.
- 🔒 Row-level security enforced in Postgres — citizens only see their own reports; authorities are gated by a `has_role`-style RPC check.
- ⚡ Server-rendered, type-safe data fetching via TanStack Start server functions — no separate REST/GraphQL layer to maintain.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing via TanStack Router) |
| Styling / UI | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) primitives on Radix UI |
| Data / Auth | [Supabase](https://supabase.com/) (Postgres, Auth, Storage, RLS, RPC functions) |
| Data fetching | TanStack Query + TanStack Start server functions |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/) via an OpenAI-compatible gateway, calling `google/gemini-3-flash-preview` for image analysis & duplicate matching |
| Maps | Google Maps JavaScript API |
| Forms & validation | React Hook Form + Zod |
| Charts | Recharts |
| Tooling | Vite, TypeScript, ESLint, Prettier, Bun |

> This project was built with [Lovable](https://lovable.dev) and is set up to sync with a connected Lovable workspace (see `AGENTS.md`).

---

## 🗂️ Project Structure

```
src/
├── routes/                      # File-based routes (TanStack Router)
│   ├── index.tsx                 # Public landing page
│   ├── auth.tsx / auth.callback.tsx
│   └── _authenticated/
│       ├── dashboard.tsx         # Citizen dashboard
│       ├── report.tsx            # New report flow (photo → AI analysis → submit)
│       ├── my-reports.tsx        # A citizen's own reports
│       ├── issues.$id.tsx        # Public issue detail + timeline
│       ├── map.tsx               # Community map
│       ├── authority.tsx         # Authority queue
│       ├── all-reports.tsx / all-reports.$id.tsx
│       ├── assigned.tsx          # Reports assigned to the current authority user
│       ├── analytics.tsx         # Authority analytics dashboard
│       ├── profile.tsx / complete-profile.tsx
│       └── route.tsx             # Auth guard / layout for authenticated routes
├── lib/
│   ├── reports.functions.ts      # Server functions: create/list reports, AI triage, duplicate detection, status updates
│   ├── profile.functions.ts      # Profile server functions
│   ├── ai-gateway.server.ts      # AI provider setup (Lovable AI Gateway, OpenAI-compatible)
│   ├── auth-context.tsx          # Auth/session context + role-based home redirects
│   └── use-require-role.ts       # Route guard hook for role-gated pages
├── components/                   # Shared UI (app shell, issue cards, status badges, shadcn/ui components)
├── integrations/supabase/        # Supabase client + auth middleware
├── server.ts / start.ts          # TanStack Start server entry points
└── router.tsx                    # Router setup

supabase/
└── migrations/                   # Postgres schema: profiles, reports, status_history, report_supporters, RLS policies, RPCs
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (or Node.js 18+ with npm/pnpm as an alternative)
- A [Supabase](https://supabase.com/) project
- A Google Maps API key (for the community map)
- A Lovable AI Gateway key, or another OpenAI-compatible provider key, for AI-powered triage & duplicate detection

### 1. Clone the repository

```bash
git clone https://github.com/Kaushik-Ltd/SwasthCity-spotlight.git
cd SwasthCity-spotlight
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Google Maps
VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY="your-google-maps-key"
VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID="your-tracking-id"

# AI Gateway (server-side only — used for photo triage & duplicate detection)
LOVABLE_API_KEY="your-ai-gateway-key"
```

> ⚠️ Never commit real keys. Rotate any keys that were previously exposed in a public `.env` file.

### 4. Set up the database

Apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI or dashboard SQL editor) to create the `profiles`, `reports`, `status_history`, and `report_supporters` tables along with their RLS policies and RPC functions.

### 5. Run the dev server

```bash
bun run dev
```

The app will be available at `http://localhost:3000` (or the port Vite reports).

### Other scripts

```bash
bun run build       # Production build
bun run build:dev   # Development-mode build
bun run preview     # Preview a production build locally
bun run lint         # Run ESLint
bun run format       # Format with Prettier
```

---

## 🔄 How a Report Flows

1. **Citizen submits a report** — takes/uploads a photo, and SwasthCity's AI drafts the title, description, category, severity, and responsible department.
2. **Duplicate check** — nearby reports of the same category are compared by AI against the new photo/description; if a strong match is found, the citizen can support the existing report instead.
3. **Authority reviews** — the report lands in the authority queue, where it can be accepted, rejected (with a reason), or assigned to a team/individual.
4. **Progress is tracked** — every status change is written to a public `status_history` timeline, visible to the reporter and community.
5. **Resolution** — marking a report "Resolved" requires a resolution photo, closing the loop with visual proof.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR


## 📄 License
No license has been specified for this project yet.
