"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Wrench, AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [healthScore] = useState(98)
  const [availableCredit] = useState(520)
  const [bookings] = useState(2)

  // This page is now wrapped by CustomerMapView in the layout
  // Return null or a minimal overlay component
  return null
      <div className="bg-background border-b border-sidebar-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Welcome back,
              </h2>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Alex Rivera</h1>
            </div>
            <button className="relative w-10 h-10 rounded-lg bg-sidebar-border hover:bg-sidebar-border/80 transition-colors flex items-center justify-center border border-primary/30">
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              <span className="text-lg">🔔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-sidebar-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle Health</p>
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{healthScore}%</span>
              <p className="text-xs text-muted-foreground mt-1">Healthy</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-sidebar-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Bookings</p>
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{bookings}</span>
              <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-sidebar-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Credit</p>
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">${availableCredit}</span>
              <p className="text-xs text-muted-foreground mt-1">Balance</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-sidebar-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loyalty Points</p>
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">240</span>
              <p className="text-xs text-muted-foreground mt-1">Points</p>
            </div>
          </div>
        </div>

        {/* Vehicle Health Card */}
        <div className="bg-card/40 backdrop-blur-sm rounded-lg p-6 sm:p-8 border border-sidebar-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Vehicle Health</h3>
              <p className="text-sm text-muted-foreground mt-2">2022 Tesla Model 3 (Blue)</p>
            </div>
            <Link href="/dashboard/garage" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
              View All Vehicles →
            </Link>
          </div>

          <div className="flex flex-col items-center py-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-sidebar-border"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${(healthScore / 100) * 345.575} 345.575`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-bold text-foreground">{healthScore}%</p>
                <p className="text-sm text-muted-foreground mt-1">Healthy</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-10 w-full">
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">Range</p>
                <p className="text-3xl font-bold text-foreground mt-3">284 mi</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">Odometer</p>
                <p className="text-3xl font-bold text-foreground mt-3">12,450</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/dashboard/services")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-lg font-semibold flex items-center justify-center gap-3 text-base transition-colors"
          >
            <Wrench className="w-5 h-5" />
            Schedule Service
          </button>
          <button className="border-2 border-destructive/50 text-destructive hover:bg-destructive/10 h-14 rounded-lg font-semibold flex items-center justify-center gap-3 text-base bg-transparent transition-colors">
            <AlertCircle className="w-5 h-5" />
            Emergency SOS
          </button>
        </div>

        {/* Active Service Card */}
        <div className="bg-card/40 backdrop-blur-sm rounded-lg p-8 border border-sidebar-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Active Service</h3>
            <Link href="/dashboard/bookings" className="text-primary text-sm hover:text-primary/80 font-medium transition-colors">
              View all →
            </Link>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground text-lg">Brake Pad Replacement</h4>
                  <span className="text-sm font-semibold text-primary">65%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Technician: Mike Ross • Est. 45 mins</p>
                <div className="w-full bg-sidebar-border rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: "65%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Rewards Card */}
        <div className="bg-card/40 backdrop-blur-sm rounded-lg p-8 border-2 border-primary/30 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Loyalty Rewards</h3>
              <p className="text-sm text-muted-foreground mt-2">Earn points on every service</p>
            </div>
            <TrendingUp className="w-7 h-7 text-primary flex-shrink-0" />
          </div>
          <div>
            <span className="text-4xl font-bold text-primary">240</span>
            <span className="text-sm text-muted-foreground ml-3">points available</span>
          </div>
          <button className="w-full text-primary hover:bg-primary/10 text-base font-semibold mt-4 py-3 rounded-lg transition-colors">
            Redeem Rewards →
          </button>
        </div>
      </div>
    </div>
  )
}
