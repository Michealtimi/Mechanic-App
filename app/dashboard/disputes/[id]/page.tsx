"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { ChevronLeft, MoreVertical, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  author: string
  initials: string
  avatarColor: string
  time: string
  message: string
  isAdmin?: boolean
}

const messages: Message[] = [
  {
    id: "1",
    author: "Jane Doe",
    initials: "JD",
    avatarColor: "bg-primary",
    time: "10:14 AM",
    message: "The engine light came back on only 2 miles after I left the shop. I paid for a full diagnostic and fix.",
  },
  {
    id: "2",
    author: "Mike's Wheels",
    initials: "MW",
    avatarColor: "bg-success",
    time: "11:05 AM",
    message:
      "We fixed the primary sensor issue. The new light might be a secondary fault not present during the initial test drive.",
  },
  {
    id: "3",
    author: "INTERNAL ADMIN NOTE",
    initials: "AD",
    avatarColor: "bg-warning",
    time: "",
    message: "Previous dispute history: None. Mechanic rating: 4.8/5. Suggest partial refund.",
    isAdmin: true,
  },
]

function DisputeDetailContent({ params }: { params: { id: string } }) {
  const [evidenceImageOpen, setEvidenceImageOpen] = useState<number | null>(null)

  const evidenceItems = [
    { id: 1, title: "Pre-op", type: "image" },
    { id: 2, title: "Work Log", type: "image" },
    { id: 3, title: "Video_01.mp4", type: "video" },
  ]

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href="/dashboard" className="text-foreground hover:text-muted-foreground flex-shrink-0">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Dispute #{params.id}</h1>
        </div>
        <button className="text-foreground hover:text-muted-foreground flex-shrink-0">
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs or evidence"
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Status: Open</button>
            <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card/80">
              Priority: High
            </button>
            <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card/80">
              Repair Type
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button className="pb-4 px-4 font-semibold text-foreground border-b-2 border-primary">Customer Claim</button>
          <button className="pb-4 px-4 font-semibold text-muted-foreground hover:text-foreground">Mechanic Info</button>
        </div>

        {/* Booking Details */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">BOOKING DETAILS</p>
              <h2 className="text-2xl font-bold text-foreground">Engine Diagnostic</h2>
            </div>
            <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded">VERIFIED JOB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="font-semibold text-foreground">Oct 24, 2023</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className="font-semibold text-success text-lg">$450.00</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
              <p className="font-semibold text-foreground">2019 Tesla Model 3 (Black)</p>
            </div>
          </div>
        </div>

        {/* Evidence Gallery */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Evidence Gallery ({evidenceItems.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {evidenceItems.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square bg-card border border-border rounded-xl overflow-hidden cursor-pointer group"
              >
                <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                  {item.type === "video" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.title}</span>
                    </div>
                  ) : (
                    <svg className="w-16 h-16 text-secondary/30" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Communication History */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Communication History</h3>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.isAdmin ? "p-4 bg-warning/10 border border-warning/20 rounded-xl" : ""}`}
              >
                <div
                  className={`w-10 h-10 ${msg.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {msg.initials}
                </div>
                <div className="flex-1 min-w-0">
                  {msg.isAdmin && <p className="text-xs uppercase font-bold text-warning mb-1">Internal Admin Note</p>}
                  <p className="font-semibold text-foreground">
                    {msg.author}{" "}
                    {msg.time && <span className="text-sm text-muted-foreground font-normal">{msg.time}</span>}
                  </p>
                  <p className="text-foreground mt-2">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border">
          <Button className="bg-card border border-border text-foreground hover:bg-card/80 h-12 rounded-xl font-semibold">
            Refund Customer
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-semibold">
            Pay Mechanic
          </Button>
        </div>

        {/* Escalate Option */}
        <button className="w-full py-3 text-danger font-semibold flex items-center justify-center gap-2 hover:opacity-80">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V15a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Escalate to Senior Admin
        </button>
      </div>
    </div>
  )
}

export default function DisputeDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <DisputeDetailContent params={params} />
    </Suspense>
  )
}
