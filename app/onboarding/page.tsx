"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type UserRole = "customer" | "mechanic" | null

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 md:px-8 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary"></div>
            <div className="w-8 sm:w-12 h-1 bg-muted rounded-full"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-muted"></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            How would you like to use AutoServe?
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Select the role that fits you best to get started.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Customer Card */}
          <button
            onClick={() => setSelectedRole("customer")}
            className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
              selectedRole === "customer"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m7.528-4.528a9 9 0 11-12.656 0M9 10a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </div>
              {selectedRole === "customer" && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">I am a Customer</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Find trusted mechanics, track repairs, and manage your vehicle history in one place.
            </p>
          </button>

          {/* Mechanic Card */}
          <button
            onClick={() => setSelectedRole("mechanic")}
            className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
              selectedRole === "mechanic"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              {selectedRole === "mechanic" && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">I am a Mechanic</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Grow your business, manage service requests, and communicate with local customers.
            </p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="w-full h-12 sm:h-14 text-base sm:text-lg bg-transparent"
            disabled={!selectedRole}
            asChild
          >
            <Link href={selectedRole === "customer" ? "/onboarding/customer" : "/onboarding/mechanic"}>Continue</Link>
          </Button>
        </div>

        <p className="text-center text-sm sm:text-base text-muted-foreground mt-6 sm:mt-8">
          By continuing, you agree to our{" "}
          <Link href="#" className="text-accent hover:underline">
            Service Terms
          </Link>
        </p>
      </div>
    </div>
  )
}
