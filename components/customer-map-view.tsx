"use client"

import type React from "react"
import { MapPin, Search, Bell } from "lucide-react"
import { useState } from "react"
import SearchModal from "./search-modal"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function CustomerMapView({ children }: { children?: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false)
  const { user } = useAuth()

  return (
    <div className="w-full h-screen bg-background flex flex-col relative">
      {/* Map Area (Full Screen) */}
      <div className="flex-1 relative">
        {/* Static map placeholder - Replace with actual map component */}
        <div className="w-full h-full bg-gradient-to-br from-sidebar-border to-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Map view - Full screen</p>
            <p className="text-xs mt-2 text-muted-foreground/70">Interactive map will be displayed here</p>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-40">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full px-6 py-3 rounded-full bg-card shadow-lg flex items-center gap-3 hover:shadow-xl transition-shadow border border-border"
          >
            <Search className="w-5 h-5 text-card-foreground" />
            <span className="text-muted-foreground flex-1 text-left">Where do you need service?</span>
          </button>
        </div>

        {/* Top Right Icons */}
        <div className="absolute top-4 right-4 z-40 flex gap-3">
          <button className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-card/80 transition-colors shadow-lg">
            <Bell className="w-6 h-6" />
          </button>
          <Link
            href="/dashboard/bookings"
            className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-card/80 transition-colors shadow-lg text-lg"
          >
            ⚙️
          </Link>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden bg-card border-t border-border flex justify-around py-3 shadow-lg">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-xs text-foreground hover:text-primary transition-colors">
          <span className="text-xl">🏠</span>
          <span>Home</span>
        </Link>
        <Link
          href="/dashboard/bookings"
          className="flex flex-col items-center gap-1 text-xs text-foreground hover:text-primary transition-colors"
        >
          <span className="text-xl">📅</span>
          <span>Bookings</span>
        </Link>
        <Link
          href="/dashboard/wallet"
          className="flex flex-col items-center gap-1 text-xs text-foreground hover:text-primary transition-colors"
        >
          <span className="text-xl">💳</span>
          <span>Wallet</span>
        </Link>
        <Link
          href="/dashboard/garage"
          className="flex flex-col items-center gap-1 text-xs text-foreground hover:text-primary transition-colors"
        >
          <span className="text-xl">🚗</span>
          <span>Garage</span>
        </Link>
      </div>

      {/* Render children if provided (for overlays, modals, etc.) */}
      {children}
    </div>
  )
}
