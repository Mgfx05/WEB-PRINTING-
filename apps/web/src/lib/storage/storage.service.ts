import { writeFile, mkdir, readFile, unlink, access } from "fs/promises";
import { join, extname } from "path";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Storage service abstraction.
 * Swapping from local → S3 requires only changing STORAGE_PROVIDER env var
 * and implementing the S3 adapter below.
 */
export interface StorageService {
  /** Store a file. Returns the storage key. */
  upload(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ storageKey: string; checksum: string }>;

  /** Download a file by key. */
  download(key: string): Promise<Buffer>;

  /** Generate a URL for accessing the file. */
  getAccessUrl(key: string): Promise<string>;

  /** Delete a file. */
  delete(key: string): Promise<void>;
}

// ── Local filesystem storage ──────────────────────────────────────────────
// Used in development. Files stored under STORAGE_LOCAL_PATH.
// NEVER expose raw filesystem paths to users.

class LocalStorageService implements StorageService {
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH ?? join(process.cwd(), "uploads");
  }

  async upload(
    key: string,
    buffer: Buffer,
    _mimeType: string
  ): Promise<{ storageKey: string; checksum: string }> {
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const dir = join(this.basePath, key.split("/").slice(0, -1).join("/"));
    await mkdir(dir, { recursive: true });
    const filePath = join(this.basePath, key);
    await writeFile(filePath, buffer);
    return { storageKey: key, checksum };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(this.basePath, key);
    return readFile(filePath);
  }

  async getAccessUrl(key: string): Promise<string> {
    // In production, this would return a signed URL.
    // In dev, we serve via the API proxy endpoint.
    return `/api/v1/documents/serve/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);
    try {
      await access(filePath);
      await unlink(filePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }
}

// ── Storage key generation ────────────────────────────────────────────────
// CRITICAL: Keys are NEVER derived from user-supplied filenames.
// This prevents path traversal, overwrites, and enumeration.

export function generateStorageKey(userId: string, mimeType: string): string {
  const ext = mimeType === "application/pdf" ? ".pdf" : extname(mimeType) || ".bin";
  const fileId = uuidv4();
  // Structure: documents/{year}/{month}/{userId}/{uuid}.pdf
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `documents/${year}/${month}/${userId}/${fileId}${ext}`;
}

// ── Factory ───────────────────────────────────────────────────────────────

function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return new LocalStorageService();
    case "s3":
      // TODO Phase 8: Implement S3StorageService
      throw new Error(
        "S3 storage provider not yet implemented. Set STORAGE_PROVIDER=local for development."
      );
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

// Singleton
const globalForStorage = globalThis as unknown as {
  storageService: StorageService | undefined;
};

export const storageService: StorageService =
  globalForStorage.storageService ?? createStorageService();

if (process.env.NODE_ENV !== "production") {
  globalForStorage.storageService = storageService;
}
