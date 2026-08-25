import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@erb/database/client";
import {
  PrinterIcon,
  UploadIcon,
  ClockIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  FileTextIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "Manage your cloud print tasks and active orders",
};

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  // Fetch orders for this customer
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      shop: { select: { id: true, name: true, address: true } },
      document: {
        select: { id: true, originalFilename: true, pageCount: true },
      },
      printJobs: {
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const activeStatuses = [
    "CREATED",
    "UPLOADED",
    "WAITING_FOR_SHOP",
    "ACCEPTED",
    "QUEUED",
    "PRINTING",
  ];

  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const totalSpent = completedOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar user={session.user} />

      <main className="container-app" style={{ padding: "2.5rem 1.5rem", flex: 1 }}>
        {/* Welcome Banner */}
        <div
          className="card-base"
          style={{
            padding: "2rem",
            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
            color: "white",
            marginBottom: "2rem",
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.65rem",
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              <SparklesIcon size={13} />
              ERB On-Demand Printing
            </div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "0.4rem",
              }}
            >
              Welcome back, {session.user.name || "Customer"}!
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.9375rem", maxWidth: "480px" }}>
              Upload your documents, configure your exact print options, and send directly to local shops with live tracking.
            </p>
          </div>

          <div>
            <Link
              href="/upload"
              id="dashboard-start-upload-btn"
              style={{
                padding: "0.75rem 1.5rem",
                background: "white",
                color: "var(--primary)",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "transform 0.15s ease",
              }}
            >
              <UploadIcon size={18} />
              Start New Print Task
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted-foreground)" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase" }}>
                Active Tasks
              </span>
              <ClockIcon size={18} color="var(--primary)" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>
                {activeOrders.length}
              </span>
              {activeOrders.length > 0 && (
                <span
                  style={{
                    padding: "0.2rem 0.5rem",
                    borderRadius: "9999px",
                    background: "#dbeafe",
                    color: "#1e40af",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  In Progress
                </span>
              )}
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted-foreground)" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase" }}>
                Completed Prints
              </span>
              <CheckCircle2Icon size={18} color="#10b981" />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981" }}>
                {completedOrders.length}
              </span>
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted-foreground)" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Orders
              </span>
              <PrinterIcon size={18} color="var(--muted-foreground)" />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>
                {orders.length}
              </span>
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted-foreground)" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Spent
              </span>
              <TrendingUpIcon size={18} color="var(--primary)" />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>
                ₹{totalSpent.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Print Tasks Highlight Section */}
        {activeOrders.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
                Active Printing Tasks ({activeOrders.length})
              </h2>
              <Link
                href="/orders"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View all tasks →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="card-base"
                  style={{
                    padding: "1.25rem",
                    borderLeft: "4px solid var(--primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        background: "var(--color-brand-50)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileTextIcon size={20} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                          {order.publicOrderNumber}
                        </span>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: order.status === "PRINTING" ? "#dbeafe" : "#fef3c7",
                            color: order.status === "PRINTING" ? "#1e40af" : "#92400e",
                          }}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.2rem" }}>
                        {order.document?.originalFilename} • Shop: {order.shop?.name}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: "var(--radius)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    Track Progress
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders List */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Recent Print Orders</h2>
            <Link
              href="/orders"
              style={{
                fontSize: "0.875rem",
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              See all orders →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div
              className="card-base"
              style={{
                padding: "3.5rem 2rem",
                textAlign: "center",
              }}
            >
              <PrinterIcon size={36} color="var(--muted-foreground)" style={{ margin: "0 auto 0.75rem" }} />
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>No print jobs yet</h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Upload your first document to start printing with ERB.
              </p>
              <Link
                href="/upload"
                style={{
                  marginTop: "1rem",
                  display: "inline-block",
                  padding: "0.625rem 1.25rem",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "var(--radius)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Upload Document Now
              </Link>
            </div>
          ) : (
            <div className="card-base" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--color-neutral-50)" }}>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Order #</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Document</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Shop</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Date</th>
                      <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s ease" }}
                      >
                        <td style={{ padding: "0.875rem 1.25rem", fontWeight: 700 }}>
                          {order.publicOrderNumber}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.document?.originalFilename}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          {order.shop?.name}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <span
                            style={{
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background:
                                order.status === "COMPLETED"
                                  ? "#d1fae5"
                                  : activeStatuses.includes(order.status)
                                  ? "#dbeafe"
                                  : "#f1f5f9",
                              color:
                                order.status === "COMPLETED"
                                  ? "#065f46"
                                  : activeStatuses.includes(order.status)
                                  ? "#1e40af"
                                  : "#475569",
                            }}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", fontWeight: 700 }}>
                          ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", color: "var(--muted-foreground)" }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                          <Link
                            href={`/orders/${order.id}`}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "var(--radius)",
                              background: "var(--color-brand-50)",
                              color: "var(--primary)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
