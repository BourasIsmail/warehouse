import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar" 
import { SonnerProvider } from "@/components/sonner-provider"
import { WarehouseSidebar } from "@/components/warehouse-sidebar"
import { OrionDataProvider } from "@/components/orion-data-provider"
import { KeyrockAuthProvider } from "@/components/keyrock-auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Warehouse Management",
  description: "IoT-powered warehouse inventory management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <KeyrockAuthProvider>
            <OrionDataProvider>
              <SidebarProvider>
                <div className="flex min-h-screen">
                  <WarehouseSidebar />
                  <main className="flex-1">{children}</main>
                </div>
                <SonnerProvider />
              </SidebarProvider>
            </OrionDataProvider>
          </KeyrockAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

