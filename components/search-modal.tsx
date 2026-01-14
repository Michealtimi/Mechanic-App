"use client"

import { Search, MapPin, X, Wrench } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRealtime } from "@/lib/realtime-context"
import JobMatchingFlow from "./job-matching-flow"

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [location, setLocation] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showMatching, setShowMatching] = useState(false)
  const router = useRouter()
  const { searchForMechanic } = useRealtime()

  const availableServices = [
    "Brake Service",
    "Oil Change",
    "Tire Rotation",
    "Battery Replacement",
    "AC Service",
    "Engine Diagnostic",
  ]

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  const handleSearch = async () => {
    if (!location.trim() || selectedServices.length === 0) {
      return
    }

    // Get user's current location (mock for now, should use geolocation API)
    const mockLocation = {
      lat: 37.7749,
      lng: -122.4194,
      address: location,
    }

    // Start matching flow
    setShowMatching(true)

    // Trigger real-time search
    await searchForMechanic({
      services: selectedServices,
      location: mockLocation,
      urgency: 'standard',
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
        <div className="bg-card w-full md:w-96 rounded-t-3xl md:rounded-2xl p-6 space-y-6 border border-primary/20 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Find a Mechanic</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Services Needed</label>
              <div className="grid grid-cols-2 gap-2">
                {availableServices.map((service) => (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`p-2 rounded-lg border-2 text-sm transition-all ${
                      selectedServices.includes(service)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <Wrench className="w-4 h-4 inline mr-1" />
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!location.trim() || selectedServices.length === 0}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              Search Mechanics
            </button>
          </div>
        </div>
      </div>

      {/* Job Matching Flow */}
      {showMatching && (
        <JobMatchingFlow
          searchData={{
            services: selectedServices,
            location: {
              lat: 37.7749,
              lng: -122.4194,
              address: location,
            },
            urgency: 'standard',
          }}
          onMatchFound={(jobId) => {
            // Redirect to live tracking when match is found
            router.push(`/dashboard/live-tracking?jobId=${jobId}`)
          }}
          onCancel={() => {
            setShowMatching(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
