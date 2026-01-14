"use client"

import { X, MapPin, Clock, DollarSign } from "lucide-react"

export default function JobRequestModal({ onClose }: { onClose: () => void }) {
  const handleAcceptJob = () => {
    // Navigate to live tracking
    window.location.href = "/dashboard/live-tracking"
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 max-w-md w-full space-y-6 border-2 border-primary shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Mechanic Found!</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mechanic Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl">
                👨‍🔧
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Mike's Wheels</h3>
                <p className="text-sm text-muted-foreground">Mobile Repair Specialist</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-primary">★★★★★</span>
                  <span className="text-xs text-muted-foreground">(234 reviews)</span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-3 bg-sidebar-border rounded-lg p-4">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-foreground">2.3 miles away</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-foreground">ETA: 8 minutes</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-foreground">Estimated: $85-120</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-primary/30 text-foreground hover:text-foreground hover:bg-sidebar-border transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptJob}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              Accept Request
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
