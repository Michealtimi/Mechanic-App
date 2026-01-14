"use client"

import type React from "react"
import { X, MapPin, Clock, DollarSign, Car, User, CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRealtime } from "@/lib/realtime-context"
import { useState, useEffect } from "react"

interface JobRequest {
  id: string
  dispatchId: string
  bookingId: string
  customer: {
    name: string
    phone: string
  }
  vehicle: {
    make: string
    model: string
    color: string
  }
  location: {
    lat: number
    lng: number
    address: string
  }
  distance: number
  services: string[]
  urgency: 'standard' | 'urgent' | 'emergency'
  createdAt: string
  eta?: number
}

interface MechanicJobPopupProps {
  job: JobRequest
  onAccept: (dispatchId: string) => void
  onReject: (dispatchId: string) => void
  onClose: () => void
}

export default function MechanicJobPopup({ job, onAccept, onReject, onClose }: MechanicJobPopupProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      await onAccept(job.dispatchId)
      // Navigate to job details
      router.push(`/mechanic/job/${job.bookingId}`)
    } catch (error) {
      console.error("Error accepting job:", error)
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(job.dispatchId)
      onClose()
    } catch (error) {
      console.error("Error rejecting job:", error)
      setIsProcessing(false)
    }
  }

  const urgencyColors = {
    standard: "bg-primary/20 text-primary border-primary/30",
    urgent: "bg-status-warning/20 text-status-warning border-status-warning/30",
    emergency: "bg-destructive/20 text-destructive border-destructive/30",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card rounded-2xl p-6 max-w-md w-full space-y-6 border-2 border-primary shadow-xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">New Job Request</h2>
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold border ${urgencyColors[job.urgency]}`}>
              {job.urgency.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{job.customer.name}</h3>
              <p className="text-sm text-muted-foreground">{job.customer.phone}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-3 p-3 bg-sidebar-border rounded-lg">
            <Car className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {job.vehicle.make} {job.vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground">{job.vehicle.color}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-3 bg-sidebar-border rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-foreground">{job.location.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-foreground">{job.distance.toFixed(1)} miles away</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-foreground">ETA: {job.eta || Math.round(job.distance * 2)} minutes</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Services Requested:</h4>
            <div className="flex flex-wrap gap-2">
              {job.services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm border border-primary/30"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-lg border border-border text-foreground hover:bg-sidebar-border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Accept Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook component that listens for job requests and shows popups
 */
export function MechanicJobListener() {
  const { pendingJobs, acceptJob } = useRealtime()
  const [currentJob, setCurrentJob] = useState<typeof pendingJobs[0] | null>(null)

  useEffect(() => {
    // Show popup for most recent job request
    if (pendingJobs.length > 0 && !currentJob) {
      setCurrentJob(pendingJobs[0])
    }
  }, [pendingJobs, currentJob])

  const handleAccept = async (dispatchId: string) => {
    await acceptJob(dispatchId)
    setCurrentJob(null)
  }

  const handleReject = async (dispatchId: string) => {
    // TODO: Implement reject API call
    setCurrentJob(null)
  }

  const handleClose = () => {
    setCurrentJob(null)
  }

  if (!currentJob) return null

  return (
    <MechanicJobPopup
      job={currentJob}
      onAccept={handleAccept}
      onReject={handleReject}
      onClose={handleClose}
    />
  )
}
