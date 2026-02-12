import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SkipLink } from "@/components/layout/skip-link"
import { Toaster } from "sonner"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "CivicPulse - Local Community Problem Reporter",
    template: "%s | CivicPulse",
  },
  description: "Report local issues, track progress, and help verify fixes in your community. A civic tool for community-driven problem solving.",
  keywords: ["community", "local issues", "problem reporter", "civic", "city", "municipal"],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CivicPulse",
    title: "CivicPulse - Local Community Problem Reporter",
    description: "Report local issues, track progress, and help verify fixes in your community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicPulse - Local Community Problem Reporter",
    description: "Report local issues, track progress, and help verify fixes in your community.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster richColors position="top-right" />
          <PWAProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
