// ERB Shared Types & Enums
// These are the canonical definitions used across all packages and apps.

// ============================================================
// User Roles
// ============================================================
export enum UserRole {
  CUSTOMER = "CUSTOMER",
  SHOP_OWNER = "SHOP_OWNER",
  ADMIN = "ADMIN",
}

// ============================================================
// Shop Status
// ============================================================
export enum ShopStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
}

// ============================================================
// Printer Status
// ============================================================
export enum PrinterStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  ERROR = "ERROR",
  PAUSED = "PAUSED",
  UNKNOWN = "UNKNOWN",
}

// ============================================================
// Order Status — matches the order state machine in the spec
// ============================================================
export enum OrderStatus {
  CREATED = "CREATED",
  UPLOADED = "UPLOADED",
  WAITING_FOR_SHOP = "WAITING_FOR_SHOP",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  QUEUED = "QUEUED",
  PRINTING = "PRINTING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// ============================================================
// Print Job Status
// ============================================================
export enum PrintJobStatus {
  QUEUED = "QUEUED",
  CLAIMING = "CLAIMING",   // transient: worker is atomically claiming
  PRINTING = "PRINTING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// ============================================================
// Order State Machine — valid transitions
// ============================================================
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.UPLOADED, OrderStatus.CANCELLED],
  [OrderStatus.UPLOADED]: [OrderStatus.WAITING_FOR_SHOP, OrderStatus.CANCELLED],
  [OrderStatus.WAITING_FOR_SHOP]: [
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ACCEPTED]: [OrderStatus.QUEUED, OrderStatus.CANCELLED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.QUEUED]: [OrderStatus.PRINTING, OrderStatus.CANCELLED],
  [OrderStatus.PRINTING]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.FAILED]: [OrderStatus.QUEUED, OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

// ============================================================
// Print Job State Machine — valid transitions
// ============================================================
export const PRINT_JOB_TRANSITIONS: Record<PrintJobStatus, PrintJobStatus[]> = {
  [PrintJobStatus.QUEUED]: [PrintJobStatus.CLAIMING, PrintJobStatus.CANCELLED],
  [PrintJobStatus.CLAIMING]: [PrintJobStatus.PRINTING, PrintJobStatus.FAILED],
  [PrintJobStatus.PRINTING]: [PrintJobStatus.COMPLETED, PrintJobStatus.FAILED],
  [PrintJobStatus.COMPLETED]: [],
  [PrintJobStatus.FAILED]: [PrintJobStatus.QUEUED, PrintJobStatus.CANCELLED],
  [PrintJobStatus.CANCELLED]: [],
};

// ============================================================
// Paper Sizes
// ============================================================
export enum PaperSize {
  A3 = "A3",
  A4 = "A4",
  A5 = "A5",
  LETTER = "LETTER",
  LEGAL = "LEGAL",
  TABLOID = "TABLOID",
}

// ============================================================
// Color Mode
// ============================================================
export enum ColorMode {
  COLOR = "COLOR",
  BLACK_AND_WHITE = "BLACK_AND_WHITE",
  AUTO = "AUTO",
}

// ============================================================
// Duplex Mode
// ============================================================
export enum DuplexMode {
  SINGLE_SIDED = "SINGLE_SIDED",
  DUPLEX_LONG_EDGE = "DUPLEX_LONG_EDGE",
  DUPLEX_SHORT_EDGE = "DUPLEX_SHORT_EDGE",
}

// ============================================================
// Print Quality
// ============================================================
export enum PrintQuality {
  DRAFT = "DRAFT",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
}

// ============================================================
// Orientation
// ============================================================
export enum Orientation {
  PORTRAIT = "PORTRAIT",
  LANDSCAPE = "LANDSCAPE",
}

// ============================================================
// Pages Per Sheet
// ============================================================
export enum PagesPerSheet {
  ONE = 1,
  TWO = 2,
  FOUR = 4,
  SIX = 6,
  EIGHT = 8,
  NINE = 9,
  SIXTEEN = 16,
}

// ============================================================
// Scaling Mode
// ============================================================
export enum ScalingMode {
  FIT_TO_PAGE = "FIT_TO_PAGE",
  ACTUAL_SIZE = "ACTUAL_SIZE",
  CUSTOM = "CUSTOM",
}

// ============================================================
// Print Options — the full options object stored on a print job
// ============================================================
export interface PrintOptions {
  colorMode: ColorMode;
  duplexMode: DuplexMode;
  paperSize: PaperSize;
  orientation: Orientation;
  pagesPerSheet: PagesPerSheet;
  scaling: ScalingMode;
  customScalePercent?: number;  // only when scaling === CUSTOM
  quality: PrintQuality;
  copies: number;
  pageRangeStart?: number;      // 1-indexed, inclusive
  pageRangeEnd?: number;        // 1-indexed, inclusive
  collate: boolean;
  mediaType?: string;           // printer-specific media type string
}

// ============================================================
// Printer Capabilities — what a printer can do
// ============================================================
export interface PrinterCapabilities {
  supportsColor: boolean;
  supportsDuplex: boolean;
  supportedPaperSizes: PaperSize[];
  supportedColorModes: ColorMode[];
  supportedDuplexModes: DuplexMode[];
  supportedOrientations: Orientation[];
  supportedPagesPerSheet: PagesPerSheet[];
  supportedScalingModes: ScalingMode[];
  supportedQualityModes: PrintQuality[];
  supportedMediaTypes: string[];
  maxCopies: number;
  maxResolutionDpi?: number;
}

// ============================================================
// Pricing
// ============================================================
export interface PriceBreakdown {
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

// ============================================================
// API Response envelope
// ============================================================
export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================
// Error Codes
// ============================================================
export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Upload
  UPLOAD_FAILED: "UPLOAD_FAILED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  DOCUMENT_INVALID: "DOCUMENT_INVALID",

  // Shop/Printer
  SHOP_UNAVAILABLE: "SHOP_UNAVAILABLE",
  SHOP_NOT_FOUND: "SHOP_NOT_FOUND",
  PRINTER_OFFLINE: "PRINTER_OFFLINE",
  PRINTER_BUSY: "PRINTER_BUSY",
  PRINTER_NOT_FOUND: "PRINTER_NOT_FOUND",
  UNSUPPORTED_OPTION: "UNSUPPORTED_OPTION",
  CAPABILITY_VALIDATION_FAILED: "CAPABILITY_VALIDATION_FAILED",

  // Order
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_ALREADY_PLACED: "ORDER_ALREADY_PLACED",
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED",

  // Queue/Printing
  QUEUE_ERROR: "QUEUE_ERROR",
  PRINT_FAILED: "PRINT_FAILED",
  DOCUMENT_DOWNLOAD_FAILED: "DOCUMENT_DOWNLOAD_FAILED",
  AGENT_OFFLINE: "AGENT_OFFLINE",
  UNKNOWN_PRINTER_ERROR: "UNKNOWN_PRINTER_ERROR",
  MAX_RETRIES_EXCEEDED: "MAX_RETRIES_EXCEEDED",

  // Generic
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================
// Queue Job payload — what goes into BullMQ
// ============================================================
export interface PrintJobPayload {
  printJobId: string;
  orderId: string;
  documentId: string;
  shopId: string;
  printerId: string;
  options: PrintOptions;
  attemptCount: number;
}

// ============================================================
// SSE Event types
// ============================================================
export type SSEEventType =
  | "order.status_changed"
  | "print_job.status_changed"
  | "printer.status_changed"
  | "queue.updated"
  | "heartbeat";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}
