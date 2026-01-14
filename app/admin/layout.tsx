"use client"

import type React from "react"
import AdminLayoutComponent from "@/components/admin-layout"
import RouteGuard from "@/components/route-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminLayoutComponent>{children}</AdminLayoutComponent>
    </RouteGuard>
  )
}
