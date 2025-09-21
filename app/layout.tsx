import type React from "react"
import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "x3o.ai - Enterprise AI Automation That Scales With Your Business",
  description:
    "Deploy Trinity Agents that automate entire departments with 100% explainable AI and measurable ROI for enterprise teams. Oracle Analytics, Sentinel Monitoring, Sage Optimization.",
  keywords: [
    "AI automation",
    "Trinity Agents",
    "enterprise automation",
    "explainable AI",
    "Oracle Analytics",
    "Sentinel Monitoring",
    "Sage Optimization",
    "business automation",
    "department automation",
    "enterprise AI",
    "measurable ROI",
    "x3o.ai"
  ],
  authors: [{ name: "SonnierVentures", url: "https://sonnierventures.com" }],
  creator: "SonnierVentures",
  publisher: "x3o.ai",
  openGraph: {
    title: "x3o.ai - Enterprise AI Automation That Scales With Your Business",
    description: "Deploy Trinity Agents that automate entire departments with 100% explainable AI and measurable ROI for enterprise teams",
    url: "https://x3o.ai",
    siteName: "x3o.ai",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "x3o.ai - Enterprise AI Automation Platform",
    description: "Deploy Trinity Agents that automate entire departments with explainable AI",
    creator: "@x3o_ai",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}