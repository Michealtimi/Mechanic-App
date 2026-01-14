"use client"

import { type ReactNode, createContext, useContext } from "react"

interface MapContextType {
  apiKey?: string
  defaultCenter: { lat: number; lng: number }
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  return (
    <MapContext.Provider value={{ defaultCenter: { lat: 37.7749, lng: -122.4194 } }}>{children}</MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within MapProvider")
  }
  return context
}
