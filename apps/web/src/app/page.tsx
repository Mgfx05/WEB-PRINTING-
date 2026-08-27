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
  StoreIcon,
  SparklesIcon,
  ChevronRightIcon,
  HelpCircleIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "ERB Cloud Printing — Upload, Configure & Print at Local Shops",
  description:
    "India's leading on-demand cloud printing network. Upload any PDF, choose color & duplex options, get instant live pricing, and collect from nearby print shops.",
};

const FEATURES = [
  {
    icon: UploadIcon,
    title: "Instant PDF Analysis & Upload",
    description:
      "Upload PDFs up to 25MB with automated page count detection and SHA-256 verification.",
  },
  {
    icon: ZapIcon,
    title: "Transparent Live Pricing",
    description:
      "Real-time price breakdown in ₹ INR including paper size, color mode, and duplex discounts.",
  },
  {
    icon: MapPinIcon,
    title: "Verified Local Print Shops",
    description:
      "Locate nearby shops with verified hardware, live printer availability, and instant dispatch.",
  },
  {
    icon: ClockIcon,
    title: "Live Real-Time Tracker",
    description:
      "Follow your order through a 7-step visual timeline with live SSE event streaming.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Bank-Grade Privacy & Security",
    description:
      "Files are encrypted in transit and at rest, and automatically deleted after completion.",
  },
  {
    icon: CheckCircleIcon,
    title: "Zero-Failure Production Queue",
    description:
      "Powered by BullMQ & Redis with atomic claiming, idempotency, and automated retries.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload Document",
    desc: "Drag and drop any PDF file. We inspect page counts instantly.",
  },
  {
    number: "02",
    title: "Configure Options",
    desc: "Select B&W or Color, Duplex flipping, Paper sizes (A4/A3), and Copies.",
  },
  {
    number: "03",
    title: "Choose Shop",
    desc: "Pick a nearby verified print shop with available online printers.",
  },
  {
    number: "04",
    title: "Print & Track",
    desc: "Watch your print job progress live and pick up your fresh prints.",
  },
];

const FAQS = [
  {
    q: "How does ERB Cloud Printing work?",
    a: "ERB connects customers with local print shops. You simply upload your PDF on our web platform, configure your print settings (such as color, duplex, paper size), and send it directly to your chosen shop. The shop owner receives the job instantly on their automated queue and prints it.",
  },
  {
    q: "What file formats are supported?",
    a: "We currently support standard and high-resolution PDF documents up to 25MB. Vector graphics, reports, thesis documents, blueprints, and standard documents are fully supported.",
  },
  {
    q: "How is the pricing calculated?",
    a: "Pricing is calculated using our authoritative server pricing engine based on exact sheet count, color mode (B&W starting at ₹1.00/page, Color at ₹5.00/page), paper size surcharges, and automatic duplex discounts when printing on both sides.",
  },
  {
    q: "How do I know when my print is ready?",
    a: "Every order has a live tracking link with real-time Server-Sent Events (SSE). You can watch the status update from 'Queued' to 'Printing' to 'Completed' in real time without refreshing.",
  },
  {
    q: "I own a print shop. How can I join?",
    a: "You can sign up as a Shop Owner by creating an account and completing the quick shop onboarding wizard. You will receive your dedicated shop dashboard to manage printers, pricing, and incoming orders.",
  },
  {
    q: "Are my uploaded files deleted after printing?",
    a: "Yes. All uploaded documents are automatically and permanently deleted from our servers once your print job is completed or cancelled. We never retain your files beyond the scope of a single print job.",
  },
];

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
      }}
    >
      <Navbar />

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0 4.5rem",
          background:
            "linear-gradient(135deg, #eff6ff 0%, #f8fafc 40%, #ecfdf5 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container-app" style={{ textAlign: "center", position: "relative" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 1rem",
              background: "var(--color-brand-50)",
              border: "1px solid var(--color-brand-200)",
              borderRadius: "9999px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-brand-700)",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 6px rgba(37,99,235,0.08)",
            }}
          >
            <SparklesIcon size={14} />
            India's Next-Generation Cloud Print Network
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              color: "var(--foreground)",
              marginBottom: "1.25rem",
              maxWidth: "840px",
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
            Print Anywhere.
          </h1>

          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--color-neutral-600)",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.65,
            }}
          >
            Connect instantly with local verified print shops. Upload your documents,
            customize color and duplex options with live pricing quotes, and collect
            without waiting in queues.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/upload"
              id="hero-cta-upload"
              style={{
                padding: "0.85rem 2rem",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "white",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "transform 0.15s ease",
              }}
            >
              <UploadIcon size={18} />
              Upload & Print Document
            </Link>

            <Link
              href="/shops"
              id="hero-cta-shops"
              style={{
                padding: "0.85rem 1.75rem",
                background: "white",
                color: "var(--foreground)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <MapPinIcon size={18} color="#047857" />
              Browse Nearby Shops
            </Link>
          </div>

          {/* Platform Trust Highlights */}
          <div
            style={{
              marginTop: "3.5rem",
              display: "flex",
              gap: "2.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "100% Reliable Print Queue", icon: CheckCircleIcon, color: "#10b981" },
              { label: "Real-Time SSE Tracker", icon: ZapIcon, color: "#2563eb" },
              { label: "End-to-End Encrypted", icon: ShieldCheckIcon, color: "#7c3aed" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-600)",
                    fontWeight: 600,
                  }}
                >
                  <Icon size={16} color={item.color} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Key Numbers & Metrics Banner ────────────────────────────── */}
      <section
        style={{
          background: "white",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "2rem 0",
        }}
      >
        <div
          className="container-app"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--primary)" }}>
              ₹1.00
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginTop: "0.2rem" }}>
              Starting B&W Page Rate
            </p>
          </div>

          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "#047857" }}>
              &lt; 2 min
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginTop: "0.2rem" }}>
              Average Queue Dispatch
            </p>
          </div>

          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "#7c3aed" }}>
              100%
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginTop: "0.2rem" }}>
              Job Delivery Reliability
            </p>
          </div>

          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--foreground)" }}>
              25MB
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginTop: "0.2rem" }}>
              Max High-Res PDF Size
            </p>
          </div>
        </div>
      </section>

      {/* ── 4-Step Workflow ────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-app">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              How It Works
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
              Effortless print fulfillment from screen to paper in four steps.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="card-base"
                style={{
                  padding: "2rem 1.5rem",
                  background: "white",
                  position: "relative",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    color: "var(--color-brand-100)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    marginBottom: "1rem",
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    color: "var(--foreground)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "5.5rem 0",
          background: "var(--color-neutral-50)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container-app">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Engineered for Speed & Quality
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
              State-of-the-art cloud architecture designed to eliminate paper waste and wait times.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card-base card-hover"
                style={{
                  padding: "1.75rem",
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "var(--color-brand-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                  }}
                >
                  <feature.icon size={22} />
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: "var(--foreground)",
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

      {/* ── Partner with ERB (For Shop Owners) ────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-app">
          <div
            className="card-base"
            style={{
              padding: "3.5rem 2.5rem",
              background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "2rem",
              borderRadius: "1.5rem",
            }}
          >
            <div style={{ maxWidth: "560px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.25rem 0.75rem",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                <StoreIcon size={14} />
                Partner Network
              </div>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.75rem" }}>
                Own a Xerox or Print Shop?
              </h2>
              <p style={{ fontSize: "0.9375rem", opacity: 0.9, lineHeight: 1.6 }}>
                Automate your shop queue, reduce counter lines, and accept orders 24/7.
                Set your custom rates, connect your printers, and start earning today.
              </p>
            </div>

            <div>
              <Link
                href="/shop/setup"
                id="partner-cta-btn"
                style={{
                  padding: "0.85rem 1.75rem",
                  background: "white",
                  color: "#065f46",
                  borderRadius: "var(--radius)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                }}
              >
                Register Your Print Shop
                <ChevronRightIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0",
          background: "var(--color-neutral-50)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="container-app" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
              Everything you need to know about printing with ERB.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="card-base"
                style={{ padding: "1.5rem", background: "white" }}
              >
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <HelpCircleIcon size={18} color="var(--primary)" />
                  {faq.q}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)", lineHeight: 1.6, paddingLeft: "1.6rem" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ───────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-app" style={{ textAlign: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
              borderRadius: "1.5rem",
              padding: "4rem 2rem",
              color: "white",
              boxShadow: "0 10px 30px rgba(37,99,235,0.2)",
            }}
          >
            <h2
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              Ready to print your first document?
            </h2>
            <p
              style={{
                opacity: 0.9,
                marginBottom: "2rem",
                fontSize: "1.0625rem",
                maxWidth: "500px",
                margin: "0 auto 2rem",
              }}
            >
              Join students, professionals, and businesses printing effortlessly with ERB.
            </p>
            <Link
              href="/upload"
              id="footer-cta-upload"
              style={{
                display: "inline-block",
                padding: "0.85rem 2.25rem",
                background: "white",
                color: "#1d4ed8",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              Start Printing Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "2.5rem 0",
          background: "white",
        }}
      >
        <div
          className="container-app"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <PrinterIcon size={16} />
            </div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
              ERB Cloud Printing Platform
            </span>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            <Link href="/upload" style={{ textDecoration: "none", color: "inherit" }}>
              Upload
            </Link>
            <Link href="/shops" style={{ textDecoration: "none", color: "inherit" }}>
              Find Shops
            </Link>
            <Link href="/orders" style={{ textDecoration: "none", color: "inherit" }}>
              My Orders
            </Link>
            <Link href="/shop/setup" style={{ textDecoration: "none", color: "inherit" }}>
              For Shop Owners
            </Link>
            <Link href="/auth/login" style={{ textDecoration: "none", color: "inherit" }}>
              Sign In
            </Link>
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", width: "100%", textAlign: "center", marginTop: "1rem" }}>
            &copy; {new Date().getFullYear()} ERB Cloud Printing. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
