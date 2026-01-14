"use client"

import type React from "react"

import { SidebarNav } from "./sidebar-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 ml-0 pt-16 lg:pt-0">
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </main>
    </div>
  )
}
