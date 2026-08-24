import type { Metadata } from "next";
import Link from "next/link";
import { PrinterIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free ERB account to start printing",
};

export default function RegisterPage() {
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
      <div style={{ width: "100%", maxWidth: "440px" }}>
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
            Create your account
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Free to use — no credit card required
          </p>
        </div>

        <div className="card-base" style={{ padding: "2rem" }}>
          <form id="register-form" action="/api/v1/auth/register" method="POST">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div>
                <label
                  htmlFor="register-name"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Full name
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your full name"
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Email address
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="register-phone"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Phone number{" "}
                  <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Min 8 characters, upper, lower, number"
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="register-role"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                  }}
                >
                  Account type
                </label>
                <select
                  id="register-role"
                  name="role"
                  defaultValue="CUSTOMER"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    background: "var(--card)",
                    border: "1px solid var(--input)",
                    borderRadius: "calc(var(--radius) - 2px)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                  }}
                >
                  <option value="CUSTOMER">Customer — I want to print documents</option>
                  <option value="SHOP_OWNER">Shop Owner — I run a print shop</option>
                </select>
              </div>

              <button
                id="register-submit"
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
                  marginTop: "0.375rem",
                }}
              >
                Create account
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
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
