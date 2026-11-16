import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RevealObserver } from "@/components/reveal-observer";
import "./globals.css";

const archivo = localFont({
  src: "./fonts/archivo.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  // The file carries a width axis; without this the browser will not use the condensed widths.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const code = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-code",
  weight: "100 800",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://harnay.dev";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Harnay: put your coding agent in a harness",
    template: "%s | Harnay",
  },
  description:
    "One command installs rules, permissions and a guard hook for Claude Code. It blocks database resets, secret reads and force-pushes before they run. Free for any project.",
  openGraph: {
    title: "Put your coding agent in a harness",
    description: "One command installs rules, permissions and a guard hook for Claude Code.",
    url: site,
    siteName: "Harnay",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#f1f2ee" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the page as scripted before first paint, so scroll reveals never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="button sr-only left-4 top-4 z-10 focus:not-sr-only focus:absolute">
          Skip to content
        </a>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
