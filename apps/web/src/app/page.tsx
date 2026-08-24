import type { Metadata } from "next";
import Link from "next/link";
import {
  PrinterIcon,
  UploadIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ZapIcon,
  StarIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ERB — Upload. Print. Done.",
  description:
    "Connect with local print shops. Upload your PDF, choose your options, track your order in real time.",
};

const FEATURES = [
  {
    icon: UploadIcon,
    title: "Upload any PDF",
    description:
      "Drag, drop, or browse. We support any PDF up to 50MB with instant preview.",
  },
  {
    icon: ZapIcon,
    title: "Live price calculator",
    description:
      "Price updates instantly as you choose paper size, color, copies, and more.",
  },
  {
    icon: MapPinIcon,
    title: "Choose a nearby shop",
    description:
      "Browse local print shops with real-time printer availability.",
  },
  {
    icon: ClockIcon,
    title: "Track your order",
    description:
      "Follow every step from upload to printed — no refresh needed.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure & private",
    description:
      "Your documents are encrypted in transit and auto-deleted after 7 days.",
  },
  {
    icon: CheckCircleIcon,
    title: "Reliable queue",
    description:
      "Every job is unique, persistent, and never lost — even if the shop restarts.",
  },
];

const STEPS = [
  { number: "01", title: "Upload your PDF", desc: "Drag and drop or browse your files" },
  { number: "02", title: "Configure options", desc: "Choose size, color, duplex, copies and more" },
  { number: "03", title: "Select a shop", desc: "Pick a nearby shop with available printers" },
  { number: "04", title: "Place your order", desc: "Confirm and track real-time progress" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container-app"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PrinterIcon size={18} color="white" />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              ERB
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              href="/shops"
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Browse Shops
            </Link>
            <Link
              href="/auth/login"
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              style={{
                padding: "0.5rem 1rem",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "6rem 0 5rem",
          background:
            "linear-gradient(135deg, #eff6ff 0%, #f8fafc 40%, #f0fdf4 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container-app" style={{ textAlign: "center", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.35rem 0.875rem",
              background: "var(--color-brand-50)",
              border: "1px solid var(--color-brand-200)",
              borderRadius: "9999px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-brand-700)",
              marginBottom: "1.5rem",
            }}
          >
            <StarIcon size={12} />
            India&apos;s most reliable on-demand printing platform
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--color-neutral-900)",
              marginBottom: "1.25rem",
              maxWidth: "800px",
              margin: "0 auto 1.25rem",
            }}
          >
            Upload.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Configure.
            </span>{" "}
            Print.
          </h1>

          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--color-neutral-600)",
              maxWidth: "540px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            Connect with local print shops. Upload your PDF, choose your exact
            printing options, and track your job from queue to completion — all
            in one place.
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/auth/register"
              id="hero-cta-register"
              style={{
                padding: "0.75rem 1.75rem",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Start printing for free
            </Link>
            <Link
              href="/shops"
              id="hero-cta-browse"
              style={{
                padding: "0.75rem 1.75rem",
                background: "white",
                color: "var(--foreground)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                transition: "background 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <MapPinIcon size={16} />
              Browse print shops
            </Link>
          </div>

          {/* Trust badges */}
          <div
            style={{
              marginTop: "3rem",
              display: "flex",
              gap: "2rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              "No lost jobs — ever",
              "Real-time tracking",
              "Documents auto-deleted",
            ].map((text) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                  fontWeight: 500,
                }}
              >
                <CheckCircleIcon size={15} color="var(--color-success)" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-app">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              How it works
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
              From upload to printed in four simple steps
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {STEPS.map((step) => (
              <div key={step.number} className="card-base" style={{ padding: "1.75rem" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: "var(--color-brand-200)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    marginBottom: "0.75rem",
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--foreground)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0",
          background: "var(--color-neutral-50)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container-app">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              Built for reliability
            </h2>
            <p style={{ color: "var(--muted-foreground)" }}>
              Every feature designed around one goal: your documents get printed, every time.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card-base card-hover"
                style={{ padding: "1.5rem" }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "10px",
                    background: "var(--color-brand-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <feature.icon size={20} color="var(--color-brand-600)" />
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    color: "var(--foreground)",
                    marginBottom: "0.375rem",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-app" style={{ textAlign: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
              borderRadius: "1.5rem",
              padding: "3.5rem 2rem",
              color: "white",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              Ready to print your first document?
            </h2>
            <p
              style={{
                opacity: 0.85,
                marginBottom: "2rem",
                fontSize: "1.0625rem",
              }}
            >
              Join shops and customers already using ERB for reliable on-demand printing.
            </p>
            <Link
              href="/auth/register"
              id="footer-cta-register"
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                background: "white",
                color: "#1d4ed8",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "2rem 0",
          background: "var(--card)",
        }}
      >
        <div
          className="container-app"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PrinterIcon size={16} color="var(--color-neutral-400)" />
            <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              ERB Cloud Printing Platform
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted-foreground)",
                  textDecoration: "none",
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
