import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * VISORA — NextAuth catch-all route handler (App Router).
 *
 * Exposes:
 *   GET  /api/auth/*  (session, csrf, providers, callbacks, …)
 *   POST /api/auth/*  (sign-in, sign-out, callbacks, …)
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
