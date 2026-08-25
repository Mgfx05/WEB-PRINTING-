"use client";

import { useState, useEffect } from "react";
import {
  StoreIcon,
  SaveIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react";
import { ShopNav } from "@/components/shop-nav";

interface ShopDetails {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

export default function ShopSettingsPage() {
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [user, setUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null>(null);

  // Fetch session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) setUser(session.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/v1/shop/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = json.data;
          setShop(s);
          setName(s.name || "");
          setDescription(s.description || "");
          setAddress(s.address || "");
          setCity(s.city || "");
          setState(s.state || "");
          setPostalCode(s.postalCode || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
        }
      })
      .catch((err) => console.error("Failed to load shop settings:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/v1/shop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          address,
          city,
          state,
          postalCode,
          phone,
          email,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(json.error?.message || "Failed to update shop settings");
      }
    } catch {
      alert("Network error updating shop settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ShopNav shopName={name || "Print Shop"} user={user} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Shop Profile & Location Settings
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            Update your business name, public address, phone number, and operating details.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading shop profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: "700px" }}>
            <div className="card-base" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Shop Status Banner */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  background: "#f0fdf4",
                  borderRadius: "var(--radius)",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StoreIcon size={18} color="#047857" />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#065f46" }}>
                    Listing Status: <strong>{shop?.status || "ACTIVE"}</strong>
                  </span>
                </div>
                <span
                  style={{
                    padding: "0.15rem 0.5rem",
                    background: "#047857",
                    color: "white",
                    borderRadius: "9999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  Verified
                </span>
              </div>

              {/* Shop Name */}
              <div>
                <label
                  htmlFor="shop-name-input"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Shop Display Name
                </label>
                <input
                  id="shop-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="shop-desc-input"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Shop Description / Tagline
                </label>
                <textarea
                  id="shop-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. High-speed xerox, color thesis printing, and document binding."
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="shop-address-input"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Physical Street Address
                </label>
                <input
                  id="shop-address-input"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-base"
                  style={{ width: "100%" }}
                />
              </div>

              {/* City & State Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    htmlFor="shop-city-input"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    City
                  </label>
                  <input
                    id="shop-city-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-state-input"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    State
                  </label>
                  <input
                    id="shop-state-input"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-postal-input"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    Postal Code (PIN)
                  </label>
                  <input
                    id="shop-postal-input"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    htmlFor="shop-phone-input"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    Contact Phone Number
                  </label>
                  <input
                    id="shop-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-email-input"
                    style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    Business Email
                  </label>
                  <input
                    id="shop-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {saveSuccess && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "var(--radius)",
                    color: "#15803d",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CheckCircle2Icon size={16} />
                  <span>Shop details saved successfully!</span>
                </div>
              )}

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  id="save-shop-settings-btn"
                  style={{
                    padding: "0.65rem 1.75rem",
                    background: "#047857",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: isSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {isSaving ? (
                    <RefreshCwIcon size={16} className="animate-spin" />
                  ) : (
                    <SaveIcon size={16} />
                  )}
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
