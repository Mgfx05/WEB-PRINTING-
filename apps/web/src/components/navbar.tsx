"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PrinterIcon,
  UploadIcon,
  ListOrderedIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  LogOutIcon,
  StoreIcon,
  ShieldAlertIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/auth/login", redirect: true });
  };

  const navLinks = [
    {
      href: "/upload",
      label: "Upload & Print",
      icon: UploadIcon,
      highlight: true,
    },
    {
      href: "/orders",
      label: "My Print Tasks",
      icon: ListOrderedIcon,
      requireAuth: true,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      requireAuth: true,
    },
    {
      href: "/shops",
      label: "Browse Shops",
      icon: MapPinIcon,
    },
  ];

  const isShopOwnerOrAdmin =
    user?.role === "SHOP_OWNER" || user?.role === "ADMIN";

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
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
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
              }}
            >
              <PrinterIcon size={20} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.1875rem",
                  color: "var(--foreground)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                ERB
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--primary)",
                }}
              >
                Cloud Printing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div
            style={{
              display: "none",
              alignItems: "center",
              gap: "0.5rem",
            }}
            className="md:flex"
          >
            {navLinks.map((link) => {
              if (link.requireAuth && !user) return null;
              const isActive = pathname === link.href;
              const Icon = link.icon;

              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={`nav-${link.href.replace("/", "")}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.9rem",
                      borderRadius: "var(--radius)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      background: "var(--primary)",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                    {link.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-${link.href.replace("/", "")}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    color: isActive
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                    background: isActive ? "var(--color-brand-50)" : "transparent",
                    transition: "color 0.15s ease",
                  }}
                >
                  <Icon size={15} />
                  {link.label}
                </Link>
              );
            })}

            {isShopOwnerOrAdmin && (
              <Link
                href="/shop/dashboard"
                id="nav-shop-portal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "#047857",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                <StoreIcon size={15} />
                Shop Dashboard
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                id="nav-admin-portal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "#7c3aed",
                  background: "#faf5ff",
                  border: "1px solid #ddd6fe",
                }}
              >
                <ShieldAlertIcon size={15} />
                Admin Portal
              </Link>
            )}
          </div>
        </div>

        {/* User Account / Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.3rem 0.65rem",
                  background: "var(--color-neutral-100)",
                  borderRadius: "9999px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {user.name ? user.name[0]?.toUpperCase() : "U"}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      lineHeight: 1.1,
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.name || "User"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="nav-logout"
                title="Sign out"
                disabled={isSigningOut}
                onClick={handleSignOut}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "white",
                  color: isSigningOut ? "var(--border)" : "var(--muted-foreground)",
                  cursor: isSigningOut ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link
                href="/auth/login"
                id="nav-login"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  textDecoration: "none",
                  fontWeight: 600,
                  padding: "0.45rem 0.85rem",
                  borderRadius: "var(--radius)",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                id="nav-register"
                style={{
                  padding: "0.45rem 0.95rem",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                }}
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "white",
              color: "var(--foreground)",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            borderTop: "1px solid var(--border)",
            background: "white",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {navLinks.map((link) => {
            if (link.requireAuth && !user) return null;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem",
                  borderRadius: "var(--radius)",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: pathname === link.href ? "var(--primary)" : "var(--foreground)",
                  background:
                    pathname === link.href ? "var(--color-brand-50)" : "transparent",
                }}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
          {isShopOwnerOrAdmin && (
            <Link
              href="/shop/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#047857",
                background: "#ecfdf5",
              }}
            >
              <StoreIcon size={18} />
              Shop Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
