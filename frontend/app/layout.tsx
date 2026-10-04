import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumenote — Document Investigation & Predictive Intelligence Platform",
  description:
    "Dual AI Platform: Multi-document forensic audit & cross-checking (ALG-AI-02) and physics-informed predictive maintenance engine (ALG-DATA-02).",
  keywords: ["Lumenote", "document investigation", "predictive maintenance", "AI4I 2020", "ALG-DATA-02", "ALG-AI-02"],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[var(--color-page)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
