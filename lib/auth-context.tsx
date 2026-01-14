"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "customer" | "mechanic" | "admin"

interface User {
  id: string
  name: string
  role: UserRole
  email: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("autoserve_user")
      if (stored) {
        try {
          const userData = JSON.parse(stored)
          // Normalize role to match UserRole type
          const normalizedRole = userData.role?.toLowerCase()
          if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
            userData.role = 'admin'
          } else if (normalizedRole === 'mechanic') {
            userData.role = 'mechanic'
          } else {
            userData.role = 'customer'
          }
          setUser(userData)
        } catch (error) {
          console.error('Error parsing user data:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    // Load user on mount
    loadUser()

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'autoserve_user') {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events (for same-tab updates)
    const handleUserUpdate = () => {
      loadUser()
    }

    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [])

  const logout = async () => {
    try {
      const { api } = await import('./api-client')
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem("autoserve_user")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
  }

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
