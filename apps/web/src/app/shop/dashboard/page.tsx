import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@erb/database/client";
import {
  PrinterIcon,
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { OrderStatus, PrintJobStatus } from "@erb/types";

export const metadata: Metadata = {
  title: "Shop Dashboard",
};

export default async function ShopDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "SHOP_OWNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get the shop owned by this user
  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
    include: {
      printers: {
        include: { capabilities: true },
        where: { isEnabled: true },
      },
    },
  });

  if (!shop) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <PrinterIcon size={48} color="var(--muted-foreground)" />
        <h2 style={{ fontWeight: 700, fontSize: "1.5rem" }}>No shop yet</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Set up your print shop to start receiving orders.
        </p>
        <Link
          href="/shop/setup"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--primary)",
            color: "white",
            borderRadius: "var(--radius)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Set up shop
        </Link>
      </div>
    );
  }

  // Fetch order statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    pendingOrders,
    printingOrders,
    completedToday,
    failedJobs,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { shopId: shop.id, status: OrderStatus.WAITING_FOR_SHOP },
    }),
    prisma.order.count({
      where: { shopId: shop.id, status: OrderStatus.PRINTING },
    }),
    prisma.order.count({
      where: {
        shopId: shop.id,
        status: OrderStatus.COMPLETED,
        updatedAt: { gte: today },
      },
    }),
    prisma.printJob.count({
      where: {
        printer: { shopId: shop.id },
        status: PrintJobStatus.FAILED,
      },
    }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      include: {
        document: { select: { originalFilename: true, pageCount: true } },
        printJobs: {
          select: { id: true, status: true, printer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    {
      label: "Pending Acceptance",
      value: pendingOrders,
      icon: ClockIcon,
      color: "var(--color-warning)",
      bg: "var(--color-warning-light)",
    },
    {
      label: "Currently Printing",
      value: printingOrders,
      icon: PrinterIcon,
      color: "var(--color-brand-600)",
      bg: "var(--color-brand-50)",
    },
    {
      label: "Completed Today",
      value: completedToday,
      icon: CheckCircleIcon,
      color: "var(--color-success)",
      bg: "var(--color-success-light)",
    },
    {
      label: "Failed Jobs",
      value: failedJobs,
      icon: AlertCircleIcon,
      color: "var(--color-error)",
      bg: "var(--color-error-light)",
    },
  ];

  const statusColors: Record<string, string> = {
    WAITING_FOR_SHOP: "badge-warning",
    ACCEPTED: "badge-info",
    QUEUED: "badge-info",
    PRINTING: "badge-info",
    COMPLETED: "badge-success",
    FAILED: "badge-error",
    REJECTED: "badge-neutral",
    CANCELLED: "badge-neutral",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 0",
        }}
      >
        <div
          className="container-app"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PrinterIcon size={20} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>ERB</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link
              href="/shop/printers"
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                textDecoration: "none",
              }}
            >
              Printers
            </Link>
            <Link
              href="/shop/pricing"
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                textDecoration: "none",
              }}
            >
              Pricing
            </Link>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              {shop.name}
            </div>
          </div>
        </div>
      </header>

      <main className="container-app" style={{ padding: "2rem 1.5rem" }}>
        {/* Page title */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
              marginBottom: "0.25rem",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {shop.name} — {shop.city}, {shop.state}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card-base"
              style={{ padding: "1.25rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--muted-foreground)",
                      fontWeight: 500,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "var(--foreground)",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={20} color={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "1.5rem",
          }}
        >
          {/* Recent Orders */}
          <div className="card-base" style={{ padding: "1.5rem" }}>
            <h2
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <PackageIcon size={18} />
              Recent Orders
            </h2>

            {recentOrders.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 0",
                  color: "var(--muted-foreground)",
                }}
              >
                <PackageIcon
                  size={32}
                  style={{ marginBottom: "0.75rem", opacity: 0.4 }}
                />
                <p>No orders yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {recentOrders.map((order) => {
                  const job = order.printJobs[0];
                  return (
                    <div
                      key={order.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        background: "var(--color-neutral-50)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            marginBottom: "0.2rem",
                          }}
                        >
                          {order.publicOrderNumber}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {order.document.originalFilename} ·{" "}
                          {order.document.pageCount ?? "?"} pages
                        </div>
                        {job?.printer?.name && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground)",
                              marginTop: "0.125rem",
                            }}
                          >
                            {job.printer.name}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span
                          className={`badge ${statusColors[order.status] ?? "badge-neutral"}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {order.status === "WAITING_FOR_SHOP" && (
                          <Link
                            href={`/shop/orders/${order.id}`}
                            style={{
                              padding: "0.35rem 0.75rem",
                              background: "var(--primary)",
                              color: "white",
                              borderRadius: "6px",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Printer Status */}
          <div className="card-base" style={{ padding: "1.5rem" }}>
            <h2
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <PrinterIcon size={18} />
              Printers
            </h2>

            {shop.printers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--muted-foreground)" }}>
                <p style={{ marginBottom: "0.75rem" }}>No printers configured</p>
                <Link
                  href="/shop/printers/add"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Add a printer →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {shop.printers.map((printer) => (
                  <div
                    key={printer.id}
                    style={{
                      padding: "0.875rem",
                      background: "var(--color-neutral-50)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.375rem",
                      }}
                    >
                      <div
                        className={`status-dot ${
                          printer.status === "ONLINE"
                            ? "status-dot-online"
                            : printer.status === "ERROR"
                            ? "status-dot-error"
                            : "status-dot-offline"
                        }`}
                      />
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {printer.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {printer.model ?? "Unknown model"}
                    </div>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                      {printer.capabilities?.supportsColor && (
                        <span className="badge badge-info">Color</span>
                      )}
                      {printer.capabilities?.supportsDuplex && (
                        <span className="badge badge-info">Duplex</span>
                      )}
                      {printer.capabilities?.supportsA3 && (
                        <span className="badge badge-neutral">A3</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/shop/printers"
              style={{
                display: "block",
                marginTop: "1rem",
                fontSize: "0.875rem",
                color: "var(--primary)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Manage printers →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
