"use client"

import { MapComponent } from "@/components/map-component"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { Phone, MessageSquare, AlertCircle, MapPin } from "lucide-react"

interface JobLocation {
  lat: number
  lng: number
  address: string
}

interface MechanicData {
  id: string
  name: string
  rating: number
  specialization: string
  vehicle: string
  plate: string
  currentLat: number
  currentLng: number
}

interface JobData {
  id: string
  jobNumber: string
  customer: {
    name: string
    phone: string
  }
  vehicle: {
    model: string
    color: string
  }
  serviceLocation: JobLocation
  mechanic: MechanicData
  estimatedArrival: number
  status: "arrived" | "in_progress" | "completed"
  elapsedTime: number
}

export default function LiveTrackingPage() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [eta, setEta] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch job data from backend
  const fetchJobData = useCallback(async () => {
    try {
      setIsLoading(true)
      // Backend will integrate here: const response = await fetch("/api/jobs/current")

      // Mock data for frontend preview
      setJobData({
        id: "job-123",
        jobNumber: "1234-AX",
        customer: {
          name: "John Doe",
          phone: "+1-555-0123",
        },
        vehicle: {
          model: "2021 Ford F-150 (Silver)",
          color: "Silver",
        },
        serviceLocation: {
          lat: 37.7749,
          lng: -122.4194,
          address: "123 Market St, San Francisco, CA 94103",
        },
        mechanic: {
          id: "mech-456",
          name: "Alex Johnson",
          rating: 4.9,
          specialization: "Mobile Repair Specialist",
          vehicle: "Silver Ford F-150",
          plate: "BJK-9021",
          currentLat: 37.7755,
          currentLng: -122.418,
        },
        estimatedArrival: 8,
        status: "in_progress",
        elapsedTime: 45,
      })
    } catch (err) {
      console.error("[v0] Error fetching job data:", err)
      setError(err instanceof Error ? err.message : "Failed to load job data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle message action
  const handleMessage = useCallback(async () => {
    if (!jobData) return
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData.id,
          mechanicId: jobData.mechanic.id,
          type: "customer_to_mechanic",
        }),
      })
      if (!response.ok) throw new Error("Failed to initiate message")
      console.log("[v0] Message initiated successfully")
    } catch (err) {
      console.error("[v0] Error initiating message:", err)
      setError("Failed to send message. Please try again.")
    }
  }, [jobData])

  // Handle call action
  const handleCall = useCallback(async () => {
    if (!jobData) return
    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData.id,
          mechanicId: jobData.mechanic.id,
          mechanicPhone: jobData.mechanic.id,
        }),
      })
      if (!response.ok) throw new Error("Failed to initiate call")
      console.log("[v0] Call initiated successfully")
    } catch (err) {
      console.error("[v0] Error initiating call:", err)
      setError("Failed to initiate call. Please try again.")
    }
  }, [jobData])

  // Handle cancel assistance
  const handleCancelAssistance = useCallback(async () => {
    if (!jobData) return
    try {
      const response = await fetch(`/api/jobs/${jobData.id}/cancel`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to cancel assistance")
      console.log("[v0] Assistance cancelled successfully")
      // Redirect to bookings page
      window.location.href = "/dashboard/bookings"
    } catch (err) {
      console.error("[v0] Error cancelling assistance:", err)
      setError("Failed to cancel assistance. Please try again.")
    }
  }, [jobData])

  // Update ETA every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Real-time location updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!jobData) return
      // Backend will replace this with: const response = await fetch(`/api/jobs/${jobData.id}/location`)

      // Simulate movement towards service location
      setJobData((prev) =>
        prev
          ? {
              ...prev,
              mechanic: {
                ...prev.mechanic,
                currentLat: prev.mechanic.currentLat + 0.0001,
                currentLng: prev.mechanic.currentLng - 0.00005,
              },
              estimatedArrival: Math.max(1, prev.estimatedArrival - 1),
            }
          : null,
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [jobData])

  useEffect(() => {
    fetchJobData()
  }, [fetchJobData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (error && !jobData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-foreground font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!jobData) return null

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-primary/20 sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="text-foreground hover:text-primary transition-colors font-heading text-xl"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-foreground font-heading">Job #{jobData.jobNumber}</h1>
          </div>
        </div>
      </div>

      {/* Map Section - Full Width */}
      <div className="flex-1 bg-gray-200 overflow-hidden">
        <MapComponent
          center={{
            lat: jobData.mechanic.currentLat,
            lng: jobData.mechanic.currentLng,
          }}
          zoom={15}
          markers={[
            {
              lat: jobData.serviceLocation.lat,
              lng: jobData.serviceLocation.lng,
              title: "Service Location",
              type: "service",
            },
            {
              lat: jobData.mechanic.currentLat,
              lng: jobData.mechanic.currentLng,
              title: jobData.mechanic.name,
              type: "mechanic",
            },
          ]}
        />
      </div>

      {/* Bottom Dark Green Overlay Section */}
      <div className="bg-background border-t-2 border-primary/20">
        <div className="container-responsive py-6 space-y-6">
          {/* ETA Card */}
          <div className="bg-card rounded-lg p-6 border-2 border-primary">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2 font-heading">
              Estimated Arrival
            </p>
            <h2 className="text-5xl font-bold text-foreground mb-2 font-heading">{eta} mins away</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live Update
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distance: 2.4 miles
            </p>
          </div>

          {/* Mechanic Info Card */}
          <div className="bg-card rounded-lg p-6 border border-primary/10">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-4xl flex-shrink-0 border-4 border-primary">
                👨‍🔧
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground font-heading">{jobData.mechanic.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {jobData.mechanic.vehicle} · {jobData.mechanic.plate}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold font-heading">
                    {jobData.mechanic.rating}★
                  </span>
                  <span className="text-sm text-muted-foreground">{jobData.mechanic.specialization}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleMessage}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-lg transition-all duration-200"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Message
            </Button>
            <Button
              onClick={handleCall}
              className="w-full bg-background hover:bg-background/80 text-foreground border-2 border-primary/20 font-bold text-lg py-6 rounded-lg transition-all duration-200"
            >
              <Phone className="w-5 h-5 mr-3" />
              Call
            </Button>
            <button
              onClick={handleCancelAssistance}
              className="w-full text-muted-foreground text-sm hover:text-destructive transition-colors py-3 font-medium"
            >
              Cancel Assistance
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
