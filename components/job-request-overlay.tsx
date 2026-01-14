"use client"

import { X, MapPin, Clock, Car, CheckCircle } from 'lucide-react'
import { useRealtime } from '@/lib/realtime-context'
import { Button } from '@/components/ui/button'

interface JobRequestOverlayProps {
  job: {
    id: string
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
  }
  onAccept: () => void
  onDecline: () => void
}

export function JobRequestOverlay({ job, onAccept, onDecline }: JobRequestOverlayProps) {
  const urgencyColors = {
    standard: 'border-primary/50 bg-primary/5',
    urgent: 'border-status-warning/50 bg-status-warning/10',
    emergency: 'border-destructive/50 bg-destructive/10'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border-2 border-primary shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">New Job Request</h2>
            <button
              onClick={onDecline}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${urgencyColors[job.urgency]}`}>
            {job.urgency === 'emergency' && '🚨'}
            {job.urgency === 'urgent' && '⚡'}
            <span className="capitalize">{job.urgency}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER</h3>
            <p className="text-lg font-bold text-foreground">{job.customer.name}</p>
            <p className="text-sm text-muted-foreground">{job.customer.phone}</p>
          </div>

          {/* Vehicle */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">VEHICLE</h3>
              <p className="text-lg font-bold text-foreground">
                {job.vehicle.color} {job.vehicle.make} {job.vehicle.model}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-8 h-8 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">LOCATION</h3>
              <p className="text-foreground">{job.location.address}</p>
              <p className="text-sm text-primary font-semibold mt-1">{job.distance.toFixed(1)} miles away</p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">SERVICES REQUESTED</h3>
            <div className="flex flex-wrap gap-2">
              {job.services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Requested {new Date(job.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border space-y-3">
          <Button
            onClick={onAccept}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accept Job
          </Button>
          <Button
            onClick={onDecline}
            variant="outline"
            className="w-full h-12 border-border hover:bg-muted text-foreground"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}
