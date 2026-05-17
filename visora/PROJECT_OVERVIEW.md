# VISORA — Project Overview

> Judge-facing summary · fal.ai hackathon submission

---

## Project Name

**VISORA** — Visual Business Reality Engine

---

## Pitch

A fal.ai-powered visual business reality engine that turns startup ideas and existing websites into brand visuals, 3D product models, trust scores, and launch-ready marketing assets—in minutes, not weeks.

---

## Problem

Early-stage founders struggle to **see** their business before they build it. Brand identity, product photography, social creatives, and 3D prototypes usually require separate tools, specialists, and time. Existing AI copy tools produce text, not a **credible visual world** investors and customers can react to.

---

## Solution

VISORA is a single workspace that orchestrates:

1. **Strategic layer** (OpenAI) — brand narrative, trust scoring, marketing copy, website structure  
2. **Visual layer** (fal.ai Flux) — product mockups, hero images, ads, lifestyle scenes  
3. **Spatial layer** (fal.ai TRELLIS) — downloadable GLB 3D product models  
4. **Persistence layer** (Supabase + local fallback) — projects saved to a gallery  

Users enter via **Idea → Reality** or **URL → Reality**, then refine in **Studio** for 3D-only workflows.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│   Idea + context          OR          Website URL                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/generate-brand  (OpenAI + fallback)            │
│   Brand · Trust Score · Marketing · Website concept · prompts    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         /api/generate-all-visuals  (fal-ai/flux/schnell)         │
│   product_mockup · hero_image · instagram_ad · lifestyle_scene   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/generate-3d  (fal-ai/trellis)                  │
│   text_to_3d: flux → trellis    |    image_to_3d: trellis        │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT · GALLERY · STUDIO                    │
└─────────────────────────────────────────────────────────────────┘
```

**Demo path (no keys):** curated projects, gradient SVG placeholders via `/api/placeholder`, and **Try Demo** on the generate page.

---

## Why fal.ai Is Core

| Capability | fal model | VISORA usage |
|------------|-----------|--------------|
| Fast 2D renders | `fal-ai/flux/schnell` | All marketing visuals in ~2–3s each |
| Image → 3D mesh | `fal-ai/trellis` | Studio uploads & product detail viewer |
| Text → 3D | flux → trellis chain | Prompt-only 3D from chat / Studio |
| Reliability | Server SDK + `Promise.allSettled` | Hackathon-grade demos that don’t break mid-pitch |

Without fal.ai, VISORA would be a brand document generator. **With fal.ai, it becomes a reality engine**—founders leave with images and a rotatable 3D asset, not just paragraphs.

---

## Key Features

- **Idea → Reality** — describe a startup; receive a full brand project  
- **URL → Reality** — analyze an existing site; regenerate aligned assets  
- **Four visual types** — mockup, hero, social ad, lifestyle (fal-generated)  
- **3D Brand Reality** — GLB models in-browser (R3F viewer)  
- **AI Trust Score** — scored categories + improvement suggestions  
- **Marketing pack** — multi-channel copy ready to adapt  
- **Website concept** — structured sections for a launch page  
- **Studio** — attachment-aware 3D generation workspace  
- **Gallery** — browse and reopen projects  
- **Demo mode** — zero-config judging experience  

---

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion  
- **AI — visuals & 3D:** fal.ai (`@fal-ai/client`)  
- **AI — strategy:** OpenAI API  
- **3D rendering:** Three.js, React Three Fiber, Drei  
- **Backend:** Next.js API routes (Node runtime)  
- **Database:** Supabase  
- **Auth:** NextAuth.js (Google OAuth)  

---

## 3D Brand Reality

VISORA treats 3D as a **first-class deliverable**, not an afterthought:

- **Text → 3D:** A product-focused flux image is generated, then passed to TRELLIS for mesh extraction.  
- **Image → 3D:** Users upload a reference photo in Studio; the image is hoisted to fal storage server-side, then meshed.  
- **Viewer:** Interactive orbit/zoom in project tabs and Studio, with graceful placeholder when generation is unavailable.  

This directly supports physical-product founders, D2C brands, and pitch decks that need a tangible object on screen.

---

## AI Trust Score

Beyond aesthetics, VISORA surfaces **credibility signals**:

- Composite score (0–100) with category breakdown  
- Confidence labels per dimension (e.g. market clarity, differentiation)  
- Actionable “improve” hooks tied to chat follow-ups  

The score helps founders prioritize what to fix before they ship—not just what looks good.

---

## Target Users

| Segment | Why VISORA |
|---------|------------|
| Hackathon founders | Instant pitch visuals + 3D for demo day |
| Indie makers | Brand kit without hiring a studio |
| Agencies | Rapid concept rounds for client pitches |
| Students / accelerators | Teach brand thinking with tangible outputs |

---

## Future Improvements

- Live URL crawl with screenshot-informed visual prompts  
- Asset export (ZIP / brand guidelines PDF)  
- Collaborative projects and commenting  
- fal video models for short-form ads  
- Custom trust-score rubrics per industry  
- Marketplace of brand templates  

---

## Demo Link

**Live demo:** _[Add Vercel / deployment URL before submission]_

**Quick paths:**

- Home: `/`  
- Demo generate: `/generate` → **Try Demo**  
- Sample project: `/project/demo-1`  
- Gallery: `/gallery`  
- Studio: `/studio`  
- Tech overview: `/tech`  

---

## GitHub Link

**Repository:** _[Add public GitHub URL before submission]_

---

*VISORA — See your business before you build it.*
