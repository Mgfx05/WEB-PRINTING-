import { nanoid } from "nanoid";
import type { ApiResponse, ApiError } from "@erb/types";

/**
 * Standard API response envelope.
 * All successful responses use this format.
 */
export function createApiResponse<T>(
  data: T
): ApiResponse<T> {
  return {
    data,
    meta: {
      requestId: nanoid(),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Standard API error response.
 * All error responses use this format.
 * Never expose internal stack traces.
 */
export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Helper to require specific role for an API route.
 * Returns true if authorized, false otherwise.
 */
export function requireRole(
  userRole: string | undefined,
  allowedRoles: string[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
