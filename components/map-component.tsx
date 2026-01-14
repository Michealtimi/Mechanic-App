"use client"

import { useEffect, useRef, useState } from "react"

interface MapMarker {
  lat: number
  lng: number
  title: string
  type: "service" | "mechanic" | "location"
}

interface MapComponentProps {
  center: { lat: number; lng: number }
  zoom: number
  markers?: MapMarker[]
  onMapLoad?: () => void
  className?: string
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: any
        Marker: any
        InfoWindow: any
      }
    }
  }
}

export function MapComponent({ center, zoom, markers = [], onMapLoad, className = "" }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Load Google Maps script from API route (secure server-side key handling)
  useEffect(() => {
    // For now, displaying placeholder until backend API route is ready
    if (typeof window.google !== "undefined") {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "/api/maps-script"
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      console.warn("[v0] Google Maps API key not configured - showing placeholder map")
      setIsScriptLoaded(false)
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // Initialize map once script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !mapContainer.current || !window.google) return

    try {
      map.current = new window.google.maps.Map(mapContainer.current, {
        center: center,
        zoom: zoom,
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
        ],
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })
      onMapLoad?.()
    } catch (error) {
      console.error("[v0] Error initializing map:", error)
    }
  }, [isScriptLoaded, center, zoom, onMapLoad])

  // Update map center and zoom
  useEffect(() => {
    if (map.current) {
      map.current.setCenter(center)
      map.current.setZoom(zoom)
    }
  }, [center, zoom])

  // Handle markers
  useEffect(() => {
    if (!map.current || !isScriptLoaded || markers.length === 0) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    markers.forEach((markerData) => {
      try {
        const marker = new window.google!.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map.current,
          title: markerData.title,
          icon: getMarkerIcon(markerData.type),
        })

        const infoWindow = new window.google!.maps.InfoWindow({
          content: `<div style="color: #000; padding: 8px; font-family: Inter, sans-serif;"><strong>${markerData.title}</strong></div>`,
        })

        marker.addListener("click", () => {
          infoWindow.open(map.current, marker)
        })

        markersRef.current.push(marker)
      } catch (error) {
        console.error("[v0] Error adding marker:", error)
      }
    })
  }, [markers, isScriptLoaded])

  function getMarkerIcon(type: string): string {
    const baseUrl = "https://maps.google.com/mapfiles/ms/icons"
    switch (type) {
      case "mechanic":
        return `${baseUrl}/blue-dot.png`
      case "service":
        return `${baseUrl}/green-dot.png`
      default:
        return `${baseUrl}/red-dot.png`
    }
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      style={{ minHeight: "300px" }}
    >
      {!isScriptLoaded && (
        <div className="text-center">
          <p className="text-gray-600 font-medium">Map placeholder</p>
          <p className="text-sm text-gray-500 mt-2">Add GOOGLE_MAPS_API_KEY to Vars to enable</p>
        </div>
      )}
    </div>
  )
}
