"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeTerms: false,
  })
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agreeTerms) {
      setError("Please agree to Terms and Conditions")
      return
    }
    // TODO: Implement signup logic
    console.log("Sign up:", formData)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Join our community and start your journey today</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6 sm:mb-8">
          <Button variant="outline" className="w-full h-12 sm:h-14 text-base sm:text-lg bg-transparent">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.55-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 sm:h-14 text-base sm:text-lg bg-black text-white hover:bg-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 13.5c0-1.03-.5-1.95-1.28-2.52.08-.5.31-1.55.31-1.55h-3.5c0 0-.23 1.05-.3 1.55-.78.57-1.28 1.49-1.28 2.52 0 1.87 1.34 3.43 3.14 3.43s3.14-1.56 3.14-3.43zm-6.28-4.07c0-1.18.96-2.14 2.14-2.14 1.18 0 2.14.96 2.14 2.14 0 1.18-.96 2.14-2.14 2.14-1.18 0-2.14-.96-2.14-2.14z" />
              <path d="M20.5 2H3.5C2.12 2 1 3.12 1 4.5v15C1 20.88 2.12 22 3.5 22h17c1.38 0 2.5-1.12 2.5-2.5v-15C23 3.12 21.88 2 20.5 2zm-5.5 16.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" />
            </svg>
            Continue with Apple
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">OR EMAIL</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <Input
              type="text"
              name="fullName"
              placeholder="Enter your name"
              value={formData.fullName}
              onChange={handleChange}
              className="h-12 sm:h-13 bg-input text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="h-12 sm:h-13 bg-input text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="h-12 sm:h-13 bg-input text-foreground"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <Checkbox id="terms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} />
            <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
              I agree to the{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Terms and Conditions
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 sm:h-14 text-base sm:text-lg mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm sm:text-base text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
