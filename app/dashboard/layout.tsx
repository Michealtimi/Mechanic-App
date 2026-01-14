"use client"

import type React from "react"
import CustomerLayoutComponent from "@/components/customer-layout"
import RouteGuard from "@/components/route-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["customer"]}>
      <CustomerLayoutComponent>{children}</CustomerLayoutComponent>
    </RouteGuard>
  )
}
