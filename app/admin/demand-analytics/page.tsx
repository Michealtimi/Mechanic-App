"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

export default function DemandAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [selectedZone, setSelectedZone] = useState(0)

  const zones = [
    { id: "SF-DOWNTOWN", name: "Downtown SF", demand: 1240, change: "+18.5%", avgWait: "8 mins", requests: 892 },
    { id: "SF-MISSION", name: "Mission District", demand: 856, change: "+12.3%", avgWait: "12 mins", requests: 634 },
    { id: "SF-MARINA", name: "Marina & Presidio", demand: 642, change: "+5.2%", avgWait: "15 mins", requests: 478 },
    { id: "SF-SUNSET", name: "Sunset & Outer", demand: 528, change: "-2.1%", avgWait: "18 mins", requests: 412 },
    { id: "OAK-CENTER", name: "Oakland Center", demand: 456, change: "+8.4%", avgWait: "10 mins", requests: 356 },
  ]

  const current = zones[selectedZone]

  // Heatmap intensity (0-100)
  const heatmapData = [
    { x: 35, y: 25, intensity: 95, zone: "Downtown" },
    { x: 32, y: 35, intensity: 85, zone: "Mission" },
    { x: 38, y: 42, intensity: 65, zone: "Marina" },
    { x: 28, y: 48, intensity: 52, zone: "Sunset" },
    { x: 42, y: 60, intensity: 45, zone: "Oakland" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container-responsive pt-4 pb-4 sm:pt-6 sm:pb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Demand Analytics</h1>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 flex-wrap">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-responsive py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 h-80 sm:h-96 flex items-center justify-center relative overflow-hidden">
              {/* Heatmap SVG */}
              <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                {/* Map Background */}
                <rect width="800" height="600" fill="var(--background)" />

                {/* City Streets */}
                <line x1="200" y1="0" x2="200" y2="600" stroke="var(--border)" strokeWidth="2" opacity="0.3" />
                <line x1="400" y1="0" x2="400" y2="600" stroke="var(--border)" strokeWidth="2" opacity="0.3" />
                <line x1="0" y1="200" x2="800" y2="200" stroke="var(--border)" strokeWidth="2" opacity="0.3" />
                <line x1="0" y1="400" x2="800" y2="400" stroke="var(--border)" strokeWidth="2" opacity="0.3" />

                {/* Heatmap Points */}
                {heatmapData.map((point, idx) => {
                  const scaledX = (point.x / 100) * 800
                  const scaledY = (point.y / 100) * 600
                  const intensity = point.intensity
                  const opacity = intensity / 100

                  // Color gradient: green (low) to cyan (high)
                  const color = intensity > 80 ? "#00ff88" : intensity > 60 ? "#10b981" : "#0891b2"

                  return (
                    <g key={idx}>
                      {/* Heatmap glow */}
                      <circle cx={scaledX} cy={scaledY} r={80} fill={color} opacity={opacity * 0.15} />
                      {/* Heatmap point */}
                      <circle
                        cx={scaledX}
                        cy={scaledY}
                        r={12}
                        fill={color}
                        opacity={opacity}
                        className={`cursor-pointer transition-all hover:r-16 ${selectedZone === idx ? "stroke-primary stroke-2" : ""}`}
                        onClick={() => setSelectedZone(idx)}
                      />
                      {/* Zone label */}
                      <text
                        x={scaledX}
                        y={scaledY - 25}
                        textAnchor="middle"
                        fill="var(--foreground)"
                        fontSize="12"
                        fontWeight="600"
                        opacity="0.8"
                      >
                        {point.zone}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex gap-3 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-error" />
                  <span className="text-xs text-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-success" />
                  <span className="text-xs text-foreground">Low</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Zone Details Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 sm:p-6 border-2 border-primary">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">{current.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{current.id}</p>
                </div>
                <Badge className="text-primary-foreground bg-primary text-xs">Active</Badge>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Demand</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{current.demand}</p>
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded ${current.change.startsWith("+") ? "text-status-success bg-status-success/10" : "text-destructive bg-destructive/10"}`}
                  >
                    {current.change}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Average Wait Time</span>
                    <span className="font-semibold text-foreground">{current.avgWait}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Service Requests</span>
                    <span className="font-semibold text-foreground">{current.requests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Available Mechanics</span>
                    <span className="font-semibold text-foreground">24</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* All Zones */}
            <Card className="p-4 sm:p-6">
              <h4 className="font-semibold text-foreground mb-3">All Service Zones</h4>
              <div className="space-y-2">
                {zones.map((zone, idx) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(idx)}
                    className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all border ${
                      selectedZone === idx ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">{zone.demand} requests</p>
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap text-primary">{zone.change}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Peak Hours */}
            <Card className="p-4 sm:p-6">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Peak Hours
              </h4>
              <div className="space-y-2">
                {[
                  { hour: "12 PM - 2 PM", usage: 92 },
                  { hour: "5 PM - 7 PM", usage: 88 },
                  { hour: "9 AM - 11 AM", usage: 75 },
                ].map((peak, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">{peak.hour}</span>
                      <span className="font-semibold text-foreground">{peak.usage}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${peak.usage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
