"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles?: ("customer" | "mechanic" | "admin")[]
  redirectTo?: string
}

export default function RouteGuard({ 
  children, 
  allowedRoles,
  redirectTo 
}: RouteGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      // Not logged in, redirect to login
      router.push(redirectTo || "/auth/login")
      return
    }

    // If allowedRoles is specified, check if user's role is allowed
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to their dashboard
        const roleDashboards: Record<string, string> = {
          customer: "/dashboard",
          mechanic: "/mechanic/dashboard",
          admin: "/admin/dashboard"
        }
        router.push(roleDashboards[user.role] || "/dashboard")
        return
      }
    }

    // Role-based route protection
    const roleRoutes: Record<string, string[]> = {
      customer: ["/dashboard", "/onboarding/customer"],
      mechanic: ["/mechanic", "/onboarding/mechanic"],
      admin: ["/admin"]
    }

    const userRoutes = roleRoutes[user.role] || []
    const isAllowedRoute = userRoutes.some(route => pathname.startsWith(route)) || 
                          pathname === "/" || 
                          pathname.startsWith("/auth") ||
                          pathname.startsWith("/onboarding")

    if (!isAllowedRoute) {
      // User trying to access route not for their role
      const roleDashboards: Record<string, string> = {
        customer: "/dashboard",
        mechanic: "/mechanic/dashboard",
        admin: "/admin/dashboard"
      }
      router.push(roleDashboards[user.role] || "/dashboard")
    }
  }, [user, pathname, router, allowedRoles, redirectTo])

  if (!user) {
    return null // Will redirect
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null // Will redirect
  }

  return <>{children}</>
}
