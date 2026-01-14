"use client"

import { useState } from "react"
import { MessageCircle, Phone, ChevronLeft, Plus, Minus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MechanicTrackingPage() {
  const [zoom, setZoom] = useState(12)

  const mechanic = {
    name: "Alex Johnson",
    title: "Mobile Repair Specialist",
    vehicle: "Silver Ford F-150 • BJK-9021",
    rating: 4.9,
    eta: "8 mins away",
    distance: "2.4 miles",
    isLive: true,
  }

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-122.4194,37.7749,12,0,0/600x800@2x?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0.EXAMPLE")',
          filter: "brightness(0.85)",
        }}
      >
        {/* Placeholder map with text */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-300 to-slate-200">
          <div className="text-center text-slate-600">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">Loading Map...</p>
          </div>
        </div>

        {/* Mechanic Location Marker */}
        <div className="absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-8 h-8 bg-foreground rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
              </svg>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-nowrap bg-black text-white text-xs font-bold px-3 py-1 rounded mb-2">
              ALEX ARRIVING
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
          <button
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-foreground hover:bg-gray-100"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-foreground hover:bg-gray-100"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Header - Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-foreground hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Sheet - Mechanic Info */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-8">
        <div className="px-4 sm:px-6 pb-6 max-w-2xl mx-auto space-y-6">
          {/* ETA Card */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white text-center">
            <p className="text-sm font-semibold uppercase mb-2">Estimated Arrival</p>
            <p className="text-5xl font-bold mb-2">{mechanic.eta}</p>
            <p className="text-sm opacity-90">
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
              Live Update · Distance: {mechanic.distance}
            </p>
          </div>

          {/* Mechanic Card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-lg">{mechanic.name}</p>
                <p className="text-sm text-muted-foreground">{mechanic.vehicle}</p>
              </div>
              <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full flex-shrink-0">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-bold text-foreground">{mechanic.rating}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold">
              <MessageCircle className="w-5 h-5 mr-2" />
              Message
            </Button>
            <Button className="bg-card border border-border text-foreground hover:bg-card/80 h-12 rounded-xl font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              Call
            </Button>
          </div>

          {/* Cancel Link */}
          <button className="w-full text-center py-2 text-muted-foreground hover:text-foreground font-semibold">
            Cancel Assistance
          </button>
        </div>
      </div>
    </div>
  )
}
