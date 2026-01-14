"use client"

import { useState } from "react"
import { Megaphone, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Campaign {
  id: string
  name: string
  description: string
  discount: string
  status: "active" | "scheduled" | "inactive"
  usage: string
  redemption: string
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "SUMMER_DRIVE_24",
    description: "Discount: 15% off Maintenance",
    discount: "15%",
    status: "active",
    usage: "750/1000",
    redemption: "12.4%",
  },
  {
    id: "2",
    name: "WELCOME_EV_NEW",
    description: "Discount: Free Charger Install",
    discount: "Free",
    status: "active",
    usage: "160/500",
    redemption: "8.9%",
  },
  {
    id: "3",
    name: "FIXED_SERVICE_100",
    description: "Discount: $100 off Major Repair",
    discount: "$100",
    status: "scheduled",
    usage: "0/500",
    redemption: "Starts in 2 days",
  },
]

export default function PromotionsPage() {
  const [selectedTab, setSelectedTab] = useState("active")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Promotions</h1>
        </div>
        <button className="text-foreground hover:text-muted-foreground">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-sm text-muted-foreground uppercase font-semibold mb-2">Total Redemptions</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">12,450</p>
                <p className="text-success text-sm mt-1">↑ +15.2%</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-sm text-muted-foreground uppercase font-semibold mb-2">Active Campaigns</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">8</p>
                <p className="text-muted-foreground text-sm mt-1">Stable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Magnet */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-foreground mb-4">Lead Magnet Tracking</h3>
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-4 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg mb-3">
                  PRIORITY
                </div>
                <p className="text-lg font-bold text-foreground">Free VIN Check</p>
                <p className="text-sm text-primary mt-1">Conversion: 18.4%</p>
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90">
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Active Campaigns</h3>
            <button className="text-primary text-sm font-medium hover:text-primary/80">View All</button>
          </div>

          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-lg">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      campaign.status === "active"
                        ? "bg-success/10 text-success"
                        : campaign.status === "scheduled"
                          ? "bg-secondary/20 text-muted-foreground"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {campaign.status.toUpperCase()}
                  </span>
                </div>

                <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width:
                        campaign.status === "scheduled"
                          ? "0%"
                          : `${(Number.parseInt(campaign.usage) / Number.parseInt(campaign.usage.split("/")[1])) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usage: {campaign.usage}</span>
                  <span className="text-muted-foreground">Redemption: {campaign.redemption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 sm:h-14 rounded-xl text-base font-semibold mt-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create New Promotion
        </Button>
      </div>
    </div>
  )
}
