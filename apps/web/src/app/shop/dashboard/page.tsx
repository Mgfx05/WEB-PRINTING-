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
  ListOrderedIcon,
  SlidersIcon,
  SettingsIcon,
  ArrowRightIcon,
  StoreIcon,
} from "lucide-react";
import Link from "next/link";
import { OrderStatus, PrintJobStatus } from "@erb/types";
import { ShopNav } from "@/components/shop-nav";

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
    redirect("/shop/setup");
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
    onlinePrintersCount,
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
        user: { select: { name: true } },
        printJobs: {
          select: { id: true, status: true, printer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.printer.count({
      where: { shopId: shop.id, isEnabled: true, status: "ONLINE" },
    }),
  ]);

  const stats = [
    {
      label: "Pending Acceptance",
      value: pendingOrders,
      icon: ClockIcon,
      color: "#ea580c",
      bg: "#fff7ed",
      link: "/shop/orders",
    },
    {
      label: "Currently Printing",
      value: printingOrders,
      icon: PrinterIcon,
      color: "#2563eb",
      bg: "#eff6ff",
      link: "/shop/orders",
    },
    {
      label: "Completed Today",
      value: completedToday,
      icon: CheckCircleIcon,
      color: "#059669",
      bg: "#ecfdf5",
      link: "/shop/orders",
    },
    {
      label: "Online Printers",
      value: `${onlinePrintersCount} / ${shop.printers.length}`,
      icon: PrinterIcon,
      color: "#047857",
      bg: "#ecfdf5",
      link: "/shop/printers",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column" }}>
      <ShopNav shopName={shop.name} user={session.user} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
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
              Shop Overview
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              {shop.name} • {shop.city}, {shop.state}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/shop/orders"
              style={{
                padding: "0.55rem 1.25rem",
                background: "#047857",
                color: "white",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 6px rgba(4, 120, 87, 0.25)",
              }}
            >
              <ListOrderedIcon size={16} />
              Open Order Queue ({pendingOrders})
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.link}
                className="card-base"
                style={{
                  padding: "1.25rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "transform 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: stat.bg,
                    color: stat.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500 }}>
                    {stat.label}
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)" }}>
                    {stat.value}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Management Navigation Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            {
              title: "Order Queue",
              desc: "Accept and dispatch incoming customer print jobs to printers.",
              icon: ListOrderedIcon,
              href: "/shop/orders",
              color: "#047857",
            },
            {
              title: "Printer Hardware",
              desc: "Manage connected printers, color/duplex capabilities & agent status.",
              icon: PrinterIcon,
              href: "/shop/printers",
              color: "#2563eb",
            },
            {
              title: "Pricing Rules",
              desc: "Customize B&W and color page rates, paper surcharges, and discounts.",
              icon: SlidersIcon,
              href: "/shop/pricing",
              color: "#7c3aed",
            },
            {
              title: "Shop Settings",
              desc: "Edit your shop address, contact number, and business profile.",
              icon: SettingsIcon,
              href: "/shop/settings",
              color: "#d97706",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="card-base"
                style={{
                  padding: "1.5rem",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `${card.color}15`,
                      color: card.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    {card.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: card.color,
                  }}
                >
                  Manage <ArrowRightIcon size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Orders Table */}
        <div className="card-base" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recent Print Jobs</h3>
            <Link
              href="/shop/orders"
              style={{ fontSize: "0.8125rem", color: "#047857", fontWeight: 600, textDecoration: "none" }}
            >
              View all orders &rarr;
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>
              No orders received yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Order #</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Customer</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Document</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Amount</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>{ord.publicOrderNumber}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{ord.user?.name || "Customer"}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{ord.document?.originalFilename}</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>₹{Number(ord.totalAmount).toFixed(2)}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              ord.status === "WAITING_FOR_SHOP"
                                ? "#ffedd5"
                                : ord.status === "COMPLETED"
                                ? "#d1fae5"
                                : "#eff6ff",
                            color:
                              ord.status === "WAITING_FOR_SHOP"
                                ? "#9a3412"
                                : ord.status === "COMPLETED"
                                ? "#065f46"
                                : "#1d4ed8",
                          }}
                        >
                          {ord.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <Link
                          href={`/orders/${ord.id}`}
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--primary)",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
