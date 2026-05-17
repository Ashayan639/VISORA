# VISORA

**A fal.ai-powered visual business reality engine that turns startup ideas and existing websites into brand visuals, 3D product models, trust scores, and launch-ready marketing assets.**

---

## Problem

Founders and teams spend weeks translating a vague idea—or an existing landing page—into a coherent brand story, product visuals, and credible launch materials. Traditional workflows fragment across designers, copywriters, and 3D tools. By the time mockups exist, momentum is gone and the “reality” of the business still feels hypothetical.

## Solution

**VISORA** collapses that pipeline into one conversational workspace. Users choose how they start:

| Mode | Input | Output |
|------|--------|--------|
| **Idea → Reality** | A startup idea + optional context (industry, audience, mood) | Full brand kit, fal-generated visuals, 3D model, trust score, website concept, marketing pack |
| **URL → Reality** | An existing website URL | Brand analysis, refreshed positioning, visuals aligned to the live site, and the same launch assets |

Both modes produce a **project** you can revisit in the gallery, inspect on a detail page, and extend in the **Studio** for 3D-focused iteration.

## Why this fits “Best Use of fal”

fal.ai is not a single feature in VISORA—it is the **visual and spatial engine** of the product:

- **2D generation** (`fal-ai/flux/schnell`) — product mockups, hero images, Instagram ads, lifestyle scenes
- **3D generation** (`fal-ai/trellis`) — GLB product models from uploaded images or text prompts (via an intermediate flux render for text-to-3D)
- **Batch resilience** — parallel visual generation with per-asset fallbacks so one failure never blocks the demo
- **Server-only keys** — `FAL_KEY` never reaches the browser; all calls go through secured API routes

OpenAI shapes strategy and copy; fal.ai makes the brand **visible and tangible**.

## Main features

- **Conversational generate workspace** — guided chat that builds a project step by step
- **Dual input modes** — startup idea or website URL
- **Brand system** — name, tagline, mission, palette, typography direction
- **AI Trust Score** — category breakdown with actionable improvement hints
- **Marketing pack** — headlines, social copy, email hooks, ad angles
- **Website concept** — section outline and preview narrative
- **Visual asset grid** — four visual types generated through fal.ai
- **3D Brand Reality** — interactive GLB viewer in project detail and Studio
- **Studio** — dedicated 3D workspace with image upload → `image_to_3d`
- **Gallery & project pages** — browse, open, and share completed brands
- **Demo mode** — full walkthrough with zero API keys (placeholder SVGs + curated demo projects)
- **Auth-ready** — NextAuth (Google) + Supabase persistence when configured
- **Production-safe** — env-based secrets, sanitized API errors, graceful fallbacks

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) · React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Motion | Framer Motion |
| 2D / 3D AI | **fal.ai** (Flux Schnell + TRELLIS) |
| Strategy / copy | OpenAI (`gpt-4o-mini`) |
| Database | Supabase |
| Auth | NextAuth.js |
| 3D viewer | Three.js · React Three Fiber · Drei |

## How to run locally

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd visora
npm install
cp .env.example .env.local
# Edit .env.local — see Environment variables below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

### Demo without API keys

Click **Try Demo** on `/generate`, or open `/project/demo-1` (alias for the Urban Brew Ceylon sample). No `FAL_KEY` or `OPENAI_API_KEY` required.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values as needed:

| Variable | Purpose |
|----------|---------|
| `FAL_KEY` | fal.ai — 2D visuals and 3D models |
| `OPENAI_API_KEY` | Brand strategy, trust score, marketing copy |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server writes |
| `NEXTAUTH_SECRET` | Session signing (production) |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |

> Never commit `.env.local`. All generation routes read keys from `process.env` only.

## Demo flow (recommended for judges)

1. **Landing** (`/`) — value proposition and entry points  
2. **Generate** (`/generate`) — click **Try Demo** for instant Urban Brew Ceylon conversation  
3. **Project detail** (`/project/demo-1`) — tabs: Brand, Visuals, 3D, Website, Marketing, Trust Score  
4. **Gallery** (`/gallery`) — three demo brands with trust scores  
5. **Studio** (`/studio`) — 3D-focused workspace (upload image → 3D model when `FAL_KEY` is set)  
6. **Technology** (`/tech`) — architecture and fal.ai integration overview  
7. **Live generation** (optional) — add `FAL_KEY` + `OPENAI_API_KEY`, submit a new idea on `/generate`

## Project structure (high level)

```
visora/
├── src/app/              # Pages & API routes
│   ├── api/              # generate-brand, generate-visual, generate-3d, …
│   ├── generate/         # Main workspace
│   ├── studio/           # 3D studio
│   ├── gallery/          # Project library
│   └── project/[id]/     # Project detail
├── src/components/       # UI, chat widgets, project panels
├── src/lib/              # fal-generation, brand-generation, demoData, …
└── public/               # Static assets
```

## Team

| Role | Name |
|------|------|
| Product / pitch | _[Your name]_ |
| Full-stack / fal integration | _[Your name]_ |
| UI / UX | _[Your name]_ |
| Demo & submission | _[Your name]_ |

## Screenshots

_Add before submission — suggested captures:_

1. Landing hero  
2. Generate workspace with chat + visual grid  
3. Project detail — Visuals tab  
4. 3D model viewer (Studio or project)  
5. Trust Score panel  
6. Gallery with demo projects  

```
docs/screenshots/
├── 01-landing.png
├── 02-generate.png
├── 03-project-visuals.png
├── 04-studio-3d.png
├── 05-trust-score.png
└── 06-gallery.png
```

## Future improvements

- Real website scraping + visual analysis for URL → Reality mode  
- Editable brand kit with version history  
- Export pack (PDF / ZIP of assets + copy)  
- Team workspaces and shared galleries  
- Video ad generation via fal.ai  
- Fine-tuned trust scoring from market benchmarks  
- Stripe / launch checklist integration  

## License

MIT License — see [LICENSE](LICENSE) (add a `LICENSE` file if not present).

---

**Built for the fal.ai hackathon · Best Use of fal track**
