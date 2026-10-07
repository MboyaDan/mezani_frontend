import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: { default: "Mezzani", template: "%s | Mezzani" },
  description: "QR ordering and restaurant management for Kenyan restaurants",
  applicationName: "Mezzani",
}

export const viewport: Viewport = {
  themeColor: "#F6F2E9",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-zinc-50 antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}