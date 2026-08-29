/**
 * Minimal auth for Next.js middleware (Edge Runtime).
 *
 * next-auth v5 requires a special approach for Edge middleware:
 * We use the `auth` helper but configure it via the NextAuth config.
 * The middleware checks session validity without running bcrypt or
 * any Node.js-only modules.
 *
 * NOTE: `providers` must remain empty here — bcrypt and Prisma are
 * Node.js-only and cannot run in the Edge Runtime. Actual credential
 * validation happens exclusively in apps/web/src/lib/auth/auth.ts.
 *
 * NOTE: `trustHost: true` is required when deployed behind a reverse
 * proxy (e.g., Nginx, Vercel, Cloudflare) so NextAuth trusts the
 * forwarded host header instead of rejecting the request.
 */
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days — must match auth.ts
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "erb-dev-auth-secret-key-32chars-long-minimum",
  providers: [],
  trustHost: true,
});

