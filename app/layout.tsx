import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RevealObserver } from "@/components/reveal-observer";
import "./globals.css";

// One typeface: Geist. Geist Mono only where a monospace is functionally required (commands, files, rule ids).
const geist = localFont({ src: "./fonts/geist.woff2", variable: "--font-geist", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "./fonts/geist-mono.woff2", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://harnay.dev";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Harnay: the safety harness for Claude Code",
    template: "%s | Harnay",
  },
  description:
    "One command installs rules, permission settings and a guard hook for Claude Code. It blocks database resets, secret reads and force pushes before they run. Free for any project.",
  openGraph: {
    title: "The safety harness for Claude Code",
    description: "One command installs rules, permission settings and a guard hook that checks every command before it runs.",
    url: site,
    siteName: "Harnay",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#131209" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the page as scripted before first paint, so scroll reveals never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="btn btn-primary sr-only left-4 top-4 z-50 focus:not-sr-only focus:fixed">
          Skip to content
        </a>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
