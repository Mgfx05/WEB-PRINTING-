"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  StoreIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  FilterIcon,
  UploadIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

interface ShopPrinter {
  id: string;
  name: string;
  model: string | null;
  status: string;
  capabilities: {
    supportsColor: boolean;
    supportsDuplex: boolean;
    supportsA3: boolean;
    supportsA4: boolean;
  } | null;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  isAvailable: boolean;
  onlinePrinterCount: number;
  totalPrinterCount: number;
  capabilities: {
    supportsColor: boolean;
    supportsDuplex: boolean;
    supportsA3: boolean;
  };
  printers: ShopPrinter[];
}

export default function BrowseShopsPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColorOnly, setFilterColorOnly] = useState(false);
  const [filterDuplexOnly, setFilterDuplexOnly] = useState(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Fetch session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          setUser(session.user);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch shops
  const loadShops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/shops?limit=50");
      const json = await res.json();
      if (json.success && json.data?.shops) {
        setShops(json.data.shops);
      }
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const filteredShops = shops.filter((shop) => {
    if (filterOnlineOnly && !shop.isAvailable) return false;
    if (filterColorOnly && !shop.capabilities.supportsColor) return false;
    if (filterDuplexOnly && !shop.capabilities.supportsDuplex) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = shop.name.toLowerCase().includes(q);
      const matchCity = shop.city?.toLowerCase().includes(q);
      const matchAddress = shop.address.toLowerCase().includes(q);
      return matchName || matchCity || matchAddress;
    }

    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar user={user} />

      <main className="container-app" style={{ padding: "2.5rem 1.5rem", flex: 1 }}>
        {/* Header banner */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            Browse Local Print Shops
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.9375rem" }}>
            Find verified print shops near you with live printer availability.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          className="card-base"
          style={{
            padding: "1.25rem",
            marginBottom: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <SearchIcon
              size={18}
              color="var(--muted-foreground)"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              id="search-shops-input"
              placeholder="Search by shop name, city, or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: "100%", paddingLeft: "2.5rem" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <FilterIcon size={14} />
              Filter Capabilities:
            </span>

            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filterOnlineOnly}
                onChange={(e) => setFilterOnlineOnly(e.target.checked)}
              />
              <span>Online Printers Only</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filterColorOnly}
                onChange={(e) => setFilterColorOnly(e.target.checked)}
              />
              <span>Color Printing</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filterDuplexOnly}
                onChange={(e) => setFilterDuplexOnly(e.target.checked)}
              />
              <span>2-Sided Duplex</span>
            </label>
          </div>
        </div>

        {/* Shops Grid */}
        {isLoading ? (
          <div
            className="card-base"
            style={{
              padding: "4rem",
              textAlign: "center",
              color: "var(--muted-foreground)",
            }}
          >
            <RefreshCwIcon size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <p>Loading available print shops...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div
            className="card-base"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <StoreIcon size={36} color="var(--muted-foreground)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>No shops match your criteria</h3>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                id={`browse-shop-card-${shop.id}`}
                className="card-base card-hover"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "var(--color-brand-50)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <StoreIcon size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--foreground)" }}>
                          {shop.name}
                        </h3>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: shop.isAvailable ? "#d1fae5" : "#fee2e2",
                            color: shop.isAvailable ? "#065f46" : "#991b1b",
                            display: "inline-block",
                            marginTop: "0.2rem",
                          }}
                        >
                          {shop.isAvailable ? "Online & Ready" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--muted-foreground)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.4rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <MapPinIcon size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>
                      {shop.address}, {shop.city}, {shop.state}
                    </span>
                  </p>

                  {shop.phone && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--muted-foreground)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <PhoneIcon size={14} />
                      <span>{shop.phone}</span>
                    </p>
                  )}

                  {/* Capabilities Tags */}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {shop.capabilities.supportsColor && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "4px",
                        }}
                      >
                        Color
                      </span>
                    )}
                    {shop.capabilities.supportsDuplex && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#f0fdf4",
                          color: "#15803d",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "4px",
                        }}
                      >
                        Duplex
                      </span>
                    )}
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        background: "var(--color-neutral-100)",
                        color: "var(--color-neutral-700)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        borderRadius: "4px",
                      }}
                    >
                      {shop.onlinePrinterCount} / {shop.totalPrinterCount} Online
                    </span>
                  </div>
                </div>

                <Link
                  href={`/upload?shopId=${shop.id}`}
                  id={`print-at-shop-${shop.id}`}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                  }}
                >
                  <UploadIcon size={16} />
                  Print at this Shop
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
