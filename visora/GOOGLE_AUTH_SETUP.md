# Google Authentication Setup (VISORA)

Google sign-in uses **Supabase Auth**. Credentials go in the **Supabase Dashboard**, not in `.env.local`.

## 1. Fix `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://axwbaxckfllefrcfhkwz.supabase.co
```

Project ref must match your Supabase anon key JWT (`ref` field). Wrong URL causes `DNS_PROBE_FINISHED_NXDOMAIN`.

## 2. Supabase Dashboard

**Authentication → Providers → Google**

| Field | Value |
|-------|--------|
| Enable | ON |
| Client ID | `391048564712-ictbq3k7hb08ciunbdp50kcdnh67e83q.apps.googleusercontent.com` |
| Client Secret | From Google Cloud Console (Client secrets → Copy) |

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

If dev server uses port 3004, also add: `http://localhost:3004/auth/callback`

## 3. Google Cloud Console

**APIs & Services → Credentials → OAuth 2.0 Client**

| Setting | Value |
|---------|--------|
| Authorised JavaScript origins | `http://localhost:3000` |
| Authorised redirect URIs | `https://axwbaxckfllefrcfhkwz.supabase.co/auth/v1/callback` |

Do **not** add `http://localhost:3000/auth/callback` to Google — Supabase handles that hop.

## 4. Run and test

```powershell
cd visora
npm run dev
```

Open `http://localhost:3000` → **Login** → **Continue with Google** → should redirect to `/profile`.
