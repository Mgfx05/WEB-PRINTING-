/**
 * Minimal auth for Next.js middleware (Edge Runtime).
 *
 * next-auth v5 requires a special approach for Edge middleware:
 * We use the `auth` helper but configure it via the NextAuth config.
 * The middleware checks session validity without running bcrypt or
 * any Node.js-only modules.
 */
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "erb-dev-auth-secret-key-32chars-long-minimum",
  providers: [],
  trustHost: true,
});
