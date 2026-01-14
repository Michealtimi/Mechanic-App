"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, MapPin, Award, Clock, Edit2, Users, Wrench, Settings } from "lucide-react"

export default function MechanicProfilePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "services" | "settings">("overview")

  const specializations = [
    "Tesla Repair",
    "Rivian Tech",
    "Battery Diagnostics",
    "Software Calibration",
    "Hybrid Systems",
  ]

  const certifications = [
    { name: "Tesla Tier 3 Advanced", status: "verified" },
    { name: "High Voltage Safety Certified", status: "verified" },
    { name: "EV Specialist Badge", status: "verified" },
  ]

  const reviews = [
    {
      customer: "John K.",
      rating: 5,
      text: "Marcus is the only person I trust with my Model 3. Fixed my battery coolant issue same day. Absolute pro.",
      service: "Model 3 Service",
      date: "2 days ago",
    },
    {
      customer: "Sarah L.",
      rating: 5,
      text: "Honest pricing and very knowledgeable about EV regenerative braking systems. Highly recommend.",
      service: "Brake Service",
      date: "1 week ago",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Link href="/mechanic/dashboard" className="text-primary hover:text-primary/80 text-sm sm:text-base transition-colors">
            ← Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1 text-center">Mechanic Profile</h1>
          <button className="text-primary hover:text-primary/80 p-2 rounded transition-colors">
            <Edit2 size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border sticky top-16 z-10">
        <div className="flex gap-0 p-4 sm:p-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "clients"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={18} />
            Clients
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "services"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wrench size={18} />
            Services
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-sidebar-border border-2 border-primary flex items-center justify-center mx-auto text-4xl sm:text-5xl mb-4">
                👨‍🔧
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Marcus Rivera</h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">Senior Master Technician</p>

              <div className="flex items-center justify-center gap-2 mt-4">
                <MapPin size={16} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">San Francisco, CA</p>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <Star size={18} className="fill-primary text-primary" />
                    <span className="text-lg sm:text-xl font-bold text-foreground">4.9</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">12 yrs</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Experience</p>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">1.4k+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Jobs</p>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div>
              <h3 className="font-semibold text-foreground text-base sm:text-lg mb-4">Specializations</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary/20 text-primary rounded-full font-medium border border-primary/30"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Verified Certifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Verified Certs</h3>
              </div>

              <div className="space-y-3">
                {certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-6 bg-card border border-primary/30 rounded-lg flex items-start gap-4"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-sidebar-border border border-primary/50 flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl">
                      📋
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm sm:text-base">{cert.name}</h4>
                      <p className="text-xs sm:text-sm text-primary mt-2">✓ Verified Badge</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Recent Reviews</h3>
                <a href="#" className="text-primary text-xs sm:text-sm hover:text-primary/80 transition-colors">
                  View all
                </a>
              </div>

              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="p-4 sm:p-6 bg-card border border-primary/30 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sidebar-border border border-primary/50 flex items-center justify-center flex-shrink-0 text-sm sm:text-base">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-xs sm:text-sm">{review.customer}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={14} className="fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{review.text}</p>

                    <div className="flex items-center gap-2 mt-4 text-xs sm:text-sm text-muted-foreground">
                      <Clock size={14} />
                      {review.service} • {review.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="p-4 sm:p-6 bg-card border border-primary/30 rounded-lg text-center">
            <h3 className="text-foreground font-semibold text-lg">Clients Section</h3>
            <p className="text-muted-foreground text-sm mt-2">View and manage your client list here</p>
          </div>
        )}

        {activeTab === "services" && (
          <div className="p-4 sm:p-6 bg-card border border-primary/30 rounded-lg text-center">
            <h3 className="text-foreground font-semibold text-lg">Services Section</h3>
            <p className="text-muted-foreground text-sm mt-2">Manage your services and pricing here</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-4 sm:p-6 bg-card border border-primary/30 rounded-lg text-center">
            <h3 className="text-foreground font-semibold text-lg">Settings Section</h3>
            <p className="text-muted-foreground text-sm mt-2">Configure your profile settings here</p>
          </div>
        )}
      </div>
    </div>
  )
}
