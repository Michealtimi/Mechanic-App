"use client"
import { useState } from "react"
import { ChevronRight, Car, ChevronLeft } from "lucide-react"
import Link from "next/link"

const UPCOMING_BOOKINGS = [
  {
    id: 1,
    service: "Full Service Oil Change",
    date: "Tuesday, Oct 24",
    time: "10:00 AM",
    mechanic: "Sarah Jenkins",
    vehicle: "2022 Tesla Model 3 (Blue)",
    status: "SCHEDULED",
    mechanic_avatar: "👩‍🔧",
  },
]

const PAST_BOOKINGS = [
  {
    id: 2,
    service: "Tire Rotation & Balance",
    date: "Sept 12, 2023",
    time: "02:30 PM",
    mechanic: "Mike Ross",
    vehicle: "2022 Tesla Model 3 (Blue)",
    status: "COMPLETED",
    mechanic_avatar: "👨‍🔧",
  },
  {
    id: 3,
    service: "Brake Pad Replacement",
    date: "Aug 05, 2023",
    time: "11:15 AM",
    mechanic: "Elena Rodriguez",
    vehicle: "2022 Tesla Model 3 (Blue)",
    status: "COMPLETED",
    mechanic_avatar: "👩‍🔧",
  },
]

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const bookings = activeTab === "upcoming" ? UPCOMING_BOOKINGS : PAST_BOOKINGS

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-8">
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-sidebar-border transition-colors text-primary hover:text-primary/80"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors">⋯</button>
        </div>
      </div>

      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 pt-4 pb-0">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-4 font-semibold text-base transition-all ${
              activeTab === "upcoming"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`pb-4 font-semibold text-base transition-all ${
              activeTab === "past"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === "upcoming" && (
          <div>
            <h2 className="font-semibold text-foreground text-lg">Upcoming Appointments</h2>
            <p className="text-muted-foreground text-sm">Next 30 Days</p>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        booking.status === "SCHEDULED"
                          ? "bg-primary text-primary-foreground"
                          : "bg-status-success/20 text-status-success"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{booking.service}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {booking.date} · {booking.time}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sidebar-border flex items-center justify-center text-lg">
                    {booking.mechanic_avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{booking.mechanic}</p>
                    <p className="text-xs text-muted-foreground">Mechanic</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary" />
                  <p className="text-sm text-foreground">{booking.vehicle}</p>
                </div>
              </div>

              <Link
                href={`/dashboard/booking-details/${booking.id}`}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
