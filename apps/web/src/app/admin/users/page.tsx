"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UsersIcon,
  SearchIcon,
  RefreshCwIcon,
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "SHOP_OWNER" | "ADMIN";
  createdAt: string;
  totalOrdersCount: number;
  totalShopsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [sessionUser, setSessionUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((s) => {
        if (s?.user) setSessionUser(s.user);
      })
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/v1/admin/users", window.location.origin);
      if (selectedRole !== "ALL") url.searchParams.set("role", selectedRole);
      if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
      url.searchParams.set("limit", "50");

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserItem["role"] } : u))
        );
      } else {
        alert(json.error?.message || "Failed to update user role");
      }
    } catch {
      alert("Network error updating user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AdminNav user={sessionUser} />

      <main className="container-app" style={{ padding: "2rem 1.5rem", flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            User Management & Access Control
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            Search registered accounts, view activity metrics, and manage user roles.
          </p>
        </div>

        {/* Filters & Search Bar */}
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
            {["ALL", "CUSTOMER", "SHOP_OWNER", "ADMIN"].map((r) => {
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: isSelected ? "1px solid #7c3aed" : "1px solid transparent",
                    background: isSelected ? "#faf5ff" : "transparent",
                    color: isSelected ? "#7c3aed" : "var(--muted-foreground)",
                    cursor: "pointer",
                  }}
                >
                  {r.replace("_", " ")}
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
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: "100%", paddingLeft: "2.2rem", fontSize: "0.8125rem" }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card-base" style={{ padding: "1.5rem" }}>
          {isLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>
              <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
              <UsersIcon size={36} style={{ margin: "0 auto 0.5rem" }} />
              <p>No users found matching query.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>User</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Contact</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Role</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Activity</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)" }}>Joined</th>
                    <th style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)", textAlign: "right" }}>
                      Manage Role
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              color: "var(--foreground)",
                            }}
                          >
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>{u.name || "Unnamed"}</span>
                            <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>ID: {u.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span>{u.email}</span>
                        {u.phone && <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{u.phone}</p>}
                      </td>

                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span
                          style={{
                            padding: "0.15rem 0.55rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
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
                      </td>

                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                        {u.totalOrdersCount} orders {u.totalShopsCount > 0 && `• ${u.totalShopsCount} shop(s)`}
                      </td>

                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <select
                          value={u.role}
                          disabled={updatingUserId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="input-base"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 }}
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="SHOP_OWNER">SHOP_OWNER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
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
