import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ERB — Cloud Printing Platform",
    template: "%s | ERB Printing",
  },
  description:
    "Upload your documents and get them printed at a local shop near you. Fast, reliable, and hassle-free printing with live status tracking.",
  keywords: ["printing", "print shop", "document printing", "online printing", "India"],
  authors: [{ name: "ERB Team" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "ERB Printing",
    title: "ERB — Cloud Printing Platform",
    description: "Upload, configure, and print at a shop near you.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
