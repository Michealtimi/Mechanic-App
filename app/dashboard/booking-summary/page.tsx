"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Edit2 } from "lucide-react"

export default function BookingSummaryPage() {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4 flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground">←</button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">Review Your Booking</h1>
          <button className="text-muted-foreground hover:text-foreground">
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="container-responsive py-6 space-y-6">
        {/* Vehicle Details */}
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase mb-3">Vehicle Details</h2>
          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-2xl sm:text-4xl">
                🚗
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">2021 Toyota RAV4</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">License: ABC-1234</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Oct 24, 2023 • 10:30 AM</p>
              </div>
              <button className="text-accent hover:bg-accent/10 p-2 rounded flex-shrink-0">
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </Card>
        </div>

        {/* Service Location */}
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase mb-3">Service Location</h2>
          <Card className="p-0 overflow-hidden rounded-lg h-56 sm:h-64">
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl mb-2">🗺️</div>
                <p className="text-sm text-muted-foreground">Map View</p>
              </div>
            </div>
          </Card>
          <div className="mt-3 flex items-start gap-3">
            <span className="text-xl text-accent mt-1">📍</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">Home Service</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">123 Market St, San Francisco, CA 94103</p>
            </div>
          </div>
        </div>

        {/* Items & Costs */}
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase mb-3">Items & Costs</h2>
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3">
              {[
                { name: "Full Synthetic Oil Change", desc: "Premium 0W-20 & Filter", price: 89.99 },
                { name: "Brake Fluid Flush", desc: "DOT 4 Fluid included", price: 120.0 },
                { name: "Tire Rotation", desc: "Safety inspection included", price: 45.0 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs sm:text-sm gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-muted-foreground text-xs">{item.desc}</p>
                  </div>
                  <p className="font-semibold text-foreground flex-shrink-0">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">$254.99</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="text-foreground font-medium">$9.99</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Estimated Taxes</span>
                <span className="text-foreground font-medium">$10.25</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold text-foreground text-sm sm:text-base">Total Estimated Cost</span>
                <span className="text-accent font-bold text-lg sm:text-xl">$275.23</span>
              </div>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground mt-3">Final price may vary based on actual parts required.</p>
        </div>

        {/* Security Notice */}
        <Card className="p-4 sm:p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary text-lg sm:text-xl">🔒</span>
            <p className="font-semibold text-foreground text-sm sm:text-base">256-BIT SSL SECURE ENCRYPTION</p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your payment data is encrypted and never stored on our servers.
          </p>
        </Card>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container-responsive py-3 sm:py-4">
          <p className="text-xs text-muted-foreground text-center mb-3">
            By clicking confirm, you agree to our Service Terms and authorize the search for a qualified technician in
            your area.
          </p>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base h-12 sm:h-14">
            🔒 Confirm & Find Mechanic
          </Button>
        </div>
      </div>
    </div>
  )
}
