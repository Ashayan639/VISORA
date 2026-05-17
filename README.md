# VISORA

VISORA is an AI Visual Business Reality Engine powered by fal.ai, OpenAI, and Supabase.

The Next.js app lives in [`visora/`](visora/). From the repo root:

```bash
npm install --prefix visora
npm run dev
```

Or `cd visora` and run `npm install` / `npm run dev` there. App URL: [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

**Option A — root directory `visora` (recommended):**

1. [Vercel](https://vercel.com) → Add New → Project → import this Git repository.
2. Set **Root Directory** to `visora` (important).
3. Leave **Framework Preset** as Next.js; install/build should be `npm install` / `npm run build` (see [`visora/vercel.json`](visora/vercel.json)).
4. In **Settings → Environment Variables**, add every key from [`visora/.env.example`](visora/.env.example) you need (at minimum `NEXT_PUBLIC_SITE_URL` and Supabase keys if you use login; `FAL_KEY` / `OPENAI_API_KEY` for live generation).
5. Set **`NEXT_PUBLIC_SITE_URL`** to your production URL, e.g. `https://your-project.vercel.app` (and the same for Preview if you want auth there).
6. In **Supabase → Authentication → URL configuration**, set **Site URL** to that Vercel URL and add **Redirect URL** `https://your-project.vercel.app/auth/callback`.

**Option B — root directory `.` (repo root):**

Use this if the Vercel project is already wired to the monorepo root. Set **Root Directory** to `.` (empty / repository root). The root [`package.json`](package.json) lists `next` (same version as [`visora/package.json`](visora/package.json)) so Vercel can detect Next.js before the app install runs; [`vercel.json`](vercel.json) installs `visora/` then runs `npm run build --prefix visora`, and [`scripts/prepare-vercel-output.mjs`](scripts/prepare-vercel-output.mjs) mirrors `.next` / `public` to the repo root on Vercel (`VERCEL=1`).

Vercel’s **Hobby** tier includes generous free hosting for personal/small projects; billing is only if you add paid addons or exceed free limits.
