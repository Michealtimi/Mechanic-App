"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"

interface RoleBasedVisibilityProps {
  children: React.ReactNode
  allowedRoles: ("customer" | "mechanic" | "admin")[]
  fallback?: React.ReactNode
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleBasedVisibility({ children, allowedRoles, fallback = null }: RoleBasedVisibilityProps) {
  const { user } = useAuth()

  if (!user) return fallback

  if (allowedRoles.includes(user.role)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Hook to check if current user has required role
 */
export function useRoleCheck(allowedRoles: ("customer" | "mechanic" | "admin")[]): boolean {
  const { user } = useAuth()
  if (!user) return false
  return allowedRoles.includes(user.role)
}

/**
 * Hook to get current user role
 */
export function useUserRole() {
  const { user } = useAuth()
  return user?.role || null
}
