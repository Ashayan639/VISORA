# VISORA — Demo Video Script

> **Target length:** 2 minutes · **Tone:** confident, visual-first, judge-friendly  
> **Backup:** 30-second pitch at the end

---

## Pre-recording checklist

- [ ] Browser at 100% zoom, dark mode if available  
- [ ] Close unrelated tabs; use incognito if extensions clutter UI  
- [ ] Demo mode works (`/generate` → **Try Demo**, no API keys required)  
- [ ] Optional: `FAL_KEY` set for one live generation beat (15s)  
- [ ] Mic test; screen record at 1920×1080  

---

## 2-minute demo script

| Time | Scene | Action | Narration |
|------|-------|--------|-----------|
| **0:00–0:12** | Landing `/` | Scroll briefly past hero; hover “Generate” | “Most founders have an idea—but not a *visual* reality. VISORA turns ideas and websites into a full brand world in minutes.” |
| **0:12–0:28** | `/generate` | Click **Try Demo**; let chat messages animate in | “I’ll start in Demo Mode—no API keys needed for judges. Watch the assistant build Urban Brew Ceylon: a specialty coffee brand for Colombo professionals.” |
| **0:28–0:48** | Generate — widgets | Pause on Brand card, then Visual grid as it appears | “OpenAI shapes the strategy—name, tagline, trust score. Then **fal.ai** generates the visuals: product mockup, hero, Instagram ad, and lifestyle scene—in parallel.” |
| **0:48–1:05** | `/project/demo-1` | Open project; click **Visuals** tab, then **3D** tab | “Every project gets a detail page. Here are fal-powered 2D assets—and our **3D Brand Reality**: a GLB product model via fal TRELLIS, viewable in the browser.” |
| **1:05–1:18** | Trust + Marketing tabs | Click **Trust Score**, then **Marketing** | “We also score credibility—where the story is strong and where to improve—and ship launch-ready marketing copy.” |
| **1:18–1:32** | `/gallery` | Show three demo cards with scores | “Projects land in the gallery. Founders can compare concepts, reopen any brand, and pitch with real visuals—not slides of bullet points.” |
| **1:32–1:48** | `/studio` | Show empty state; optionally upload image if `FAL_KEY` set | “Studio is for 3D-only iteration: upload a product photo, and fal converts it to a 3D model—same TRELLIS pipeline, focused workflow.” |
| **1:48–2:00** | `/tech` or landing | Quick scroll; end on logo / CTA | “VISORA: Idea to Reality, URL to Reality—powered by fal.ai for every pixel and every polygon. Thank you.” |

### Optional live-generation insert (swap 0:28–0:48)

If keys are configured, replace the demo chat segment with:

> “I’ll type a one-line startup idea live… [submit] …brand kit in seconds, fal visuals filling the grid now.”

Keep this only if generation is reliable on venue Wi‑Fi.

---

## On-screen callouts (lower-thirds)

Use sparingly—3 max per video:

1. `Idea → Reality · URL → Reality`  
2. `fal.ai · Flux Schnell + TRELLIS`  
3. `2D visuals + 3D GLB + Trust Score`  

---

## 30-second backup pitch

> **Use if the video fails or for live Q&A opening.**

“VISORA is a visual business reality engine built for the **Best Use of fal** track. Founders enter a startup idea—or paste an existing website—and get a complete brand: strategy from OpenAI, **four marketing visuals from fal Flux**, and a **3D product model from fal TRELLIS** you can rotate in the browser. We add an AI Trust Score and launch copy so teams don’t just look good—they know what to fix. Demo mode runs with zero API keys; live mode generates real assets in under a minute. VISORA lets you **see your business before you build it**.”

**(~30 seconds at moderate pace)**

---

## Closing slide (static)

```
VISORA
See your business before you build it.

fal.ai · Flux + TRELLIS
Demo: [your-url]/generate
GitHub: [your-repo]
```

---

## Anticipated judge questions

| Question | Short answer |
|----------|----------------|
| Why fal vs. other image APIs? | Speed (Schnell), unified 2D+3D stack, TRELLIS for GLB meshes, generous hackathon fit. |
| What if fal fails? | Per-asset fallback placeholders; demo mode never calls fal. |
| Is the trust score real? | LLM-rubric scoring with category breakdown; template fallback without OpenAI. |
| URL mode? | Brand route accepts `website_url`; full crawl is on the roadmap. |
| Security? | `FAL_KEY` server-only; sanitized API errors; `.env.local` gitignored. |

---

*Good luck with the submission.*
