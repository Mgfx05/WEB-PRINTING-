"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UploadCloudIcon,
  FileTextIcon,
  PrinterIcon,
  SlidersIcon,
  StoreIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  AlertCircleIcon,
  CheckIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  FileCheckIcon,
  MapPinIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { v4 as uuidv4 } from "uuid";

// Types matching @erb/types
type ColorMode = "COLOR" | "BLACK_AND_WHITE" | "AUTO";
type DuplexMode = "SINGLE_SIDED" | "DUPLEX_LONG_EDGE" | "DUPLEX_SHORT_EDGE";
type PaperSize = "A3" | "A4" | "A5" | "LETTER" | "LEGAL" | "TABLOID";
type Orientation = "PORTRAIT" | "LANDSCAPE";
type PagesPerSheet = 1 | 2 | 4 | 6 | 8 | 9 | 16;
type ScalingMode = "FIT_TO_PAGE" | "ACTUAL_SIZE" | "CUSTOM";
type PrintQuality = "DRAFT" | "NORMAL" | "HIGH";

interface DocumentData {
  id: string;
  originalFilename: string;
  sizeBytes: string;
  pageCount: number;
  checksum: string;
  uploadedAt: string;
}

interface ShopPrinter {
  id: string;
  name: string;
  model: string | null;
  status: string;
  capabilities: {
    supportsColor: boolean;
    supportsDuplex: boolean;
    supportsA3: boolean;
    supportsA4: boolean;
  } | null;
}

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  isAvailable: boolean;
  onlinePrinterCount: number;
  totalPrinterCount: number;
  capabilities: {
    supportsColor: boolean;
    supportsDuplex: boolean;
    supportsA3: boolean;
  };
  printers: ShopPrinter[];
}

interface PriceBreakdown {
  basePrice: number;
  colorSurcharge: number;
  paperSizeSurcharge: number;
  qualitySurcharge: number;
  mediaSurcharge: number;
  duplexDiscount: number;
  copiesMultiplier: number;
  subtotal: number;
  total: number;
  currency: string;
}

function UploadWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams.get("shopId");

  // Wizard Step State (1: Upload, 2: Options, 3: Shop & Printer, 4: Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // User state
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Step 1: Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocument, setUploadedDocument] = useState<DocumentData | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Print Options
  const [colorMode, setColorMode] = useState<ColorMode>("BLACK_AND_WHITE");
  const [duplexMode, setDuplexMode] = useState<DuplexMode>("DUPLEX_LONG_EDGE");
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("PORTRAIT");
  const [pagesPerSheet, setPagesPerSheet] = useState<PagesPerSheet>(1);
  const [scaling] = useState<ScalingMode>("FIT_TO_PAGE");
  const [customScalePercent] = useState<number>(100);
  const [quality, setQuality] = useState<PrintQuality>("NORMAL");
  const [copies, setCopies] = useState<number>(1);
  const [pageRangeType, setPageRangeType] = useState<"all" | "custom">("all");
  const [pageRangeStart, setPageRangeStart] = useState<number>(1);
  const [pageRangeEnd, setPageRangeEnd] = useState<number>(1);
  const [collate] = useState<boolean>(true);

  // Step 3: Shop & Printer selection
  const [shops, setShops] = useState<ShopData[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(
    preselectedShopId || null
  );
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(
    null
  );
  const [cityFilter, setCityFilter] = useState<string>("");

  // Step 4: Price calculation & Submission
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null
  );
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

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

  // Fetch shops
  useEffect(() => {
    setIsLoadingShops(true);
    fetch("/api/v1/shops")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.shops) {
          setShops(json.data.shops);

          // If preselected shop ID provided, select it and its first online printer
          if (preselectedShopId) {
            const found = json.data.shops.find(
              (s: ShopData) => s.id === preselectedShopId
            );
            if (found) {
              setSelectedShopId(found.id);
              const onlinePrinter = found.printers.find(
                (p: ShopPrinter) => p.status === "ONLINE"
              );
              if (onlinePrinter) {
                setSelectedPrinterId(onlinePrinter.id);
              } else if (found.printers[0]) {
                setSelectedPrinterId(found.printers[0].id);
              }
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load shops:", err))
      .finally(() => setIsLoadingShops(false));
  }, [preselectedShopId]);

  // When selected shop changes, update selected printer
  const handleSelectShop = (shop: ShopData) => {
    setSelectedShopId(shop.id);
    const online = shop.printers.find((p) => p.status === "ONLINE");
    if (online) {
      setSelectedPrinterId(online.id);
    } else if (shop.printers[0]) {
      setSelectedPrinterId(shop.printers[0].id);
    } else {
      setSelectedPrinterId(null);
    }
  };

  // Update page range end default when document uploaded
  useEffect(() => {
    if (uploadedDocument?.pageCount) {
      setPageRangeEnd(uploadedDocument.pageCount);
    }
  }, [uploadedDocument]);

  // Calculate price whenever relevant print options, shop, or printer changes
  useEffect(() => {
    if (!uploadedDocument || !selectedShopId || !selectedPrinterId) {
      setPriceBreakdown(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculatingPrice(true);
      setPricingError(null);

      const options = {
        colorMode,
        duplexMode,
        paperSize,
        orientation,
        pagesPerSheet,
        scaling,
        ...(scaling === "CUSTOM" ? { customScalePercent } : {}),
        quality,
        copies,
        ...(pageRangeType === "custom"
          ? { pageRangeStart, pageRangeEnd }
          : {}),
        collate,
      };

      try {
        const res = await fetch("/api/v1/pricing/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: selectedShopId,
            printerId: selectedPrinterId,
            documentId: uploadedDocument.id,
            options,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          setPriceBreakdown(json.data);
        } else {
          setPricingError(json.error?.message || "Could not calculate price");
        }
      } catch {
        setPricingError("Network error calculating price");
      } finally {
        setIsCalculatingPrice(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    uploadedDocument,
    selectedShopId,
    selectedPrinterId,
    colorMode,
    duplexMode,
    paperSize,
    orientation,
    pagesPerSheet,
    scaling,
    customScalePercent,
    quality,
    copies,
    pageRangeType,
    pageRangeStart,
    pageRangeEnd,
    collate,
  ]);

  // Handle File Selection & Upload
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (selectedFile: File) => {
    setUploadError(null);

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/x-pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setUploadError("Only PDF documents are supported for printing.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds the 25MB maximum limit.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulated smooth upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 100);

      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await res.json();
      if (json.success && json.data) {
        setUploadedDocument(json.data);
      } else {
        setUploadError(json.error?.message || "Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Network error occurred during document upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!uploadedDocument || !selectedShopId || !selectedPrinterId) return;

    setIsSubmittingOrder(true);
    setOrderError(null);

    const idempotencyKey = uuidv4();
    const options = {
      colorMode,
      duplexMode,
      paperSize,
      orientation,
      pagesPerSheet,
      scaling,
      ...(scaling === "CUSTOM" ? { customScalePercent } : {}),
      quality,
      copies,
      ...(pageRangeType === "custom"
        ? { pageRangeStart, pageRangeEnd }
        : {}),
      collate,
    };

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: selectedShopId,
          printerId: selectedPrinterId,
          documentId: uploadedDocument.id,
          options,
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.id) {
        // Successfully created order! Redirect to live order tracking
        router.push(`/orders/${json.data.id}`);
      } else {
        setOrderError(
          json.error?.message || "Order placement failed. Please review options."
        );
      }
    } catch {
      setOrderError("Network error submitting print order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Formatter helpers
  const formatBytes = (bytesStr: string | number) => {
    const bytes = Number(bytesStr);
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const selectedShop = shops.find((s) => s.id === selectedShopId);
  const selectedPrinter = selectedShop?.printers.find(
    (p) => p.id === selectedPrinterId
  );

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
        {/* Wizard Header Banner */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              background: "var(--color-brand-50)",
              border: "1px solid var(--color-brand-200)",
              borderRadius: "9999px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-brand-700)",
              marginBottom: "0.75rem",
            }}
          >
            <SparklesIcon size={14} />
            Instant Cloud Print Wizard
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
              marginBottom: "0.5rem",
            }}
          >
            Upload & Configure Print Order
          </h1>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "0.9375rem",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Follow our 4-step wizard to upload your document, customize your
            print settings, and send directly to the shop printer.
          </p>
        </div>

        {/* 4-Step Stepper Progress Bar */}
        <div
          style={{
            maxWidth: "780px",
            margin: "0 auto 2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {[
            { step: 1, title: "Upload PDF", icon: UploadCloudIcon },
            { step: 2, title: "Print Options", icon: SlidersIcon },
            { step: 3, title: "Select Shop", icon: StoreIcon },
            { step: 4, title: "Review & Print", icon: CheckCircle2Icon },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 2,
                  flex: 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    // Allow navigating backwards or forwards if document is uploaded
                    if (uploadedDocument || item.step === 1) {
                      setCurrentStep(item.step as 1 | 2 | 3 | 4);
                    }
                  }}
                  disabled={!uploadedDocument && item.step > 1}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isCurrent
                      ? "var(--primary)"
                      : isCompleted
                      ? "#10b981"
                      : "white",
                    color: isCurrent || isCompleted ? "white" : "var(--muted-foreground)",
                    border: isCurrent
                      ? "2px solid var(--primary)"
                      : isCompleted
                      ? "2px solid #10b981"
                      : "2px solid var(--border)",
                    boxShadow: isCurrent
                      ? "0 0 0 4px rgba(37, 99, 235, 0.18)"
                      : "none",
                    cursor: uploadedDocument || item.step === 1 ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isCompleted ? <CheckIcon size={20} /> : <Icon size={18} />}
                </button>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent
                      ? "var(--primary)"
                      : isCompleted
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    marginTop: "0.5rem",
                  }}
                >
                  {item.title}
                </span>
              </div>
            );
          })}

          {/* Stepper connecting line */}
          <div
            style={{
              position: "absolute",
              top: "22px",
              left: "12%",
              right: "12%",
              height: "2px",
              background: "var(--border)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--primary)",
                width: `${((currentStep - 1) / 3) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Wizard Step Content */}
        <div
          className="card-base"
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            padding: "2rem",
            background: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* STEP 1: UPLOAD DOCUMENT */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  Step 1: Upload your PDF Document
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Upload the file you wish to print. We support standard PDF documents up to 25MB.
                </p>
              </div>

              {/* Upload Dropzone */}
              {!uploadedDocument ? (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    style={{
                      border: isDragging
                        ? "2px dashed var(--primary)"
                        : "2px dashed var(--border)",
                      background: isDragging
                        ? "var(--color-brand-50)"
                        : "var(--color-neutral-50)",
                      borderRadius: "var(--radius)",
                      padding: "3.5rem 2rem",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                  >
                    <input
                      type="file"
                      accept="application/pdf, .pdf"
                      id="pdf-upload-input"
                      onChange={handleFileChange}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                      }}
                    />

                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "white",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1rem",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        color: "var(--primary)",
                      }}
                    >
                      <UploadCloudIcon size={28} />
                    </div>

                    <h3
                      style={{
                        fontSize: "1.0625rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Click to browse or drag and drop your PDF
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--muted-foreground)",
                        maxWidth: "360px",
                        margin: "0 auto",
                      }}
                    >
                      Supports high-resolution vector and document PDFs up to 25MB. Encrypted in transit.
                    </p>
                  </div>

                  {isUploading && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8125rem",
                          marginBottom: "0.35rem",
                          fontWeight: 500,
                        }}
                      >
                        <span>Uploading & analyzing document...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: "var(--color-neutral-200)",
                          borderRadius: "9999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "var(--primary)",
                            width: `${uploadProgress}%`,
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div
                      style={{
                        marginTop: "1.25rem",
                        padding: "0.875rem 1rem",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "var(--radius)",
                        color: "#b91c1c",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <AlertCircleIcon size={16} />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Document Uploaded Success Card */
                <div
                  style={{
                    padding: "1.5rem",
                    border: "1.5px solid #a7f3d0",
                    background: "#f0fdf4",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          background: "#10b981",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileCheckIcon size={26} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h4
                            style={{
                              fontWeight: 700,
                              fontSize: "1.0625rem",
                              color: "var(--foreground)",
                            }}
                          >
                            {uploadedDocument.originalFilename}
                          </h4>
                          <span
                            style={{
                              padding: "0.15rem 0.5rem",
                              background: "#d1fae5",
                              color: "#065f46",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              borderRadius: "9999px",
                            }}
                          >
                            Ready
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            marginTop: "0.2rem",
                          }}
                        >
                          Size: {formatBytes(uploadedDocument.sizeBytes)} • Page count:{" "}
                          <strong>{uploadedDocument.pageCount} pages</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="upload-change-file-btn"
                      onClick={() => {
                        setUploadedDocument(null);
                      }}
                      style={{
                        padding: "0.45rem 0.85rem",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        cursor: "pointer",
                      }}
                    >
                      Change File
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid rgba(16, 185, 129, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#047857",
                    }}
                  >
                    <ShieldCheckIcon size={14} />
                    <span>
                      Checksum verified (SHA-256): {uploadedDocument.checksum.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Action */}
              <div
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  id="wizard-step1-next-btn"
                  disabled={!uploadedDocument}
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    background: uploadedDocument ? "var(--primary)" : "var(--color-neutral-300)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: uploadedDocument ? "pointer" : "not-allowed",
                    boxShadow: uploadedDocument
                      ? "0 2px 8px rgba(37, 99, 235, 0.25)"
                      : "none",
                  }}
                >
                  Continue to Print Options
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE PRINT OPTIONS */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  Step 2: Configure Print Options
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Choose your preferred color, duplex, paper size, and copy settings.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* Color Mode Selection */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    Color Mode
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {[
                      {
                        mode: "BLACK_AND_WHITE" as ColorMode,
                        title: "Black & White",
                        desc: "Standard monochrome print (₹1.00 / page)",
                      },
                      {
                        mode: "COLOR" as ColorMode,
                        title: "Full Color",
                        desc: "Vibrant rich color print (₹5.00 / page)",
                      },
                      {
                        mode: "AUTO" as ColorMode,
                        title: "Auto Detect",
                        desc: "Detect color pages automatically",
                      },
                    ].map((item) => {
                      const isSelected = colorMode === item.mode;
                      return (
                        <div
                          key={item.mode}
                          onClick={() => setColorMode(item.mode)}
                          id={`color-mode-${item.mode.toLowerCase()}`}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius)",
                            border: isSelected
                              ? "2px solid var(--primary)"
                              : "1.5px solid var(--border)",
                            background: isSelected ? "var(--color-brand-50)" : "white",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                              {item.title}
                            </span>
                            {isSelected && (
                              <CheckCircle2Icon size={16} color="var(--primary)" />
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground)",
                              marginTop: "0.25rem",
                            }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duplex Mode (Single or Double Sided) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    Sides & Duplex Printing
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {[
                      {
                        mode: "DUPLEX_LONG_EDGE" as DuplexMode,
                        title: "2-Sided (Flip on Long Edge)",
                        desc: "Standard book/report style. Saves paper & discounted.",
                        badge: "Recommended",
                      },
                      {
                        mode: "SINGLE_SIDED" as DuplexMode,
                        title: "1-Sided (Single Sided)",
                        desc: "Each page printed on a separate sheet.",
                      },
                      {
                        mode: "DUPLEX_SHORT_EDGE" as DuplexMode,
                        title: "2-Sided (Flip on Short Edge)",
                        desc: "Calendar / notepad flip style.",
                      },
                    ].map((item) => {
                      const isSelected = duplexMode === item.mode;
                      return (
                        <div
                          key={item.mode}
                          onClick={() => setDuplexMode(item.mode)}
                          id={`duplex-mode-${item.mode.toLowerCase()}`}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius)",
                            border: isSelected
                              ? "2px solid var(--primary)"
                              : "1.5px solid var(--border)",
                            background: isSelected ? "var(--color-brand-50)" : "white",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            position: "relative",
                          }}
                        >
                          {item.badge && (
                            <span
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                padding: "0.15rem 0.45rem",
                                background: "#d1fae5",
                                color: "#065f46",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                borderRadius: "9999px",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                              {item.title}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground)",
                              marginTop: "0.25rem",
                            }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Paper Size & Copies Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {/* Paper Size */}
                  <div>
                    <label
                      htmlFor="paper-size-select"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Paper Size
                    </label>
                    <select
                      id="paper-size-select"
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                      className="input-base"
                      style={{ width: "100%" }}
                    >
                      <option value="A4">A4 (210 × 297 mm) — Standard</option>
                      <option value="A3">A3 (297 × 420 mm) — Large</option>
                      <option value="A5">A5 (148 × 210 mm) — Compact</option>
                      <option value="LETTER">Letter (8.5 × 11 in)</option>
                      <option value="LEGAL">Legal (8.5 × 14 in)</option>
                    </select>
                  </div>

                  {/* Copies Stepper */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Number of Copies
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        id="copies-decrement-btn"
                        onClick={() => setCopies((c) => Math.max(1, c - 1))}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: "white",
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        id="copies-count-input"
                        min="1"
                        max="99"
                        value={copies}
                        onChange={(e) =>
                          setCopies(Math.min(99, Math.max(1, Number(e.target.value) || 1)))
                        }
                        className="input-base"
                        style={{
                          width: "70px",
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: "1rem",
                        }}
                      />
                      <button
                        type="button"
                        id="copies-increment-btn"
                        onClick={() => setCopies((c) => Math.min(99, c + 1))}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: "white",
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orientation & Pages Per Sheet */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {/* Orientation */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Orientation
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[
                        { id: "PORTRAIT" as Orientation, label: "Portrait (Vertical)" },
                        { id: "LANDSCAPE" as Orientation, label: "Landscape (Horizontal)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setOrientation(item.id)}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: "var(--radius)",
                            border:
                              orientation === item.id
                                ? "2px solid var(--primary)"
                                : "1px solid var(--border)",
                            background: orientation === item.id ? "var(--color-brand-50)" : "white",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pages Per Sheet */}
                  <div>
                    <label
                      htmlFor="pages-per-sheet-select"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Pages per Sheet (N-Up)
                    </label>
                    <select
                      id="pages-per-sheet-select"
                      value={pagesPerSheet}
                      onChange={(e) =>
                        setPagesPerSheet(Number(e.target.value) as PagesPerSheet)
                      }
                      className="input-base"
                      style={{ width: "100%" }}
                    >
                      <option value="1">1 page per sheet (Standard)</option>
                      <option value="2">2 pages per sheet (2-Up)</option>
                      <option value="4">4 pages per sheet (4-Up)</option>
                      <option value="6">6 pages per sheet (6-Up)</option>
                      <option value="9">9 pages per sheet (9-Up)</option>
                    </select>
                  </div>
                </div>

                {/* Page Range Selection */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Page Range
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="pageRangeOption"
                        checked={pageRangeType === "all"}
                        onChange={() => setPageRangeType("all")}
                      />
                      <span>All pages (1 to {uploadedDocument?.pageCount || 1})</span>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="pageRangeOption"
                        checked={pageRangeType === "custom"}
                        onChange={() => setPageRangeType("custom")}
                      />
                      <span>Custom Range</span>
                    </label>

                    {pageRangeType === "custom" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input
                          type="number"
                          min="1"
                          max={pageRangeEnd}
                          value={pageRangeStart}
                          onChange={(e) =>
                            setPageRangeStart(
                              Math.max(1, Math.min(pageRangeEnd, Number(e.target.value) || 1))
                            )
                          }
                          className="input-base"
                          style={{ width: "60px", padding: "0.3rem" }}
                        />
                        <span>to</span>
                        <input
                          type="number"
                          min={pageRangeStart}
                          max={uploadedDocument?.pageCount || 999}
                          value={pageRangeEnd}
                          onChange={(e) =>
                            setPageRangeEnd(
                              Math.min(
                                uploadedDocument?.pageCount || 999,
                                Math.max(pageRangeStart, Number(e.target.value) || 1)
                              )
                            )
                          }
                          className="input-base"
                          style={{ width: "60px", padding: "0.3rem" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Quality */}
                <div>
                  <label
                    htmlFor="print-quality-select"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Print Quality
                  </label>
                  <select
                    id="print-quality-select"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as PrintQuality)}
                    className="input-base"
                    style={{ width: "100%", maxWidth: "320px" }}
                  >
                    <option value="NORMAL">Normal (Standard 600 DPI)</option>
                    <option value="HIGH">High (Crisp Presentation / Photo)</option>
                    <option value="DRAFT">Draft (Fast & Ink Saver)</option>
                  </select>
                </div>
              </div>

              {/* Navigation Action */}
              <div
                style={{
                  marginTop: "2.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeftIcon size={16} />
                  Back to Upload
                </button>

                <button
                  type="button"
                  id="wizard-step2-next-btn"
                  onClick={() => setCurrentStep(3)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  Continue to Select Shop
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT SHOP & PRINTER */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  Step 3: Select a Local Print Shop
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Choose a nearby verified shop with available printers to execute your print job.
                </p>
              </div>

              {/* City filter input */}
              <div style={{ marginBottom: "1.25rem" }}>
                <input
                  type="text"
                  placeholder="Filter by city or location (e.g. Bengaluru)..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="input-base"
                  style={{ width: "100%", maxWidth: "380px" }}
                />
              </div>

              {isLoadingShops ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <RefreshCwIcon size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
                  <p>Discovering nearby print shops...</p>
                </div>
              ) : shops.length === 0 ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <StoreIcon size={36} color="var(--muted-foreground)" style={{ margin: "0 auto 0.5rem" }} />
                  <h4 style={{ fontWeight: 600 }}>No print shops found</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                    Please make sure the database is seeded with demo shops.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {shops
                    .filter(
                      (s) =>
                        !cityFilter ||
                        s.city?.toLowerCase().includes(cityFilter.toLowerCase()) ||
                        s.name.toLowerCase().includes(cityFilter.toLowerCase())
                    )
                    .map((shop) => {
                      const isSelected = selectedShopId === shop.id;
                      return (
                        <div
                          key={shop.id}
                          id={`shop-card-${shop.id}`}
                          onClick={() => handleSelectShop(shop)}
                          style={{
                            padding: "1.25rem",
                            borderRadius: "var(--radius)",
                            border: isSelected
                              ? "2px solid var(--primary)"
                              : "1.5px solid var(--border)",
                            background: isSelected ? "var(--color-brand-50)" : "white",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: "0.75rem",
                            }}
                          >
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "8px",
                                  background: isSelected
                                    ? "var(--primary)"
                                    : "var(--color-neutral-100)",
                                  color: isSelected ? "white" : "var(--foreground)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <StoreIcon size={22} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                                    {shop.name}
                                  </h3>
                                  <span
                                    style={{
                                      padding: "0.15rem 0.5rem",
                                      background: shop.isAvailable ? "#d1fae5" : "#fee2e2",
                                      color: shop.isAvailable ? "#065f46" : "#991b1b",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      borderRadius: "9999px",
                                    }}
                                  >
                                    {shop.isAvailable ? "Online & Ready" : "Offline"}
                                  </span>
                                </div>
                                <p
                                  style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--muted-foreground)",
                                    marginTop: "0.2rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                  }}
                                >
                                  <MapPinIcon size={13} />
                                  {shop.address}, {shop.city}
                                </p>
                              </div>
                            </div>

                            {/* Printer capability badges */}
                            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                              {shop.capabilities.supportsColor && (
                                <span
                                  style={{
                                    padding: "0.2rem 0.5rem",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    borderRadius: "4px",
                                  }}
                                >
                                  Color
                                </span>
                              )}
                              {shop.capabilities.supportsDuplex && (
                                <span
                                  style={{
                                    padding: "0.2rem 0.5rem",
                                    background: "#f0fdf4",
                                    color: "#15803d",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    borderRadius: "4px",
                                  }}
                                >
                                  Duplex
                                </span>
                              )}
                              <span
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  background: "var(--color-neutral-100)",
                                  color: "var(--color-neutral-700)",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  borderRadius: "4px",
                                }}
                              >
                                {shop.onlinePrinterCount} / {shop.totalPrinterCount} Printers
                              </span>
                            </div>
                          </div>

                          {/* Specific Printer Selector for this Shop */}
                          {isSelected && shop.printers.length > 0 && (
                            <div
                              style={{
                                marginTop: "1rem",
                                paddingTop: "0.75rem",
                                borderTop: "1px solid var(--border)",
                              }}
                            >
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  color: "var(--foreground)",
                                  marginBottom: "0.35rem",
                                }}
                              >
                                Select Printer Device:
                              </label>
                              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {shop.printers.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPrinterId(p.id);
                                    }}
                                    style={{
                                      padding: "0.4rem 0.75rem",
                                      borderRadius: "var(--radius)",
                                      fontSize: "0.8125rem",
                                      fontWeight: 600,
                                      border:
                                        selectedPrinterId === p.id
                                          ? "2px solid var(--primary)"
                                          : "1px solid var(--border)",
                                      background:
                                        selectedPrinterId === p.id ? "white" : "transparent",
                                      color: "var(--foreground)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                    }}
                                  >
                                    <PrinterIcon size={14} />
                                    <span>
                                      {p.name} ({p.model || "Standard"})
                                    </span>
                                    <span
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: p.status === "ONLINE" ? "#10b981" : "#94a3b8",
                                      }}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Navigation Action */}
              <div
                style={{
                  marginTop: "2.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeftIcon size={16} />
                  Back to Options
                </button>

                <button
                  type="button"
                  id="wizard-step3-next-btn"
                  disabled={!selectedShopId || !selectedPrinterId}
                  onClick={() => setCurrentStep(4)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    background:
                      selectedShopId && selectedPrinterId
                        ? "var(--primary)"
                        : "var(--color-neutral-300)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: selectedShopId && selectedPrinterId ? "pointer" : "not-allowed",
                    boxShadow:
                      selectedShopId && selectedPrinterId
                        ? "0 2px 8px rgba(37, 99, 235, 0.25)"
                        : "none",
                  }}
                >
                  Review Order & Live Quote
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PLACE ORDER */}
          {currentStep === 4 && (
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  Step 4: Review Order & Authoritative Price Breakdown
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Verify your print configuration and submit directly to the shop printer.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                {/* Order Summary Box */}
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius)",
                    background: "var(--color-neutral-50)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <FileTextIcon size={18} color="var(--primary)" />
                    Job Specifications
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Document:</span>
                      <span style={{ fontWeight: 600, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {uploadedDocument?.originalFilename}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Pages:</span>
                      <span style={{ fontWeight: 600 }}>
                        {pageRangeType === "custom"
                          ? `${pageRangeStart} - ${pageRangeEnd} (${
                              pageRangeEnd - pageRangeStart + 1
                            } pages)`
                          : `${uploadedDocument?.pageCount || 1} pages (All)`}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Color Mode:</span>
                      <span style={{ fontWeight: 600 }}>
                        {colorMode === "COLOR"
                          ? "Full Color"
                          : colorMode === "AUTO"
                          ? "Auto Detect"
                          : "Black & White"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Paper Size & Sides:</span>
                      <span style={{ fontWeight: 600 }}>
                        {paperSize} •{" "}
                        {duplexMode === "SINGLE_SIDED" ? "1-Sided" : "2-Sided Duplex"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Copies:</span>
                      <span style={{ fontWeight: 600 }}>{copies} copy/copies</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Selected Shop:</span>
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                        {selectedShop?.name}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Printer Device:</span>
                      <span style={{ fontWeight: 600 }}>
                        {selectedPrinter?.name} ({selectedPrinter?.model || "Canon"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown Box */}
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius)",
                    background: "white",
                    border: "1.5px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <SparklesIcon size={18} color="var(--primary)" />
                        Server Price Quote
                      </h3>
                      {isCalculatingPrice && (
                        <RefreshCwIcon size={14} className="animate-spin" color="var(--primary)" />
                      )}
                    </div>

                    {priceBreakdown ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--muted-foreground)" }}>
                            Base rate ({priceBreakdown.colorSurcharge > 0 ? "Color" : "B&W"}):
                          </span>
                          <span>₹{priceBreakdown.basePrice.toFixed(2)}</span>
                        </div>

                        {priceBreakdown.colorSurcharge > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--muted-foreground)" }}>Color surcharge:</span>
                            <span>+₹{priceBreakdown.colorSurcharge.toFixed(2)}</span>
                          </div>
                        )}

                        {priceBreakdown.duplexDiscount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                            <span>Duplex paper discount:</span>
                            <span>-₹{priceBreakdown.duplexDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--muted-foreground)" }}>Copies multiplier:</span>
                          <span>x {priceBreakdown.copiesMultiplier}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--muted-foreground)" }}>
                        {isCalculatingPrice ? "Computing live pricing..." : pricingError || "Pricing unavailable"}
                      </div>
                    )}
                  </div>

                  {/* Total Amount Box */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "1rem",
                      borderTop: "2px dashed var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                        Total Amount
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 500 }}>
                        All taxes included
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: 800,
                          color: "var(--primary)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        ₹{priceBreakdown ? priceBreakdown.total.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {orderError && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "0.875rem 1rem",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--radius)",
                    color: "#b91c1c",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertCircleIcon size={16} />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Final Submit / Place Order Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={isSubmittingOrder}
                  style={{
                    padding: "0.65rem 1.25rem",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeftIcon size={16} />
                  Back to Shop
                </button>

                <button
                  type="button"
                  id="submit-print-order-btn"
                  disabled={isSubmittingOrder || !priceBreakdown}
                  onClick={handlePlaceOrder}
                  style={{
                    padding: "0.85rem 2.25rem",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    cursor: isSubmittingOrder || !priceBreakdown ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCwIcon size={18} className="animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <PrinterIcon size={20} />
                      Confirm & Send to Printer (₹{priceBreakdown ? priceBreakdown.total.toFixed(2) : "0.00"})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CustomerUploadWizardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--background)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <PrinterIcon size={24} color="white" />
            </div>
            <p style={{ fontWeight: 600, color: "var(--muted-foreground)" }}>
              Loading Cloud Print Wizard...
            </p>
          </div>
        </div>
      }
    >
      <UploadWizardContent />
    </Suspense>
  );
}
