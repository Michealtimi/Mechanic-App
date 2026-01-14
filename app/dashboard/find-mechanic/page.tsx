"use client"
import { useState } from "react"
import { Star, MapPin, Zap, Clock, ChevronLeft } from "lucide-react"
import Link from "next/link"

const MECHANICS = [
  {
    id: 1,
    name: "Marcus Rivera",
    title: "Senior Master Technician",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 127,
    specialty: "EV Specialist",
    certifications: ["Tesla Tier 3", "High Voltage Safety"],
    hourlyRate: 85,
    available: true,
    avatar: "👨‍🔧",
  },
  {
    id: 2,
    name: "James Patterson",
    title: "General Mechanic",
    location: "San Francisco, CA",
    rating: 4.6,
    reviews: 89,
    specialty: "Routine Maintenance",
    certifications: ["ASE Certified"],
    hourlyRate: 65,
    available: true,
    avatar: "👨‍💼",
  },
  {
    id: 3,
    name: "Sarah Chen",
    title: "Diagnostic Specialist",
    location: "Oakland, CA",
    rating: 4.8,
    reviews: 156,
    specialty: "Engine Diagnostics",
    certifications: ["OBD-II", "Hybrid Systems"],
    hourlyRate: 95,
    available: false,
    avatar: "👩‍🔧",
  },
]

export default function FindMechanicPage() {
  const [selectedMechanic, setSelectedMechanic] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-sidebar-border transition-colors text-primary hover:text-primary/80"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">Find a Mechanic</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {["All", "EV Specialist", "Emergency", "Routine"].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-border hover:border-primary text-xs sm:text-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Mechanics List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {MECHANICS.map((mechanic) => (
          <div
            key={mechanic.id}
            className={`p-4 sm:p-6 rounded-lg transition-all border-2 cursor-pointer ${
              selectedMechanic === mechanic.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
            onClick={() => setSelectedMechanic(mechanic.id)}
          >
            <div className="flex gap-4 sm:gap-6 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-sidebar-border flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                {mechanic.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{mechanic.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{mechanic.title}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-primary text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">{mechanic.rating}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">({mechanic.reviews})</span>
                </div>
              </div>
              {mechanic.available && <div className="flex-shrink-0 w-3 h-3 rounded-full bg-status-success"></div>}
            </div>

            <div className="space-y-2 text-xs sm:text-sm mb-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {mechanic.location}
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {mechanic.specialty}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />${mechanic.hourlyRate}/hour
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {mechanic.certifications.map((cert) => (
                <span
                  key={cert}
                  className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/40"
                >
                  {cert}
                </span>
              ))}
            </div>

            {selectedMechanic === mechanic.id && (
              <div className="pt-4 border-t border-border flex gap-2">
                <button className="flex-1 text-xs sm:text-sm py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition-colors font-semibold">
                  View Profile
                </button>
                <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm py-2 rounded-lg font-semibold transition-colors">
                  Book Now
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
