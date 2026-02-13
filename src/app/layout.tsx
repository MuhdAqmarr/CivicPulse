import type { Metadata, Viewport } from "next"
import { GeistPixelCircle } from "geist/font/pixel"
import { ThemeProvider } from "@/components/theme-provider"
import { SkipLink } from "@/components/layout/skip-link"
import { Toaster } from "sonner"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "CivicPulse - Local Community Problem Reporter",
    template: "%s | CivicPulse",
  },
  description: "Report local issues, track progress, and help verify fixes in your community. A civic tool for community-driven problem solving.",
  keywords: ["community", "local issues", "problem reporter", "civic", "city", "municipal", "neighborhood", "urban planning"],
  authors: [{ name: "CivicPulse" }],
  creator: "CivicPulse",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CivicPulse",
    title: "CivicPulse - Local Community Problem Reporter",
    description: "Report local issues, track progress, and help verify fixes in your community.",
    images: [
      {
        url: "/Logo.png",
        width: 1200,
        height: 630,
        alt: "CivicPulse - Community Problem Reporter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicPulse - Local Community Problem Reporter",
    description: "Report local issues, track progress, and help verify fixes in your community.",
    images: ["/Logo.png"],
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
        <link rel="icon" href="/Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className={`${GeistPixelCircle.className} antialiased`}>
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
