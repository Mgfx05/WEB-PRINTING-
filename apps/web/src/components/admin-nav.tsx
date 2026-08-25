"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlertIcon,
  LayoutDashboardIcon,
  UsersIcon,
  StoreIcon,
  LogOutIcon,
  ArrowLeftIcon,
} from "lucide-react";

interface AdminNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin/dashboard",
      label: "Platform Overview",
      icon: LayoutDashboardIcon,
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: UsersIcon,
    },
    {
      href: "/admin/shops",
      label: "Shops & Approvals",
      icon: StoreIcon,
    },
  ];

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "#0f172a",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container-app"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Brand & Admin Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              href="/dashboard"
              title="Return to Customer Dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                textDecoration: "none",
              }}
            >
              <ArrowLeftIcon size={16} />
            </Link>

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <ShieldAlertIcon size={20} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.0625rem",
                    color: "white",
                    lineHeight: 1.1,
                  }}
                >
                  ERB Administration
                </span>
                <span
                  style={{
                    padding: "0.1rem 0.45rem",
                    background: "#7c3aed",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    borderRadius: "9999px",
                  }}
                >
                  Super Admin
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Platform Control Center
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav
            style={{
              display: "none",
              alignItems: "center",
              gap: "0.4rem",
            }}
            className="md:flex"
          >
            {links.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/admin/dashboard" && pathname === "/admin");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`admin-nav-${item.href.split("/").pop()}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.8rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: isActive ? "white" : "#94a3b8",
                    background: isActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right user & Sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "#e2e8f0", fontWeight: 600 }}>
                {user.name || user.email}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  title="Sign out"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#cbd5e1",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LogOutIcon size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
