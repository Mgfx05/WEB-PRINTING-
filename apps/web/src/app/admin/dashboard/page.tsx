import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@erb/database/client";
import {
  UsersIcon,
  StoreIcon,
  PrinterIcon,
  ListOrderedIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    totalShops,
    activeShops,
    pendingShops,
    totalPrinters,
    onlinePrinters,
    totalOrders,
    completedOrders,
    activeOrders,
    recentOrders,
    recentUsers,
    revenueResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "ACTIVE" } }),
    prisma.shop.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.printer.count({ where: { isEnabled: true } }),
    prisma.printer.count({ where: { isEnabled: true, status: "ONLINE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({
      where: {
        status: { in: ["CREATED", "UPLOADED", "WAITING_FOR_SHOP", "ACCEPTED", "QUEUED", "PRINTING"] },
      },
    }),
    prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        shop: { select: { name: true, city: true } },
        document: { select: { originalFilename: true, pageCount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: "COMPLETED" },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: UsersIcon,
      color: "#2563eb",
      bg: "#eff6ff",
      link: "/admin/users",
    },
    {
      label: "Print Shops",
      value: `${activeShops} active / ${totalShops}`,
      icon: StoreIcon,
      color: "#059669",
      bg: "#ecfdf5",
      link: "/admin/shops",
    },
    {
      label: "Printers Fleet",
      value: `${onlinePrinters} online / ${totalPrinters}`,
      icon: PrinterIcon,
      color: "#7c3aed",
      bg: "#faf5ff",
      link: "/admin/shops",
    },
    {
      label: "Platform Revenue",
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: TrendingUpIcon,
      color: "#d97706",
      bg: "#fffbeb",
      link: "/admin/dashboard",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AdminNav user={session.user} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Header */}
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
              System Overview & Operations
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              Global platform health, shop network activity, user accounts, and print volume.
            </p>
          </div>

          {pendingShops > 0 && (
            <Link
              href="/admin/shops"
              style={{
                padding: "0.55rem 1.1rem",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                color: "#92400e",
                borderRadius: "var(--radius)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <AlertTriangleIcon size={16} />
              {pendingShops} Shop(s) Pending Approval
            </Link>
          )}
        </div>

        {/* Top Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.link}
                className="card-base"
                style={{
                  padding: "1.25rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: item.bg,
                    color: item.color,
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
                    {item.label}
                  </span>
                  <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--foreground)" }}>
                    {item.value}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Management Links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div className="card-base" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recent Users</h3>
              <Link
                href="/admin/users"
                style={{ fontSize: "0.8125rem", color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}
              >
                View all &rarr;
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.name || "User"}</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{u.email}</p>
                  </div>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background:
                        u.role === "ADMIN"
                          ? "#faf5ff"
                          : u.role === "SHOP_OWNER"
                          ? "#ecfdf5"
                          : "#eff6ff",
                      color:
                        u.role === "ADMIN"
                          ? "#7c3aed"
                          : u.role === "SHOP_OWNER"
                          ? "#047857"
                          : "#2563eb",
                    }}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Active Print Queue</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                {activeOrders} active jobs
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{ord.publicOrderNumber}</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {ord.shop?.name} • {ord.document?.originalFilename}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      ₹{Number(ord.totalAmount).toFixed(2)}
                    </span>
                    <p style={{ fontSize: "0.75rem", color: "#047857" }}>{ord.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
