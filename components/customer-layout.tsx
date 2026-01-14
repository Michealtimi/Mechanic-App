"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { SidebarNav } from "./sidebar-nav"
import CustomerMapView from "./customer-map-view"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if this is a map/search view (root dashboard)
  const isMapView = pathname === "/dashboard"

  if (isMapView) {
    // For map view, use the full-screen map layout
    return <CustomerMapView>{children}</CustomerMapView>
  }

  // For other pages, use sidebar layout
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 w-full">
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
