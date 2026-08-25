"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  PrinterIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  FileTextIcon,
  StoreIcon,
  PhoneIcon,
  CopyIcon,
  CheckIcon,
  BanIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

interface OrderEvent {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
}

interface PrintJob {
  id: string;
  status: string;
  requestedOptions?: {
    colorMode?: string;
    duplexMode?: string;
    paperSize?: string;
    copies?: number;
  };
  attemptCount: number;
  errorMessage?: string | null;
  printer?: {
    id: string;
    name: string;
    model: string | null;
  };
  events?: OrderEvent[];
}

interface OrderDetail {
  id: string;
  publicOrderNumber: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  priceBreakdown?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
  };
  document: {
    id: string;
    originalFilename: string;
    pageCount: number | null;
    sizeBytes: string | number;
  };
  printJobs: PrintJob[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
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

  // Fetch initial order details
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
      } else {
        setError(json.error?.message || "Order not found");
      }
    } catch {
      setError("Failed to load order tracking data");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Connect to SSE stream for live updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/v1/orders/${orderId}/events`);

      eventSource.addEventListener("order.status_changed", (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.status) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
          fetchOrder(); // re-fetch full event logs
        }
      });

      eventSource.addEventListener("print_job.status_changed", () => {
        fetchOrder();
      });

      eventSource.onerror = () => {
        // If SSE fails, fallback to polling
        if (eventSource) {
          eventSource.close();
        }
        if (!pollInterval) {
          pollInterval = setInterval(fetchOrder, 3000);
        }
      };
    } catch {
      pollInterval = setInterval(fetchOrder, 3000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId, fetchOrder]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (json.success) {
        setCancelModalOpen(false);
        fetchOrder();
      } else {
        alert(json.error?.message || "Could not cancel order");
      }
    } catch {
      alert("Error cancelling order");
    } finally {
      setIsCancelling(false);
    }
  };

  // State machine progression definition
  const STEPS = [
    { key: "CREATED", label: "Order Placed", desc: "Order generated" },
    { key: "UPLOADED", label: "Uploaded", desc: "Document secured" },
    { key: "WAITING_FOR_SHOP", label: "Sent to Shop", desc: "Awaiting acceptance" },
    { key: "ACCEPTED", label: "Accepted", desc: "Shop confirmed" },
    { key: "QUEUED", label: "In Queue", desc: "Dispatched to worker" },
    { key: "PRINTING", label: "Printing", desc: "Physical printer active" },
    { key: "COMPLETED", label: "Completed", desc: "Ready for pickup" },
  ];

  const getStepIndex = (status: string) => {
    const idx = STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : -1;
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;
  const isTerminalFailure =
    order?.status === "REJECTED" ||
    order?.status === "FAILED" ||
    order?.status === "CANCELLED";

  const isCancellable =
    order &&
    ["CREATED", "UPLOADED", "WAITING_FOR_SHOP", "ACCEPTED", "QUEUED"].includes(
      order.status
    );

  const formatBytes = (bytesStr: string | number) => {
    const bytes = Number(bytesStr);
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar user={user} />

      <main className="container-app" style={{ padding: "2.5rem 1.5rem", flex: 1 }}>
        {/* Back Link */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textDecoration: "none",
            }}
          >
            <ArrowLeftIcon size={16} />
            Back to All Tasks
          </Link>
        </div>

        {isLoading ? (
          <div
            className="card-base"
            style={{
              padding: "5rem 2rem",
              textAlign: "center",
              color: "var(--muted-foreground)",
            }}
          >
            <RefreshCwIcon size={32} className="animate-spin" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Loading print task details...</h3>
          </div>
        ) : error || !order ? (
          <div
            className="card-base"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <AlertCircleIcon size={36} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Task Not Found</h3>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
              {error || "The requested print task could not be retrieved."}
            </p>
            <Link
              href="/orders"
              style={{
                marginTop: "1.5rem",
                display: "inline-block",
                padding: "0.625rem 1.25rem",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Go to Tasks List
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Top Order Status Banner */}
            <div
              className="card-base"
              style={{
                padding: "2rem",
                background: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <h1
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        color: "var(--foreground)",
                      }}
                    >
                      {order.publicOrderNumber}
                    </h1>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.publicOrderNumber)}
                      title="Copy Order Number"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: isCopied ? "#10b981" : "var(--muted-foreground)",
                        padding: "2px",
                      }}
                    >
                      {isCopied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                    </button>
                  </div>
                  <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Cancel action if allowed */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {isCancellable && (
                    <button
                      type="button"
                      id="cancel-order-modal-trigger"
                      onClick={() => setCancelModalOpen(true)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "white",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <BanIcon size={14} />
                      Cancel Task
                    </button>
                  )}

                  <div
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "9999px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background:
                        order.status === "COMPLETED"
                          ? "#d1fae5"
                          : order.status === "PRINTING"
                          ? "#dbeafe"
                          : isTerminalFailure
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        order.status === "COMPLETED"
                          ? "#065f46"
                          : order.status === "PRINTING"
                          ? "#1e40af"
                          : isTerminalFailure
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {order.status === "PRINTING" && <RefreshCwIcon size={15} className="animate-spin" />}
                    {order.status === "COMPLETED" && <CheckCircle2Icon size={15} />}
                    {isTerminalFailure && <XCircleIcon size={15} />}
                    <span>{order.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>

              {/* 7-Step Progress Stepper Timeline */}
              {!isTerminalFailure ? (
                <div style={{ position: "relative", margin: "2rem 0 1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {STEPS.map((step, idx) => {
                      const isPast = currentStepIdx > idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div
                          key={step.key}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isCurrent
                                ? "var(--primary)"
                                : isPast
                                ? "#10b981"
                                : "white",
                              color: isCurrent || isPast ? "white" : "var(--muted-foreground)",
                              border: isCurrent
                                ? "2px solid var(--primary)"
                                : isPast
                                ? "2px solid #10b981"
                                : "2px solid var(--border)",
                              boxShadow: isCurrent ? "0 0 0 4px rgba(37, 99, 235, 0.2)" : "none",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {isPast ? (
                              <CheckCircle2Icon size={18} />
                            ) : isCurrent ? (
                              <PrinterIcon size={18} className="animate-pulse" />
                            ) : (
                              <ClockIcon size={16} />
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: isCurrent ? 700 : 600,
                              color: isCurrent
                                ? "var(--primary)"
                                : isPast
                                ? "var(--foreground)"
                                : "var(--muted-foreground)",
                              marginTop: "0.5rem",
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stepper Progress bar line */}
                  <div
                    style={{
                      position: "absolute",
                      top: "19px",
                      left: "7%",
                      right: "7%",
                      height: "3px",
                      background: "var(--border)",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "var(--primary)",
                        width: `${(Math.max(0, currentStepIdx) / (STEPS.length - 1)) * 100}%`,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Terminal Failure Banner */
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius)",
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <XCircleIcon size={32} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>
                      Order Status: {order.status}
                    </h4>
                    <p style={{ fontSize: "0.8125rem", marginTop: "0.2rem" }}>
                      {order.status === "CANCELLED"
                        ? "This print task was cancelled by the customer."
                        : order.status === "REJECTED"
                        ? "The shop was unable to accept this print task."
                        : "The physical printer encountered an error executing this job."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Two-Column Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {/* Document & Print Specification Card */}
              <div className="card-base" style={{ padding: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FileTextIcon size={18} color="var(--primary)" />
                  Document & Print Specifications
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Document Name:</span>
                    <span style={{ fontWeight: 600 }}>{order.document?.originalFilename}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>File Size:</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(order.document?.sizeBytes)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Page Count:</span>
                    <span style={{ fontWeight: 600 }}>{order.document?.pageCount || 1} pages</span>
                  </div>

                  {order.printJobs[0]?.requestedOptions && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Color Mode:</span>
                        <span style={{ fontWeight: 600 }}>
                          {order.printJobs[0].requestedOptions.colorMode}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Duplex Mode:</span>
                        <span style={{ fontWeight: 600 }}>
                          {order.printJobs[0].requestedOptions.duplexMode}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Paper Size:</span>
                        <span style={{ fontWeight: 600 }}>
                          {order.printJobs[0].requestedOptions.paperSize}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Copies:</span>
                        <span style={{ fontWeight: 600 }}>
                          {order.printJobs[0].requestedOptions.copies}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Shop & Printer Location Card */}
              <div className="card-base" style={{ padding: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <StoreIcon size={18} color="var(--primary)" />
                  Print Shop & Printer
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Shop Name:</span>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                      {order.shop?.name}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Address:</span>
                    <span style={{ fontWeight: 600, maxWidth: "200px", textAlign: "right" }}>
                      {order.shop?.address}
                    </span>
                  </div>

                  {order.shop?.phone && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Shop Contact:</span>
                      <a
                        href={`tel:${order.shop.phone}`}
                        style={{
                          fontWeight: 600,
                          color: "var(--primary)",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <PhoneIcon size={13} />
                        {order.shop.phone}
                      </a>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Printer Device:</span>
                    <span style={{ fontWeight: 600 }}>
                      {order.printJobs[0]?.printer?.name || "Standard Printer"} (
                      {order.printJobs[0]?.printer?.model || "Canon"})
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 700 }}>Total Paid:</span>
                    <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--primary)" }}>
                      ₹{Number(order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Event Audit Timeline */}
            <div className="card-base" style={{ padding: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ClockIcon size={18} color="var(--primary)" />
                Task Event Log & Audit Trail
              </h3>

              {order.printJobs[0]?.events && order.printJobs[0].events.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {order.printJobs[0].events.map((event, idx) => (
                    <div
                      key={event.id || idx}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "var(--color-neutral-50)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--primary)",
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{event.message}</span>
                      </div>
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                  Job queued. Real-time events will stream here as the worker and printer process your file.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModalOpen && (
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
                maxWidth: "420px",
                padding: "1.75rem",
                background: "white",
                borderRadius: "var(--radius)",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Cancel Print Task?
              </h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Are you sure you want to cancel order <strong>{order?.publicOrderNumber}</strong>?
                This action cannot be undone.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={isCancelling}
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
                  Keep Order
                </button>
                <button
                  type="button"
                  id="confirm-cancel-order-btn"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: isCancelling ? "not-allowed" : "pointer",
                  }}
                >
                  {isCancelling ? "Cancelling..." : "Yes, Cancel Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
