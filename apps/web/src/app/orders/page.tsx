"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PrinterIcon,
  SearchIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  UploadIcon,
  RefreshCwIcon,
  FileTextIcon,
  StoreIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

interface OrderItem {
  id: string;
  publicOrderNumber: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
  };
  document: {
    id: string;
    originalFilename: string;
    pageCount: number | null;
  };
  printJobs: Array<{
    id: string;
    status: string;
    attemptCount: number;
  }>;
}

export default function CustomerOrdersTaskPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Filters
  const [selectedTab, setSelectedTab] = useState<
    "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Fetch orders
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/orders?limit=50");
      const json = await res.json();
      if (json.success && json.data?.orders) {
        setOrders(json.data.orders);
      }
    } catch (err) {
      console.error("Failed to load print tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status categories
  const activeStatuses = [
    "CREATED",
    "UPLOADED",
    "WAITING_FOR_SHOP",
    "ACCEPTED",
    "QUEUED",
    "PRINTING",
  ];
  const completedStatuses = ["COMPLETED"];
  const cancelledStatuses = ["FAILED", "CANCELLED", "REJECTED"];

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (selectedTab === "ACTIVE" && !activeStatuses.includes(order.status)) {
      return false;
    }
    if (
      selectedTab === "COMPLETED" &&
      !completedStatuses.includes(order.status)
    ) {
      return false;
    }
    if (
      selectedTab === "CANCELLED" &&
      !cancelledStatuses.includes(order.status)
    ) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.publicOrderNumber.toLowerCase().includes(q);
      const matchDoc = order.document?.originalFilename
        ?.toLowerCase()
        .includes(q);
      const matchShop = order.shop?.name?.toLowerCase().includes(q);
      return matchOrderNum || matchDoc || matchShop;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          bg: "#d1fae5",
          color: "#065f46",
          icon: CheckCircle2Icon,
        };
      case "PRINTING":
        return {
          label: "Printing Now",
          bg: "#dbeafe",
          color: "#1e40af",
          icon: RefreshCwIcon,
          animate: true,
        };
      case "QUEUED":
        return {
          label: "In Printer Queue",
          bg: "#e0e7ff",
          color: "#4338ca",
          icon: ClockIcon,
          animate: true,
        };
      case "ACCEPTED":
        return {
          label: "Shop Accepted",
          bg: "#fef3c7",
          color: "#92400e",
          icon: ClockIcon,
        };
      case "WAITING_FOR_SHOP":
        return {
          label: "Waiting for Shop",
          bg: "#ffedd5",
          color: "#9a3412",
          icon: ClockIcon,
        };
      case "REJECTED":
        return {
          label: "Shop Rejected",
          bg: "#fee2e2",
          color: "#991b1b",
          icon: XCircleIcon,
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          bg: "#f1f5f9",
          color: "#475569",
          icon: XCircleIcon,
        };
      case "FAILED":
        return {
          label: "Print Failed",
          bg: "#fee2e2",
          color: "#991b1b",
          icon: AlertCircleIcon,
        };
      default:
        return {
          label: status,
          bg: "var(--color-neutral-100)",
          color: "var(--foreground)",
          icon: ClockIcon,
        };
    }
  };

  // Metrics summary
  const activeCount = orders.filter((o) =>
    activeStatuses.includes(o.status)
  ).length;
  const completedCount = orders.filter((o) =>
    completedStatuses.includes(o.status)
  ).length;
  const totalSpent = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

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
        {/* Header & Quick Action */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
              }}
            >
              My Print Tasks & Orders
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9375rem" }}>
              Track all your active print jobs and view past printing history.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={loadOrders}
              id="refresh-orders-btn"
              title="Refresh task list"
              style={{
                padding: "0.625rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "white",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <RefreshCwIcon size={16} className={isLoading ? "animate-spin" : ""} />
            </button>

            <Link
              href="/upload"
              id="start-new-task-btn"
              style={{
                padding: "0.625rem 1.25rem",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              }}
            >
              <UploadIcon size={16} />
              New Print Job
            </Link>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div className="card-base" style={{ padding: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>
              Active Tasks
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>
                {activeCount}
              </span>
              {activeCount > 0 && (
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              )}
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>
              Completed Prints
            </span>
            <div style={{ marginTop: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981" }}>
                {completedCount}
              </span>
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>
              Total Orders
            </span>
            <div style={{ marginTop: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--foreground)" }}>
                {orders.length}
              </span>
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>
              Completed Total
            </span>
            <div style={{ marginTop: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--foreground)" }}>
                ₹{totalSpent.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
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
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Tasks", count: orders.length },
              { id: "ACTIVE", label: "In Progress", count: activeCount },
              { id: "COMPLETED", label: "Completed", count: completedCount },
              {
                id: "CANCELLED",
                label: "Cancelled / Failed",
                count: orders.filter((o) => cancelledStatuses.includes(o.status)).length,
              },
            ].map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                  id={`tab-${tab.id.toLowerCase()}`}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: isSelected ? "1px solid var(--primary)" : "1px solid transparent",
                    background: isSelected ? "var(--color-brand-50)" : "transparent",
                    color: isSelected ? "var(--primary)" : "var(--muted-foreground)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      padding: "0.1rem 0.4rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      background: isSelected ? "var(--primary)" : "var(--color-neutral-200)",
                      color: isSelected ? "white" : "var(--color-neutral-700)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <SearchIcon
              size={16}
              color="var(--muted-foreground)"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              id="search-orders-input"
              placeholder="Search by Order #, document, or shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: "100%", paddingLeft: "2.2rem", fontSize: "0.8125rem" }}
            />
          </div>
        </div>

        {/* Task List / Orders Table */}
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
            <p>Loading your print tasks...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="card-base"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--color-brand-50)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PrinterIcon size={28} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--foreground)" }}>
                No print tasks found
              </h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", maxWidth: "380px", margin: "0.25rem auto 0" }}>
                {searchQuery
                  ? "No print orders matched your search criteria."
                  : "You have no print tasks in this status yet."}
              </p>
            </div>
            <Link
              href="/upload"
              style={{
                marginTop: "0.5rem",
                padding: "0.625rem 1.25rem",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <UploadIcon size={16} />
              Start New Print Task
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              const isCopied = copiedId === order.id;

              return (
                <div
                  key={order.id}
                  id={`order-task-card-${order.id}`}
                  className="card-base card-hover"
                  style={{
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Order ID & File info */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: "var(--color-brand-50)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileTextIcon size={22} />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "1.0625rem",
                              color: "var(--foreground)",
                            }}
                          >
                            {order.publicOrderNumber}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopy(order.id, order.publicOrderNumber)}
                            title="Copy Order ID"
                            style={{
                              background: "none",
                              border: "none",
                              color: isCopied ? "#10b981" : "var(--muted-foreground)",
                              cursor: "pointer",
                              padding: "2px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                          </button>

                          {/* Status badge */}
                          <span
                            style={{
                              padding: "0.2rem 0.65rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <BadgeIcon size={13} className={badge.animate ? "animate-spin" : ""} />
                            {badge.label}
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            marginTop: "0.2rem",
                          }}
                        >
                          {order.document?.originalFilename || "Document.pdf"}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            marginTop: "0.25rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <StoreIcon size={14} />
                            {order.shop?.name || "Print Shop"}
                          </span>
                          <span>•</span>
                          <span>{order.document?.pageCount || 1} pages</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Track CTA */}
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)" }}>
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </span>

                      <Link
                        href={`/orders/${order.id}`}
                        id={`track-order-btn-${order.id}`}
                        style={{
                          padding: "0.45rem 0.95rem",
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "var(--radius)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                        }}
                      >
                        Track Task Progress
                        <ArrowUpRightIcon size={14} />
                      </Link>
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
