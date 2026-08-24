import type { Metadata } from "next";
import Link from "next/link";
import { PrinterIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ERB account",
};

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <PrinterIcon size={24} color="white" />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Sign in to your ERB account
          </p>
        </div>

        {/* Form card */}
        <div className="card-base" style={{ padding: "2rem" }}>
          <form id="login-form" action="/api/auth/callback/credentials" method="POST">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label
                  htmlFor="login-email"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    marginBottom: "0.375rem",
                  }}
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="input-base"
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.375rem",
                  }}
                >
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--foreground)",
                    }}
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/reset-password"
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--primary)",
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="input-base"
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  marginTop: "0.25rem",
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            fontSize: "0.875rem",
            color: "var(--muted-foreground)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
