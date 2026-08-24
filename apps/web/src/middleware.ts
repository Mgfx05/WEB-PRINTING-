import { auth } from "@/lib/auth/auth-middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@erb/types";


// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/orders",
  "/upload",
  "/track",
  "/account",
  "/shop",
  "/admin",
];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/reset-password"];

// Route access control by role
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/shop": [UserRole.SHOP_OWNER, UserRole.ADMIN],
  "/admin": [UserRole.ADMIN],
};

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role as UserRole | undefined;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (isAuthenticated && userRole) {
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (
        nextUrl.pathname.startsWith(route) &&
        !allowedRoles.includes(userRole)
      ) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
