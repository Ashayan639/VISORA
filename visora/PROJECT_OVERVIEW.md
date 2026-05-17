# VISORA — Project overview

*Judge-facing summary. Technical README: [README.md](./README.md). Demo timing: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).*

---

## Project name

**VISORA** — *Visual Business Reality Engine*

---

## Pitch

VISORA is a **fal.ai-powered visual business reality engine** that turns **startup ideas** and **existing websites** into **brand visuals**, **3D product models**, **AI-derived trust scores**, and **launch-ready marketing assets**—in one guided workflow.

---

## Problem

Founders need launch assets that feel **credible and cohesive**, not generic AI sludge. Text-only tools leave a **visual gap**: no campaign-ready imagery, no **3D product presence**, and no simple **readiness signal** for investors or customers. Toolchains are fragmented; VISORA unifies **strategy, rendering, and memory**.

---

## Solution

VISORA exposes two intake modes that share one architecture:

1. **Idea → Reality** — Natural-language pitch → structured brand → fal.ai visuals → optional 3D → saved project.  
2. **URL → Reality** — Live site URL → brand/DNA-oriented analysis → refreshed prompts and visuals aligned to the existing voice.

**OpenAI** produces the structured “brand brain” and prompts. **fal.ai** executes GPU workloads for **stills and 3D**. **Supabase** (when configured) backs the **gallery** and durable storage; local fallbacks keep the demo runnable offline-from-cloud.

---

## How it works

1. User describes an **idea** or pastes a **URL** in the generate workspace.  
2. Server routes call **`/api/generate-brand`** (OpenAI + fallbacks) to produce brand, trust, marketing, and visual prompts.  
3. **`/api/generate-all-visuals`** and **`/api/generate-visual`** call **fal.ai** for mockup, hero, social, and lifestyle outputs.  
4. **`/api/generate-3d`** runs **fal.ai** 3D pipelines for embeddable **GLB** assets.  
5. Artifacts surface as **chat widgets** and in the **right panel**; users can open **Gallery** or **3D Studio** for focused workflows.

---

## Why fal.ai is core

fal.ai is the **visual and 3D execution engine**, not an ancillary image API:

- Batch **marketing stills** (mockup, hero, social, lifestyle).  
- **3D meshes** from text or reference images for product “reality.”  

That breadth—**2D campaign creative plus 3D**—is what makes VISORA a strong fit for a **“Best Use of fal”** narrative.

---

## Key features

| Area | Capability |
|------|------------|
| **Generate workspace** | Chat-first UX with brand, trust, images, 3D, website, and marketing widgets. |
| **3D Studio** | Dedicated 3D generation and viewing experience. |
| **Gallery** | Browse and filter saved projects (local + optional Supabase). |
| **Technology page** | `/tech` explains the three-API flow and route map for auditors. |
| **Auth (optional)** | NextAuth + Google/GitHub when keys are set; graceful demo mode otherwise. |

---

## Tech stack

- **Next.js** (App Router), **TypeScript**, **React**  
- **Tailwind CSS** v4  
- **Framer Motion**  
- **fal.ai** (`@fal-ai/client`)  
- **OpenAI** (official SDK, server routes)  
- **Supabase** (JS client + optional adapter)  
- **NextAuth.js**  
- **Three.js**, **@react-three/fiber**, **@react-three/drei**  

---

## 3D brand reality

VISORA treats **3D as part of the brand surface**, not a separate toy: product and scene meshes can be generated from the same prompts and narrative as the 2D pack, then previewed and routed to the studio experience for judges who want to **rotate and validate** the asset.

---

## AI trust score

A structured **launch-readiness-style score** (with categories and suggestions) gives judges a **single interpretable metric** alongside subjective creative quality—useful for “why this brand feels ready (or not).”

---

## Target users

- **Hackathon judges** evaluating fal.ai depth and end-to-end UX.  
- **Early-stage founders** and **indie makers** who want one session from pitch to visual + 3D pack.  
- **Agencies** prototyping client directions quickly (future positioning).

---

## Future improvements

- Team workspaces, roles, and shared galleries.  
- Stronger analytics linking trust score to user-defined KPIs.  
- Additional fal.ai models (video, upscaling, batch variants).  
- Public, read-only **deck links** for pitches.

---

## Demo link *(placeholder)*

**Production / preview URL:** _Add your deployed link (e.g. Vercel) here._

---

## GitHub link *(placeholder)*

**Repository:** _Add public or submission GitHub URL here._
