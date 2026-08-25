"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PrinterIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  SlidersIcon,
  SettingsIcon,
  StoreIcon,
  LogOutIcon,
  ArrowLeftIcon,
} from "lucide-react";

interface ShopNavProps {
  shopName?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function ShopNav({ shopName = "Print Shop", user }: ShopNavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/shop/dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      href: "/shop/orders",
      label: "Order Queue",
      icon: ListOrderedIcon,
    },
    {
      href: "/shop/printers",
      label: "Printers",
      icon: PrinterIcon,
    },
    {
      href: "/shop/pricing",
      label: "Pricing Rules",
      icon: SlidersIcon,
    },
    {
      href: "/shop/settings",
      label: "Shop Settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "white",
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
        {/* Brand & Shop Title */}
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
                background: "var(--color-neutral-100)",
                color: "var(--muted-foreground)",
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
                background: "#047857",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <StoreIcon size={20} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.0625rem",
                    color: "var(--foreground)",
                    lineHeight: 1.1,
                  }}
                >
                  {shopName}
                </span>
                <span
                  style={{
                    padding: "0.1rem 0.45rem",
                    background: "#d1fae5",
                    color: "#065f46",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    borderRadius: "9999px",
                  }}
                >
                  Shop Portal
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                Shop Owner Operations
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
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`shop-nav-${item.href.split("/").pop()}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.8rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: isActive ? "#047857" : "var(--muted-foreground)",
                    background: isActive ? "#ecfdf5" : "transparent",
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

        {/* Right side user menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.3rem 0.65rem",
                  background: "var(--color-neutral-100)",
                  borderRadius: "9999px",
                  border: "1px solid var(--border)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <span>{user.name || "Owner"}</span>
                <span style={{ fontSize: "0.65rem", color: "#047857", fontWeight: 700 }}>
                  {user.role}
                </span>
              </div>

              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  id="shop-nav-logout"
                  title="Sign out"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "white",
                    color: "var(--muted-foreground)",
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
