import { AuthProvider } from "./auth-provider"
import type React from "react"

// Existing code here

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
