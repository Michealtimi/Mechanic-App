"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"customer" | "mechanic" | "admin" | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    try {
      const { api } = await import("@/lib/api-client")
      const result = await api.auth.login(formData.email, formData.password)
      
      // User is automatically set in localStorage by api client
      // Trigger auth context update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('userUpdated'))
      }
      
      // Redirect based on role
      const role = result.user.role.toLowerCase()
      router.push(getRedirectPath(role))
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.")
      console.error("Login error:", error)
    }
  }

  const getRedirectPath = (role: string): string => {
    const normalizedRole = role.toLowerCase()
    if (normalizedRole === 'customer') return "/dashboard"
    if (normalizedRole === 'mechanic') return "/mechanic/dashboard"
    if (normalizedRole === 'admin' || normalizedRole === 'superadmin') return "/admin/dashboard"
    return "/dashboard"
  }

  const handleSuperAdminLogin = (role: "customer" | "mechanic" | "admin") => {
    setSelectedRole(role)
    // Set mock user in localStorage for testing
    const mockUser = {
      id: `test-${role}-${Date.now()}`,
      name: `Test ${role}`,
      email: `test@${role}.com`,
      role: role
    }
    localStorage.setItem("autoserve_user", JSON.stringify(mockUser))
    localStorage.setItem("accessToken", "mock-token")
    localStorage.setItem("refreshToken", "mock-refresh-token")
    
    // Trigger auth context update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userUpdated'))
    }
    
    // Redirect based on role
    router.push(getRedirectPath(role))
    setShowSuperAdminModal(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="h-12 sm:h-13"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="h-12 sm:h-13"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <Link href="#" className="text-sm text-accent hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full h-12 sm:h-14 text-base sm:text-lg mt-6">
            Sign In
          </Button>
        </form>

        <div className="mb-6 pt-6 border-t border-border">
          <Button
            onClick={() => setShowSuperAdminModal(true)}
            variant="outline"
            className="w-full h-12 text-sm font-medium text-primary border-primary/50 hover:border-primary hover:bg-primary/10"
          >
            <ChevronRight size={16} className="mr-2" />
            Sign in as Super Admin (Testing)
          </Button>
        </div>

        {/* Super Admin Modal */}
        {showSuperAdminModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-8 max-w-sm w-full border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-2">Super Admin Testing</h2>
              <p className="text-muted-foreground text-sm mb-6">Select a role to test the platform functionality</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleSuperAdminLogin("customer")}
                  className="w-full p-4 rounded-lg bg-primary/10 border border-primary/50 hover:border-primary hover:bg-primary/20 text-foreground font-medium transition-all text-left"
                >
                  <div className="font-semibold">Customer Role</div>
                  <div className="text-xs text-muted-foreground mt-1">Test booking & tracking features</div>
                </button>

                <button
                  onClick={() => handleSuperAdminLogin("mechanic")}
                  className="w-full p-4 rounded-lg bg-primary/10 border border-primary/50 hover:border-primary hover:bg-primary/20 text-foreground font-medium transition-all text-left"
                >
                  <div className="font-semibold">Mechanic Role</div>
                  <div className="text-xs text-muted-foreground mt-1">Test job management & payouts</div>
                </button>

                <button
                  onClick={() => handleSuperAdminLogin("admin")}
                  className="w-full p-4 rounded-lg bg-primary/10 border border-primary/50 hover:border-primary hover:bg-primary/20 text-foreground font-medium transition-all text-left"
                >
                  <div className="font-semibold">Admin Role</div>
                  <div className="text-xs text-muted-foreground mt-1">Test analytics & management tools</div>
                </button>
              </div>

              <button
                onClick={() => setShowSuperAdminModal(false)}
                className="w-full mt-4 p-3 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm sm:text-base text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-accent hover:underline font-medium">
            Create One
          </Link>
        </p>
      </div>
    </div>
  )
}
