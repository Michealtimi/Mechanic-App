"use client"

import type React from "react"
import MechanicLayoutComponent from "@/components/mechanic-layout"
import RouteGuard from "@/components/route-guard"

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["mechanic"]}>
      <MechanicLayoutComponent>{children}</MechanicLayoutComponent>
    </RouteGuard>
  )
}
