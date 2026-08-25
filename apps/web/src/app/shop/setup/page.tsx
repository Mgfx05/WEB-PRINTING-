"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  StoreIcon,
  SparklesIcon,
  CheckCircle2Icon,
  PrinterIcon,
  RefreshCwIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function ShopSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [postalCode, setPostalCode] = useState("560001");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/shop/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          address,
          city,
          state,
          postalCode,
          phone,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/shop/dashboard");
      } else {
        setError(json.error?.message || "Failed to setup shop");
      }
    } catch {
      setError("Network error setting up shop");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #ecfdf5 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main className="container-app" style={{ padding: "3rem 1.5rem", flex: 1 }}>
        <div style={{ maxWidth: "620px", margin: "0 auto" }}>
          {/* Header Banner */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "#047857",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                boxShadow: "0 4px 12px rgba(4, 120, 87, 0.3)",
              }}
            >
              <StoreIcon size={28} />
            </div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
                marginBottom: "0.4rem",
              }}
            >
              Register Your Print Shop
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9375rem" }}>
              Join the ERB Print Network and start receiving automated customer print orders.
            </p>
          </div>

          <div className="card-base" style={{ padding: "2rem", background: "white" }}>
            <form onSubmit={handleSetup} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--radius)",
                    color: "#b91c1c",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Shop Name */}
              <div>
                <label
                  htmlFor="setup-shop-name"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Shop Name *
                </label>
                <input
                  id="setup-shop-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FastPrint Xerox & Graphics"
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="setup-shop-desc"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Shop Description / Specialties
                </label>
                <input
                  id="setup-shop-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Color documents, thesis binding, CAD blueprints"
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Street Address */}
              <div>
                <label
                  htmlFor="setup-shop-address"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Street Address *
                </label>
                <input
                  id="setup-shop-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. #42 5th Cross, Koramangala"
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* City & State Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    htmlFor="setup-shop-city"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    City *
                  </label>
                  <input
                    id="setup-shop-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="setup-shop-state"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    State *
                  </label>
                  <input
                    id="setup-shop-state"
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="setup-shop-phone"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Contact Phone Number
                </label>
                <input
                  id="setup-shop-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              <div
                style={{
                  padding: "0.85rem",
                  background: "#f0fdf4",
                  borderRadius: "var(--radius)",
                  fontSize: "0.8125rem",
                  color: "#065f46",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ShieldCheckIcon size={16} />
                <span>
                  Initial setup automatically provisions a starter printer & default pricing rules.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                id="complete-shop-setup-btn"
                style={{
                  marginTop: "0.5rem",
                  padding: "0.8rem 1.5rem",
                  background: "#047857",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(4, 120, 87, 0.25)",
                }}
              >
                {isSubmitting ? (
                  <RefreshCwIcon size={16} className="animate-spin" />
                ) : (
                  <SparklesIcon size={16} />
                )}
                {isSubmitting ? "Setting Up Shop..." : "Complete Setup & Launch Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
