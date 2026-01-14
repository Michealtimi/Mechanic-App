"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Search, Zap } from "lucide-react"

const SERVICES = [
  {
    id: 1,
    name: "Oil Change",
    description: "Full synthetic oil & filter",
    price: 59.99,
    duration: "45 mins",
    enabled: true,
  },
  {
    id: 2,
    name: "Brake Pad Replacement",
    description: "Front and rear inspection",
    price: 120.0,
    duration: "60 mins",
    enabled: true,
  },
  {
    id: 3,
    name: "Tire Rotation",
    description: "Seasonal tire swap & balance",
    price: 45.0,
    duration: "20 mins",
    enabled: false,
  },
  {
    id: 4,
    name: "Engine Diagnostics",
    description: "Comprehensive OBD-II scan",
    price: 85.0,
    duration: "30 mins",
    enabled: true,
  },
]

export default function ServicesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = SERVICES.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4 flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground">←</button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">Services</h1>
          <button className="text-primary hover:bg-primary/10 rounded-full p-2">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="container-responsive pt-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="container-responsive space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-base sm:text-lg">Available Services</h2>
          <a href="#" className="text-primary text-xs sm:text-sm hover:underline">
            Drag to reorder
          </a>
        </div>

        {filtered.map((service) => (
          <Card
            key={service.id}
            className="p-4 sm:p-6 flex items-start justify-between hover:bg-card/80 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">{service.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{service.description}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                ${service.price.toFixed(2)} • {service.duration}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center transition-colors ${
                  service.enabled
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {service.enabled ? "✓" : ""}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Limited Offer Banner */}
      <div className="container-responsive mt-8">
        <Card className="p-6 sm:p-8 bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-xs sm:text-sm font-semibold uppercase">Limited Offer</p>
              <h3 className="text-foreground font-bold text-base sm:text-lg mt-2">Free VIN Check</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                Unlock your vehicle's history instantly with our detailed report.
              </p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm">
                Check Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
