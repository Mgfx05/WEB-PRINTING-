"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PrinterIcon,
  PlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Settings2Icon,
  RefreshCwIcon,
  Trash2Icon,
  PowerIcon,
  LayersIcon,
  ShieldCheckIcon,
  SlidersIcon,
} from "lucide-react";
import { ShopNav } from "@/components/shop-nav";

interface PrinterCapability {
  id: string;
  supportsColor: boolean;
  supportsDuplex: boolean;
  supportsA3: boolean;
  supportsA4: boolean;
  maxCopies: number;
  maxResolutionDpi: number;
  detectionMethod: string;
}

interface PrinterItem {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  agentId: string | null;
  status: "ONLINE" | "OFFLINE" | "ERROR" | "PRINTING";
  isEnabled: boolean;
  activeJobsCount: number;
  capabilities: PrinterCapability | null;
}

export default function ShopPrintersPage() {
  const [printers, setPrinters] = useState<PrinterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [model, setModel] = useState("Canon PIXMA G7070");
  const [manufacturer, setManufacturer] = useState("Canon");
  const [serialNumber, setSerialNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [supportsColor, setSupportsColor] = useState(true);
  const [supportsDuplex, setSupportsDuplex] = useState(true);
  const [supportsA3, setSupportsA3] = useState(false);
  const [maxCopies, setMaxCopies] = useState(99);
  const [maxResolutionDpi, setMaxResolutionDpi] = useState(4800);

  const [user, setUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
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

  const loadPrinters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/shop/printers");
      const json = await res.json();
      if (json.success && json.data) {
        setPrinters(json.data.printers || []);
      }
    } catch (err) {
      console.error("Failed to load printers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const handleOpenCreateModal = () => {
    setEditingPrinter(null);
    setName("Canon G7070 High Speed");
    setModel("PIXMA G7070");
    setManufacturer("Canon");
    setSerialNumber("");
    setAgentId("");
    setSupportsColor(true);
    setSupportsDuplex(true);
    setSupportsA3(false);
    setMaxCopies(99);
    setMaxResolutionDpi(4800);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PrinterItem) => {
    setEditingPrinter(p);
    setName(p.name);
    setModel(p.model || "");
    setManufacturer(p.manufacturer || "Canon");
    setSerialNumber(p.serialNumber || "");
    setAgentId(p.agentId || "");
    setSupportsColor(p.capabilities?.supportsColor ?? true);
    setSupportsDuplex(p.capabilities?.supportsDuplex ?? true);
    setSupportsA3(p.capabilities?.supportsA3 ?? false);
    setMaxCopies(p.capabilities?.maxCopies ?? 99);
    setMaxResolutionDpi(p.capabilities?.maxResolutionDpi ?? 4800);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (printer: PrinterItem) => {
    const newStatus = printer.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    try {
      const res = await fetch(`/api/v1/shop/printers/${printer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        loadPrinters();
      }
    } catch {
      alert("Failed to toggle printer status");
    }
  };

  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      name,
      model,
      manufacturer,
      serialNumber,
      agentId,
      supportsColor,
      supportsDuplex,
      supportsA3,
      maxCopies,
      maxResolutionDpi,
    };

    try {
      const url = editingPrinter
        ? `/api/v1/shop/printers/${editingPrinter.id}`
        : "/api/v1/shop/printers";
      const method = editingPrinter ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        loadPrinters();
      } else {
        alert(json.error?.message || "Failed to save printer");
      }
    } catch {
      alert("Network error saving printer");
    } finally {
      setIsSaving(false);
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
      <ShopNav user={user} />

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
              Printer Hardware Management
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              Configure connected print devices, color/duplex capabilities, and real-time agent status.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleOpenCreateModal}
              id="add-new-printer-btn"
              style={{
                padding: "0.6rem 1.25rem",
                background: "#047857",
                color: "white",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(4, 120, 87, 0.25)",
              }}
            >
              <PlusIcon size={16} />
              Add New Printer
            </button>
          </div>
        </div>

        {/* Printer Cards Grid */}
        {isLoading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading printers...</p>
          </div>
        ) : printers.length === 0 ? (
          <div
            className="card-base"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <PrinterIcon size={40} color="var(--muted-foreground)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>No Printers Registered</h3>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Add your first physical or virtual printer to start receiving customer orders.
            </p>
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#047857",
                color: "white",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add Printer Now
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {printers.map((p) => {
              const isOnline = p.status === "ONLINE";
              const caps = p.capabilities;

              return (
                <div
                  key={p.id}
                  className="card-base"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    {/* Top Row: Icon + Name + Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: isOnline ? "#ecfdf5" : "#f1f5f9",
                            color: isOnline ? "#047857" : "var(--muted-foreground)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PrinterIcon size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{p.name}</h3>
                          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                            {p.manufacturer} {p.model}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        title="Click to toggle Online/Offline status"
                        style={{
                          padding: "0.25rem 0.65rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: isOnline ? "#d1fae5" : "#fee2e2",
                          color: isOnline ? "#065f46" : "#991b1b",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: isOnline ? "#10b981" : "#ef4444",
                          }}
                        />
                        {p.status}
                      </button>
                    </div>

                    {/* Capabilities Tags */}
                    <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: caps?.supportsColor ? "#eff6ff" : "var(--color-neutral-100)",
                          color: caps?.supportsColor ? "#1d4ed8" : "var(--color-neutral-600)",
                        }}
                      >
                        {caps?.supportsColor ? "Color + B&W" : "Monochrome Only"}
                      </span>

                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: caps?.supportsDuplex ? "#f0fdf4" : "var(--color-neutral-100)",
                          color: caps?.supportsDuplex ? "#15803d" : "var(--color-neutral-600)",
                        }}
                      >
                        {caps?.supportsDuplex ? "2-Sided Duplex" : "1-Sided Only"}
                      </span>

                      {caps?.supportsA3 && (
                        <span
                          style={{
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: "#faf5ff",
                            color: "#7e22ce",
                          }}
                        >
                          A3 Supported
                        </span>
                      )}

                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: "var(--color-neutral-100)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {caps?.maxResolutionDpi || 4800} DPI
                      </span>
                    </div>

                    {/* Agent / Hardware details */}
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.75rem",
                        background: "var(--color-neutral-50)",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8125rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Active Queue:</span>
                        <strong style={{ color: p.activeJobsCount > 0 ? "#ea580c" : "var(--foreground)" }}>
                          {p.activeJobsCount} job(s)
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Agent ID:</span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {p.agentId || "local-daemon"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        cursor: "pointer",
                      }}
                    >
                      <SlidersIcon size={14} />
                      Configure Capabilities
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
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
                maxWidth: "520px",
                padding: "2rem",
                background: "white",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {editingPrinter ? "Edit Printer & Capabilities" : "Add New Print Hardware"}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                Configure hardware specifications and print engine capabilities.
              </p>

              <form onSubmit={handleSavePrinter} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    Printer Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Canon High Speed G7070"
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="Canon, HP, Epson..."
                      className="input-base"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="PIXMA G7070"
                      className="input-base"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Capability Checkboxes */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Hardware Capabilities
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={supportsColor}
                        onChange={(e) => setSupportsColor(e.target.checked)}
                      />
                      <span>Supports Full Color Printing</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={supportsDuplex}
                        onChange={(e) => setSupportsDuplex(e.target.checked)}
                      />
                      <span>Supports Automatic 2-Sided Duplex</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={supportsA3}
                        onChange={(e) => setSupportsA3(e.target.checked)}
                      />
                      <span>Supports Large Format A3 Paper</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Max Copies
                    </label>
                    <input
                      type="number"
                      value={maxCopies}
                      onChange={(e) => setMaxCopies(Number(e.target.value))}
                      className="input-base"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Max Resolution (DPI)
                    </label>
                    <input
                      type="number"
                      value={maxResolutionDpi}
                      onChange={(e) => setMaxResolutionDpi(Number(e.target.value))}
                      className="input-base"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "0.55rem 1.1rem",
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
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: "0.55rem 1.35rem",
                      background: "#047857",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--radius)",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSaving ? "Saving..." : editingPrinter ? "Update Printer" : "Add Printer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
