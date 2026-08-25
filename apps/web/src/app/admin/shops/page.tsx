"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StoreIcon,
  SearchIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  PrinterIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";

interface ShopOwner {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  createdAt: string;
  owner: ShopOwner;
  totalOrdersCount: number;
  totalPrintersCount: number;
  onlinePrintersCount: number;
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingShopId, setUpdatingShopId] = useState<string | null>(null);

  const [sessionUser, setSessionUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((s) => {
        if (s?.user) setSessionUser(s.user);
      })
      .catch(() => {});
  }, []);

  const loadShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/v1/admin/shops", window.location.origin);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
      url.searchParams.set("limit", "50");

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && json.data) {
        setShops(json.data.shops || []);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleUpdateStatus = async (shopId: string, newStatus: string) => {
    setUpdatingShopId(shopId);
    try {
      const res = await fetch(`/api/v1/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setShops((prev) =>
          prev.map((s) => (s.id === shopId ? { ...s, status: newStatus as ShopItem["status"] } : s))
        );
      } else {
        alert(json.error?.message || "Failed to update shop status");
      }
    } catch {
      alert("Network error updating shop status");
    } finally {
      setUpdatingShopId(null);
    }
  };

  const pendingCount = shops.filter((s) => s.status === "PENDING_APPROVAL").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AdminNav user={sessionUser} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Shop Network & Approval Workflow
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            Moderate registered print shops, review pending applications, and manage service status.
          </p>
        </div>

        {/* Filter Bar */}
        <div
          className="card-base"
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Shops", count: shops.length },
              { id: "PENDING_APPROVAL", label: "Pending Approval", count: pendingCount, highlight: pendingCount > 0 },
              { id: "ACTIVE", label: "Active", count: shops.filter((s) => s.status === "ACTIVE").length },
              { id: "SUSPENDED", label: "Suspended", count: shops.filter((s) => s.status === "SUSPENDED").length },
            ].map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: isSelected ? "1px solid #7c3aed" : "1px solid transparent",
                    background: isSelected ? "#faf5ff" : "transparent",
                    color: isSelected ? "#7c3aed" : "var(--muted-foreground)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      padding: "0.1rem 0.45rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: tab.highlight ? "#ea580c" : isSelected ? "#7c3aed" : "var(--color-neutral-200)",
                      color: tab.highlight || isSelected ? "white" : "var(--color-neutral-700)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <SearchIcon
              size={15}
              color="var(--muted-foreground)"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by shop name, city, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: "100%", paddingLeft: "2.2rem", fontSize: "0.8125rem" }}
            />
          </div>
        </div>

        {/* Shops Grid */}
        {isLoading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="card-base" style={{ padding: "3rem", textAlign: "center" }}>
            <StoreIcon size={36} color="var(--muted-foreground)" style={{ margin: "0 auto 0.5rem" }} />
            <p>No shops found matching filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {shops.map((shop) => {
              const isPending = shop.status === "PENDING_APPROVAL";
              const isUpdating = updatingShopId === shop.id;

              return (
                <div
                  key={shop.id}
                  className="card-base"
                  style={{
                    padding: "1.5rem",
                    borderLeft: isPending ? "4px solid #f97316" : "4px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: isPending ? "#fff7ed" : "#ecfdf5",
                          color: isPending ? "#ea580c" : "#047857",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <StoreIcon size={24} />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{shop.name}</h3>
                          <span
                            style={{
                              padding: "0.15rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background:
                                shop.status === "ACTIVE"
                                  ? "#d1fae5"
                                  : shop.status === "PENDING_APPROVAL"
                                  ? "#ffedd5"
                                  : "#fee2e2",
                              color:
                                shop.status === "ACTIVE"
                                  ? "#065f46"
                                  : shop.status === "PENDING_APPROVAL"
                                  ? "#9a3412"
                                  : "#991b1b",
                            }}
                          >
                            {shop.status.replace("_", " ")}
                          </span>
                        </div>

                        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <MapPinIcon size={14} />
                          {shop.address}, {shop.city}, {shop.state}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.25rem",
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            marginTop: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>Owner: <strong>{shop.owner?.name || shop.owner?.email}</strong></span>
                          <span>•</span>
                          <span>{shop.onlinePrintersCount} / {shop.totalPrintersCount} Printers Online</span>
                          <span>•</span>
                          <span>{shop.totalOrdersCount} Total Orders</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {shop.status !== "ACTIVE" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(shop.id, "ACTIVE")}
                          style={{
                            padding: "0.45rem 1rem",
                            background: "#047857",
                            color: "white",
                            border: "none",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            cursor: isUpdating ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <CheckCircle2Icon size={14} />
                          Approve / Activate
                        </button>
                      )}

                      {shop.status === "ACTIVE" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(shop.id, "SUSPENDED")}
                          style={{
                            padding: "0.45rem 0.85rem",
                            background: "white",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            cursor: isUpdating ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <XCircleIcon size={14} />
                          Suspend Shop
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
