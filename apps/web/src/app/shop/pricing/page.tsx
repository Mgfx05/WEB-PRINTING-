"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersIcon,
  CheckCircle2Icon,
  SparklesIcon,
  RefreshCwIcon,
  SaveIcon,
  HelpCircleIcon,
} from "lucide-react";
import { ShopNav } from "@/components/shop-nav";

interface PricingRuleData {
  id: string;
  name: string;
  isDefault: boolean;
  bwPricePerPage: number;
  colorPricePerPage: number;
  duplexDiscountPaise: number;
  paperSizePricing: Record<string, number> | null;
  qualityPricing: Record<string, number> | null;
  mediaPricing: Record<string, number> | null;
}

export default function ShopPricingPage() {
  const [pricingRules, setPricingRules] = useState<PricingRuleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states in INR
  const [bwRateRupees, setBwRateRupees] = useState<number>(1.0);
  const [colorRateRupees, setColorRateRupees] = useState<number>(5.0);
  const [duplexDiscountRupees, setDuplexDiscountRupees] = useState<number>(0.25);
  const [a3SurchargeRupees, setA3SurchargeRupees] = useState<number>(2.0);
  const [legalSurchargeRupees, setLegalSurchargeRupees] = useState<number>(0.5);
  const [highQualitySurchargeRupees, setHighQualitySurchargeRupees] = useState<number>(1.0);
  const [glossySurchargeRupees, setGlossySurchargeRupees] = useState<number>(3.0);
  const [photoSurchargeRupees, setPhotoSurchargeRupees] = useState<number>(5.0);

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

  const loadPricing = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/shop/pricing");
      const json = await res.json();
      if (json.success && json.data?.pricingRules) {
        setPricingRules(json.data.pricingRules);
        const defaultRule = json.data.pricingRules.find((r: PricingRuleData) => r.isDefault) || json.data.pricingRules[0];
        if (defaultRule) {
          setBwRateRupees(defaultRule.bwPricePerPage / 100);
          setColorRateRupees(defaultRule.colorPricePerPage / 100);
          setDuplexDiscountRupees(defaultRule.duplexDiscountPaise / 100);

          const paper = defaultRule.paperSizePricing || {};
          setA3SurchargeRupees((paper.A3 || 200) / 100);
          setLegalSurchargeRupees((paper.LEGAL || 50) / 100);

          const quality = defaultRule.qualityPricing || {};
          setHighQualitySurchargeRupees((quality.HIGH || 100) / 100);

          const media = defaultRule.mediaPricing || {};
          setGlossySurchargeRupees((media.GLOSSY || 300) / 100);
          setPhotoSurchargeRupees((media.PHOTO || 500) / 100);
        }
      }
    } catch (err) {
      console.error("Failed to load pricing:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      name: "Default Pricing",
      bwPricePerPage: Math.round(bwRateRupees * 100),
      colorPricePerPage: Math.round(colorRateRupees * 100),
      duplexDiscountPaise: Math.round(duplexDiscountRupees * 100),
      paperSizePricing: {
        A4: 0,
        A5: 0,
        LETTER: 0,
        A3: Math.round(a3SurchargeRupees * 100),
        LEGAL: Math.round(legalSurchargeRupees * 100),
      },
      qualityPricing: {
        DRAFT: 0,
        NORMAL: 0,
        HIGH: Math.round(highQualitySurchargeRupees * 100),
      },
      mediaPricing: {
        PLAIN: 0,
        MATTE: 100,
        GLOSSY: Math.round(glossySurchargeRupees * 100),
        PHOTO: Math.round(photoSurchargeRupees * 100),
      },
    };

    try {
      const res = await fetch("/api/v1/shop/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        loadPricing();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(json.error?.message || "Failed to update pricing rules");
      }
    } catch {
      alert("Network error updating pricing rules");
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
      <ShopNav user={user} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Shop Pricing & Rates Configurator
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            Set customer rates in INR (₹). Rates are calculated server-side in paise to guarantee exact quotes.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading pricing rules...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: "800px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Core Rates Card */}
              <div className="card-base" style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem" }}>
                  1. Base Page Rates & Duplex Discount
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {/* Black & White */}
                  <div>
                    <label
                      htmlFor="bw-rate-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      B&W Price per Page (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>₹</span>
                      <input
                        id="bw-rate-input"
                        type="number"
                        step="0.10"
                        min="0.10"
                        value={bwRateRupees}
                        onChange={(e) => setBwRateRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%", fontWeight: 700 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      Standard: ₹1.00 / page
                    </span>
                  </div>

                  {/* Color */}
                  <div>
                    <label
                      htmlFor="color-rate-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      Full Color Price per Page (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>₹</span>
                      <input
                        id="color-rate-input"
                        type="number"
                        step="0.25"
                        min="0.50"
                        value={colorRateRupees}
                        onChange={(e) => setColorRateRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%", fontWeight: 700 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      Standard: ₹5.00 / page
                    </span>
                  </div>

                  {/* Duplex Discount */}
                  <div>
                    <label
                      htmlFor="duplex-discount-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      Duplex Discount / Sheet (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>-₹</span>
                      <input
                        id="duplex-discount-input"
                        type="number"
                        step="0.05"
                        min="0.00"
                        value={duplexDiscountRupees}
                        onChange={(e) => setDuplexDiscountRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%", fontWeight: 700 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      Discount when both sides used
                    </span>
                  </div>
                </div>
              </div>

              {/* Paper Sizes & Media Surcharges */}
              <div className="card-base" style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem" }}>
                  2. Paper Size & Quality Surcharges
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {/* A3 Paper Extra */}
                  <div>
                    <label
                      htmlFor="a3-extra-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      A3 Large Format Extra (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>+₹</span>
                      <input
                        id="a3-extra-input"
                        type="number"
                        step="0.50"
                        min="0.00"
                        value={a3SurchargeRupees}
                        onChange={(e) => setA3SurchargeRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  {/* Legal Paper Extra */}
                  <div>
                    <label
                      htmlFor="legal-extra-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      Legal Paper Extra (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>+₹</span>
                      <input
                        id="legal-extra-input"
                        type="number"
                        step="0.10"
                        min="0.00"
                        value={legalSurchargeRupees}
                        onChange={(e) => setLegalSurchargeRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  {/* High Quality Photo Extra */}
                  <div>
                    <label
                      htmlFor="high-quality-input"
                      style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}
                    >
                      High Quality Mode Extra (₹)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>+₹</span>
                      <input
                        id="high-quality-input"
                        type="number"
                        step="0.25"
                        min="0.00"
                        value={highQualitySurchargeRupees}
                        onChange={(e) => setHighQualitySurchargeRupees(Number(e.target.value))}
                        className="input-base"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
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
                  <span>Pricing rules saved successfully! Live customer quotes are updated.</span>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  id="save-pricing-btn"
                  style={{
                    padding: "0.75rem 2rem",
                    background: "#047857",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(4, 120, 87, 0.25)",
                  }}
                >
                  {isSaving ? (
                    <RefreshCwIcon size={16} className="animate-spin" />
                  ) : (
                    <SaveIcon size={16} />
                  )}
                  {isSaving ? "Saving Rates..." : "Save Pricing Rules"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
