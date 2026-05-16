import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

type Provider = NextAuthOptions["providers"][number];

/**
 * VISORA — NextAuth (v4) configuration.
 *
 * Behaviour:
 *   - If Google credentials are present, Google sign-in is enabled.
 *   - If they are missing OR still placeholders, we log ONE warning and
 *     ship an empty providers list. NextAuth still mounts (the routes
 *     respond, `useSession()` returns `{ data: null }`), so the rest of
 *     the app keeps working — there's just no way to sign in.
 *   - `NEXTAUTH_SECRET` is required by NextAuth in production. We pass
 *     whatever is set; if missing, we warn but don't throw, matching the
 *     hackathon-mode contract.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[visora/auth] ${message}`);
}

/** True for empty / undefined / `your_*` placeholder values from .env.example. */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v.length === 0) return true;
  if (v.startsWith("your_")) return true;
  return false;
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const hasGoogle =
    !isPlaceholder(GOOGLE_CLIENT_ID) && !isPlaceholder(GOOGLE_CLIENT_SECRET);

  if (hasGoogle) {
    providers.push(
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID as string,
        clientSecret: GOOGLE_CLIENT_SECRET as string,
      }),
    );
  } else {
    warnOnce(
      "google",
      "Google OAuth credentials are missing or placeholders — sign-in is disabled. The app will continue to work without auth.",
    );
  }

  return providers;
}

if (isPlaceholder(NEXTAUTH_SECRET)) {
  warnOnce(
    "nextauth-secret",
    "NEXTAUTH_SECRET is not set. Sessions will not be signed correctly in production.",
  );
}

if (isPlaceholder(NEXTAUTH_URL)) {
  warnOnce(
    "nextauth-url",
    "NEXTAUTH_URL is not set. OAuth callbacks may fail in production.",
  );
}

export const authOptions: NextAuthOptions = {
  providers: buildProviders(),
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      // First sign-in: copy the user id (and Google `sub` as fallback)
      // onto the JWT so it persists across requests.
      if (user?.id) {
        token.id = user.id;
      } else if (profile && typeof (profile as { sub?: string }).sub === "string") {
        token.id = (profile as { sub: string }).sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

/** True when at least one auth provider is configured. */
export function isAuthConfigured(): boolean {
  return authOptions.providers.length > 0;
}
