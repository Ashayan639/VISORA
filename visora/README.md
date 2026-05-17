# VISORA

**A fal.ai-powered visual business reality engine that turns startup ideas and existing websites into brand visuals, 3D product models, trust scores, and launch-ready marketing assets.**

VISORA is a hackathon-ready web application: describe an idea or paste a URL, and the pipeline orchestrates **OpenAI** (brand intelligence), **fal.ai** (images and 3D), and **Supabase** (persistence) into a single, judge-friendly demo.

---

## Problem statement

Early-stage founders and small teams need **trusted**, **on-brand** launch assets—not generic AI copy and stock imagery. Today, “AI branding” often produces flat text and disconnected tools: no cohesive **visual system**, no **3D product presence**, and no **honest readiness signal** for go-to-market. VISORA treats visuals and 3D as first-class outputs, not afterthoughts.

---

## Solution overview

VISORA runs an opinionated **three-API pipeline** behind a conversational workspace:

| Mode | Input | Outcome |
|------|--------|---------|
| **Idea → Reality** | Short description of a startup or product | Brand brain, trust score, fal.ai visual set, optional 3D model, marketing pack, website concept |
| **URL → Reality** | Live website URL | Brand DNA-style analysis, refreshed strategy and prompts, regenerated visuals aligned to the site’s voice |

Both modes share the same architecture: **reason once** (OpenAI), **render many** (fal.ai), **remember everything** (Supabase / gallery).

---

## Why this fits **“Best Use of fal”**

fal.ai is not a single-image add-on—it is the **production render layer** for VISORA:

- **Product mockups** — shelf, in-hand, and contextual shots  
- **Hero images** — landing-page centerpiece creative  
- **Social ads** — campaign-ready frames  
- **Lifestyle scenes** — aspirational brand worldbuilding  
- **3D product models** — GLB output for embeddable “business reality” (text-to-3D and image-to-3D flows)

OpenAI shapes the *strategy*; Supabase holds the *memory*; **fal.ai builds the sensory layer** judges can see and spin in 3D.

---

## Main features

- **Conversational generate workspace** — natural-language intake, streaming assistant turns, rich widgets (brand card, trust score, image grid, 3D preview, website concept, marketing pack).  
- **3D Studio** — dedicated flow for product/scene meshes with viewer integration.  
- **Gallery** — saved projects; filters for source type, 3D, and trust band.  
- **Technology page** — architecture narrative for judges (`/tech`).  
- **Presentation polish** — Framer Motion page transitions, scroll reveals, responsive chat shell (sidebar + bottom sheets on small screens).  
- **Auth-ready** — NextAuth with Google/GitHub (optional via env); demo works without OAuth.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js** (App Router), **React**, **TypeScript** |
| Styling | **Tailwind CSS** v4 |
| Motion | **Framer Motion** |
| AI — brand | **OpenAI** (via server routes) |
| AI — visuals & 3D | **fal.ai** (`@fal-ai/client`, server-only keys) |
| Database & auth storage | **Supabase** (`@supabase/supabase-js`; optional adapter) |
| Session / OAuth | **NextAuth.js** |
| 3D rendering | **Three.js**, **React Three Fiber**, **Drei**; additional **Spline** on landing |

> *The repo targets a current Next.js 16.x line; adjust the badge or copy if you pin a different release.*

---

## How to run locally

### Prerequisites

- **Node.js** 20+ recommended  
- **npm** (or pnpm/yarn)

### Setup

```bash
cd visora
npm install
```

Copy environment template and fill values:

```bash
cp .env.example .env.local
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:3000**.

### Production build

```bash
npm run build
npm start
```

---

## Environment variables

| Variable | Required for | Description |
|-----------|----------------|-------------|
| `FAL_KEY` | fal.ai images & 3D | Server-side API key ([fal.ai dashboard](https://fal.ai/dashboard/keys)). |
| `OPENAI_API_KEY` | Live brand brain | Server-side OpenAI key; app degrades to template fallback if unset. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional Gemini path | Reserved for extensions; not required for core demo. |
| `NEXT_PUBLIC_SUPABASE_URL` | Gallery / cloud save | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe Supabase | Anon key for browser SDK. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes | Service role; **never** expose to client. |
| `NEXTAUTH_SECRET` | Signed sessions | Random secret for NextAuth. |
| `NEXTAUTH_URL` | OAuth callbacks | e.g. `http://localhost:3000` in dev. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in | Optional OAuth. |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub sign-in | Optional OAuth. |

Never commit `.env.local`. Use `.env.example` as the source of truth for names and hints.

---

## Demo flow (suggested for judges)

1. **Landing** — Show positioning and “Best Use of fal” story; open **`/tech`** if architecture depth helps.  
2. **Generate** — Start **Idea → Reality**: one-sentence pitch → show brand widget → trust score → **fal.ai image grid** → optional **3D** prompt.  
3. **URL mode** — Paste a real site URL → contrast analysis + refreshed visuals.  
4. **Gallery / Studio** — Show persistence and 3D-focused workflow.  
5. **Close** — Restate: *OpenAI = brain, fal.ai = visual & 3D reality, Supabase = memory.*

---

## Screenshots

<!-- Add 3–5 images for judges, e.g. -->

| Placeholder | Suggested capture |
|-------------|-------------------|
| ![Landing](docs/screenshots/landing.png) | Hero + value prop |
| ![Generate chat](docs/screenshots/generate.png) | Chat with brand + image widgets |
| ![3D / Studio](docs/screenshots/studio.png) | Model viewer or GLB preview |
| ![Gallery](docs/screenshots/gallery.png) | Project grid |
| ![Tech architecture](docs/screenshots/tech.png) | `/tech` flow diagram |

*Create a `docs/screenshots/` folder and drop PNGs; update paths above.*

---

## Team roles *(placeholder)*

| Name | Role | Focus |
|------|------|--------|
| _TBD_ | Product / narrative | Problem, demo script, judge Q&A |
| _TBD_ | Full-stack / AI | OpenAI + fal.ai orchestration, APIs |
| _TBD_ | Frontend / motion | Next.js UI, Framer Motion, responsiveness |
| _TBD_ | 3D / creative tech | Three.js, studio experience |

---

## Future improvements

- Deeper **Supabase RLS** and multi-user project sharing.  
- **Streaming** assistant tokens and progressive image reveal.  
- **Video** or **motion ad** outputs via additional fal.ai models.  
- **Analytics** on trust score vs. conversion proxies for calibration.  
- **Public share links** for read-only project decks.

---

## Further reading

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** — condensed narrative for judges and landing copy.  
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** — 2-minute video structure + 30-second backup pitch.

---

## License

This project is licensed under the **MIT License** — see the [`LICENSE`](../LICENSE) file in the repository root.
