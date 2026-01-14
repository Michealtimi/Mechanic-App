"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthProvider } from "@/lib/auth-context"

export default function NotFound() {
  return (
    // The root not-found page doesn't inherit providers from the root layout,
    // so we must wrap it manually to prevent build errors with `useAuth`.
    <AuthProvider>
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">Sorry, we couldn’t find the page you’re looking for.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </AuthProvider>
  )
}