"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface MatchingAnimationProps {
  isSearching: boolean
  message?: string
}

export default function MatchingAnimation({ isSearching, message = "Searching for mechanics..." }: MatchingAnimationProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; scale: number; opacity: number }>>([])

  useEffect(() => {
    if (!isSearching) {
      setRipples([])
      return
    }

    // Create initial ripple
    const addRipple = () => {
      const id = Date.now()
      setRipples((prev) => [...prev, { id, scale: 0, opacity: 1 }])

      // Animate ripple
      const interval = setInterval(() => {
        setRipples((prev) =>
          prev.map((ripple) => {
            if (ripple.id === id) {
              const newScale = ripple.scale + 0.05
              const newOpacity = ripple.opacity - 0.02
              if (newOpacity <= 0) {
                clearInterval(interval)
                return null as any
              }
              return { ...ripple, scale: newScale, opacity: newOpacity }
            }
            return ripple
          }).filter(Boolean)
        )
      }, 16) // ~60fps
    }

    // Add ripple every 1.5 seconds
    addRipple()
    const rippleInterval = setInterval(addRipple, 1500)

    return () => {
      clearInterval(rippleInterval)
    }
  }, [isSearching])

  if (!isSearching) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Central pulsing dot */}
        <div className="absolute w-4 h-4 bg-primary rounded-full animate-pulse z-10"></div>

        {/* Ripple circles */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute w-64 h-64 border-4 border-primary rounded-full"
            style={{
              transform: `scale(${ripple.scale})`,
              opacity: ripple.opacity,
              transition: "transform 0.016s linear, opacity 0.016s linear",
            }}
          />
        ))}

        {/* Message */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-foreground font-semibold text-lg mb-2">{message}</p>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
