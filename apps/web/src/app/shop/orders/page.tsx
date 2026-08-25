"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  FileTextIcon,
  PrinterIcon,
  CheckIcon,
  XIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  LayersIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { ShopNav } from "@/components/shop-nav";

interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface OrderItem {
  id: string;
  publicOrderNumber: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  createdAt: string;
  user: OrderCustomer;
  document: {
    id: string;
    originalFilename: string;
    pageCount: number | null;
    sizeBytes: string;
  };
  printJobs: Array<{
    id: string;
    status: string;
    requestedOptions?: {
      colorMode?: string;
      duplexMode?: string;
      paperSize?: string;
      copies?: number;
      quality?: string;
    };
    printer?: {
      id: string;
      name: string;
      model: string | null;
    };
  }>;
}

export default function ShopOrderQueuePage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [shopName, setShopName] = useState("Print Shop");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "WAITING_FOR_SHOP" | "ACTIVE" | "COMPLETED" | "ALL"
  >("WAITING_FOR_SHOP");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<OrderItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
        if (session?.user) setUser(session.user);
      })
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/shop/orders?limit=50");
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders);
        if (json.data.shopName) setShopName(json.data.shopName);
      }
    } catch (err) {
      console.error("Failed to load shop orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000); // Polling every 5s for new orders
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Handle Accept Order
  const handleAcceptOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const json = await res.json();
      if (json.success) {
        loadOrders();
      } else {
        alert(json.error?.message || "Failed to accept order");
      }
    } catch {
      alert("Network error accepting order");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Order
  const handleConfirmReject = async () => {
    if (!orderToReject) return;
    setProcessingId(orderToReject.id);
    try {
      const res = await fetch(`/api/v1/orders/${orderToReject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        setRejectModalOpen(false);
        setOrderToReject(null);
        setRejectReason("");
        loadOrders();
      } else {
        alert(json.error?.message || "Failed to reject order");
      }
    } catch {
      alert("Network error rejecting order");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (selectedTab === "WAITING_FOR_SHOP" && order.status !== "WAITING_FOR_SHOP") {
      return false;
    }
    if (
      selectedTab === "ACTIVE" &&
      !["ACCEPTED", "QUEUED", "PRINTING"].includes(order.status)
    ) {
      return false;
    }
    if (selectedTab === "COMPLETED" && order.status !== "COMPLETED") {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.publicOrderNumber.toLowerCase().includes(q);
      const matchCust = order.user?.name?.toLowerCase().includes(q);
      const matchDoc = order.document?.originalFilename?.toLowerCase().includes(q);
      return matchNum || matchCust || matchDoc;
    }

    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "WAITING_FOR_SHOP").length;
  const activeCount = orders.filter((o) =>
    ["ACCEPTED", "QUEUED", "PRINTING"].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ShopNav shopName={shopName} user={user} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
              }}
            >
              Shop Order Queue
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              Review incoming customer print jobs, accept to dispatch to hardware, or reject.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={loadOrders}
              style={{
                padding: "0.5rem 1rem",
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <RefreshCwIcon size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh Queue
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
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
              { id: "WAITING_FOR_SHOP", label: "Pending Approval", count: pendingCount, highlight: pendingCount > 0 },
              { id: "ACTIVE", label: "In Production", count: activeCount },
              { id: "COMPLETED", label: "Completed", count: completedCount },
              { id: "ALL", label: "All Orders", count: orders.length },
            ].map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: isSelected ? "1px solid #047857" : "1px solid transparent",
                    background: isSelected ? "#ecfdf5" : "transparent",
                    color: isSelected ? "#047857" : "var(--muted-foreground)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      padding: "0.1rem 0.45rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: tab.highlight
                        ? "#f97316"
                        : isSelected
                        ? "#047857"
                        : "var(--color-neutral-200)",
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
              placeholder="Search by Order #, Customer, File..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: "100%", paddingLeft: "2.2rem", fontSize: "0.8125rem" }}
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div
            className="card-base"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <CheckCircle2Icon size={36} color="#10b981" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Queue is all clear!</h3>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              No print jobs currently in this status. New jobs will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredOrders.map((order) => {
              const isPending = order.status === "WAITING_FOR_SHOP";
              const isProcessing = processingId === order.id;
              const options = order.printJobs[0]?.requestedOptions;

              return (
                <div
                  key={order.id}
                  className="card-base"
                  style={{
                    padding: "1.5rem",
                    borderLeft: isPending ? "4px solid #f97316" : "4px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Top Bar */}
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
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: isPending ? "#fff7ed" : "var(--color-neutral-100)",
                          color: isPending ? "#ea580c" : "var(--foreground)",
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
                          <span style={{ fontWeight: 800, fontSize: "1.125rem" }}>
                            {order.publicOrderNumber}
                          </span>
                          <span
                            style={{
                              padding: "0.15rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background:
                                order.status === "WAITING_FOR_SHOP"
                                  ? "#ffedd5"
                                  : order.status === "PRINTING"
                                  ? "#dbeafe"
                                  : order.status === "COMPLETED"
                                  ? "#d1fae5"
                                  : "#f1f5f9",
                              color:
                                order.status === "WAITING_FOR_SHOP"
                                  ? "#9a3412"
                                  : order.status === "PRINTING"
                                  ? "#1e40af"
                                  : order.status === "COMPLETED"
                                  ? "#065f46"
                                  : "#475569",
                            }}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginTop: "0.2rem" }}>
                          {order.document?.originalFilename}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            marginTop: "0.3rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>Customer: <strong>{order.user?.name || "Customer"}</strong></span>
                          {order.user?.phone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <PhoneIcon size={12} />
                              {order.user.phone}
                            </span>
                          )}
                          <span>•</span>
                          <span>{order.document?.pageCount || 1} pages</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#047857" }}>
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </span>

                      {isPending ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToReject(order);
                              setRejectModalOpen(true);
                            }}
                            disabled={isProcessing}
                            style={{
                              padding: "0.45rem 0.85rem",
                              background: "white",
                              border: "1px solid #fecaca",
                              color: "#b91c1c",
                              borderRadius: "var(--radius)",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <XIcon size={14} />
                            Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAcceptOrder(order.id)}
                            disabled={isProcessing}
                            style={{
                              padding: "0.45rem 1.1rem",
                              background: "#047857",
                              color: "white",
                              border: "none",
                              borderRadius: "var(--radius)",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              boxShadow: "0 2px 6px rgba(4, 120, 87, 0.25)",
                            }}
                          >
                            {isProcessing ? (
                              <RefreshCwIcon size={14} className="animate-spin" />
                            ) : (
                              <CheckIcon size={14} />
                            )}
                            Accept & Print
                          </button>
                        </div>
                      ) : (
                        <Link
                          href={`/orders/${order.id}`}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "var(--radius)",
                            background: "var(--color-neutral-100)",
                            color: "var(--foreground)",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          View Job Details
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Print Specifications Summary */}
                  {options && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        background: "var(--color-neutral-50)",
                        borderRadius: "var(--radius)",
                        display: "flex",
                        gap: "1.5rem",
                        fontSize: "0.8125rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <span style={{ color: "var(--muted-foreground)" }}>Color: </span>
                        <strong>{options.colorMode}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted-foreground)" }}>Paper: </span>
                        <strong>{options.paperSize}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted-foreground)" }}>Duplex: </span>
                        <strong>{options.duplexMode === "SINGLE_SIDED" ? "1-Sided" : "2-Sided"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted-foreground)" }}>Copies: </span>
                        <strong>{options.copies || 1}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted-foreground)" }}>Printer: </span>
                        <strong>{order.printJobs[0]?.printer?.name || "Canon G7070"}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectModalOpen && orderToReject && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <div
              className="card-base"
              style={{
                width: "100%",
                maxWidth: "440px",
                padding: "1.75rem",
                background: "white",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Reject Order {orderToReject.publicOrderNumber}?
              </h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                Provide a reason for the customer why this print job cannot be fulfilled (e.g. out of paper, maintenance):
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="input-base"
                style={{ width: "100%", marginBottom: "1.5rem" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setOrderToReject(null);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
