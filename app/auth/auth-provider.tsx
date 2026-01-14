"use client"
import { createContext, useContext, type ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  userRole: "customer" | "mechanic" | "admin" | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const contextValue: AuthContextType = {
    isAuthenticated: false,
    userRole: null,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
