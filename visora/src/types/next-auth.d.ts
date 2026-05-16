/**
 * VISORA — NextAuth type augmentation.
 *
 * Adds `id` to `session.user` and the JWT so consumers can do
 * `session.user.id` without casting.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
