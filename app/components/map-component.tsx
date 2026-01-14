"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    lat: number
    lng: number
    title: string
    type: "mechanic" | "customer" | "service"
  }>
}

export function MapComponent({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 13,
  markers = [],
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Map placeholder - in production, integrate google-map-react
    const createPlaceholder = () => {
      mapRef.current.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f1419 0%, #1a2530 100%); border-radius: 0.75rem; position: relative;">
          <div style="position: absolute; inset: 0; opacity: 0.1;">
            <svg width="100%" height="100%" style="position: absolute;">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div style="text-align: center; z-index: 1; color: #9ca3af;">
            <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
            <p style="font-size: 14px; margin: 0;">
              San Francisco, CA<br/>
              Lat: ${center.lat}, Lng: ${center.lng}
            </p>
            <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0;">
              ${markers.length} location marker${markers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      `
    }

    createPlaceholder()
  }, [center, markers])

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}
