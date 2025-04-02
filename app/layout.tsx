import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SonnerProvider } from "@/components/sonner-provider"
import { KeyrockAuthProvider } from "@/components/keyrock-auth-provider"
import { OrionDataProvider } from "@/components/orion-data-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Warehouse Management",
  description: "A modern warehouse management system powered by FIWARE",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SonnerProvider />
          <KeyrockAuthProvider>
            <OrionDataProvider>{children}</OrionDataProvider>
          </KeyrockAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

