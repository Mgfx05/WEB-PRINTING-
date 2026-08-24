import { handlers } from "@/lib/auth/auth";

// This route handler exposes NextAuth endpoints for all auth flows
export const { GET, POST } = handlers;
