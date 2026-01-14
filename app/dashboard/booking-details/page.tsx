"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, DollarSign, PenTool as Tool } from "lucide-react"
import { useState } from "react"

export default function BookingDetailsPage() {
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Dark Green with White Text */}
      <div className="bg-background border-b border-primary/20 sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-foreground hover:text-primary transition-colors">←</button>
            <h1 className="text-2xl font-bold text-foreground">Job #1234-AX</h1>
          </div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
        </div>
      </div>

      <div className="container-responsive py-6 space-y-6">
        {/* Elapsed Time Card - White with Cyan Border */}
        <div className="bg-white rounded-lg p-6 border-2 border-primary">
          <p className="text-primary text-sm font-bold uppercase tracking-wider mb-2">⏱ Elapsed Time</p>
          <h2 className="text-5xl font-bold text-foreground">00:45:12</h2>
        </div>

        {/* Map Placeholder - White Card */}
        <div className="bg-white rounded-lg overflow-hidden border border-primary/10 h-80">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
            <div className="text-center">
              <div className="text-6xl mb-3">🗺️</div>
              <p className="text-sm text-muted-foreground">Map View - Service Location</p>
            </div>
          </div>
        </div>

        {/* Service Status - White Card with Cyan Button */}
        <div className="bg-white rounded-lg p-6 border border-primary/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary text-sm font-bold uppercase tracking-wider mb-1">Customer</p>
              <h3 className="text-2xl font-bold text-foreground">John Doe</h3>
            </div>
            <div className="text-right">
              <p className="text-primary text-sm font-bold uppercase tracking-wider mb-1">Plate</p>
              <p className="text-2xl font-bold text-foreground border-2 border-primary/20 px-4 py-2 rounded-lg">
                TX-9982
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-xl">🚗</span>
            <p className="font-semibold">2021 Ford F-150 (Silver)</p>
          </div>
        </div>

        {/* Service Progress - White Cards */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✓</span>
              </div>
              <p className="font-semibold text-foreground text-lg">ARRIVED</p>
            </div>
          </div>

          <div className="bg-primary rounded-lg p-6 border-2 border-primary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center flex-shrink-0">
                <span className="text-lg">▶</span>
              </div>
              <p className="font-bold text-primary-foreground text-xl">IN PROGRESS</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✓</span>
              </div>
              <p className="font-semibold text-foreground text-lg">COMPLETE JOB</p>
            </div>
          </div>
        </div>

        {/* Service Details - White Card */}
        <div className="bg-white rounded-lg p-6 border border-primary/10 space-y-4">
          <h3 className="font-bold text-foreground text-lg">Service Details</h3>

          <div className="space-y-3 border-t border-primary/10 pt-4">
            <div className="flex items-start gap-3">
              <Tool className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-semibold text-foreground">Full Service Oil Change</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">45 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Cost</p>
                <p className="font-semibold text-foreground">$125.00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technician Info - White Card */}
        <div className="bg-white rounded-lg p-6 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-3xl flex-shrink-0 border-2 border-primary">
              👨‍🔧
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">Marcus Rivera</h3>
              <p className="text-sm text-muted-foreground">Senior Master Technician</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-bold text-foreground">⭐ 4.9</span>
                <span className="text-sm text-muted-foreground">(127 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions - Dark Green Background */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary/20">
        <div className="container-responsive py-4 space-y-3">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-lg">
            <MessageSquare className="w-5 h-5 mr-3" />
            Chat with Technician
          </Button>
          <Button className="w-full bg-background hover:bg-background/80 text-foreground border-2 border-primary/20 font-semibold text-base py-3 rounded-lg">
            Report Issue
          </Button>
        </div>
      </div>
    </div>
  )
}
