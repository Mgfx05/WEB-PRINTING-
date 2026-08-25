"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  PrinterIcon,
  AlertCircleIcon,
  Loader2Icon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "SHOP_OWNER" ? "SHOP_OWNER" : "CUSTOMER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "Failed to create account.");
      }

      // Auto sign in after successful registration
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!loginRes || loginRes.error) {
        router.push("/auth/login?registered=true");
        return;
      }

      if (role === "SHOP_OWNER") {
        router.push("/shop/setup");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please check your details.");
      setLoading(false);
    }
  };

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
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                background: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
                boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
              }}
            >
              <PrinterIcon size={26} color="white" />
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              Create your account
            </h1>
          </Link>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Free to use — start printing or managing your shop in minutes
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              padding: "0.875rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--radius)",
              color: "#991b1b",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}
          >
            <AlertCircleIcon size={18} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
            <span>{error}</span>
          </div>
        )}

        <div
          className="card-base"
          style={{
            padding: "2rem",
            background: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <form id="register-form" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div>
                <label
                  htmlFor="register-name"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="input-base"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.9375rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="input-base"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.9375rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="register-phone"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.375rem",
                  }}
                >
                  Phone number <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="input-base"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.9375rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="input-base"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.9375rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="register-role"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.375rem",
                  }}
                >
                  Account type
                </label>
                <select
                  id="register-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    cursor: "pointer",
                  }}
                >
                  <option value="CUSTOMER">Customer — I want to upload & print documents</option>
                  <option value="SHOP_OWNER">Shop Owner — I run a xerox or print business</option>
                </select>
              </div>

              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2Icon size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRightIcon size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
            color: "var(--muted-foreground)",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2Icon className="animate-spin" size={24} color="var(--primary)" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
