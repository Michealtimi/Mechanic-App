"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AdminLayout from "./admin-layout"
import CustomerLayout from "./customer-layout"
import MechanicLayout from "./mechanic-layout"

export default function RoleRouter({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  if (!user) return null

  if (user.role === "admin") return <AdminLayout>{children}</AdminLayout>
  if (user.role === "mechanic") return <MechanicLayout>{children}</MechanicLayout>
  return <CustomerLayout>{children}</CustomerLayout>
}
