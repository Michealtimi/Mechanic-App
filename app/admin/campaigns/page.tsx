"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Plus, TrendingUp } from "lucide-react"

const CAMPAIGNS = [
  {
    id: 1,
    name: "Holiday Boost 2024",
    status: "ACTIVE",
    description: "Discount: 20% off services",
    startDate: "Dec 15",
    endDate: "Jan 05",
    redemptions: "18.2k",
    revenue: "$64,280",
    redemptionRate: "+12.5%",
    conversionRate: "9.42%",
    avgOrder: "$35.12",
    created: "Admin Team",
  },
  {
    id: 2,
    name: "Summer Drive 24",
    status: "ACTIVE",
    description: "Discount: 15% off Maintenance",
    startDate: "June 1",
    endDate: "Aug 31",
    redemptions: "12.4k",
    revenue: "$42,100",
    redemptionRate: "+15.2%",
    conversionRate: "10.2%",
    avgOrder: "$32.50",
    created: "Admin Team",
  },
  {
    id: 3,
    name: "Welcome EV New",
    status: "SCHEDULED",
    description: "Discount: Free Charger Install",
    startDate: "Jan 15",
    endDate: "Feb 28",
    redemptions: "—",
    revenue: "—",
    redemptionRate: "—",
    conversionRate: "—",
    avgOrder: "—",
    created: "Admin Team",
  },
]

export default function CampaignsPage() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "analytics">("overview")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container-responsive pt-6 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Promotions</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track marketing campaigns</p>
          </div>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create New Promotion</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-muted-foreground text-sm uppercase">Total Redemptions</p>
            <p className="text-2xl font-bold text-foreground mt-2">12,450</p>
            <p className="text-status-success text-xs mt-2">+15.2%</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm uppercase">Active Campaigns</p>
            <p className="text-2xl font-bold text-foreground mt-2">8</p>
            <p className="text-muted-foreground text-xs mt-2">Stable</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm uppercase">Revenue Impact</p>
            <p className="text-2xl font-bold text-foreground mt-2">$156.2K</p>
            <p className="text-status-success text-xs mt-2">+22.5%</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm uppercase">Avg Conversion</p>
            <p className="text-2xl font-bold text-foreground mt-2">11.3%</p>
            <p className="text-muted-foreground text-xs mt-2">Last 30 days</p>
          </Card>
        </div>

        {/* Lead Magnet Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Lead Magnet Tracking</h2>
          <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                    PRIORITY
                  </span>
                  <span className="text-sm font-semibold text-foreground">Free VIN Check</span>
                </div>
                <p className="text-muted-foreground text-sm">Conversion: 18.4%</p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Button>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "18.4%" }}></div>
            </div>
          </Card>
        </div>

        {/* Active Campaigns */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Active Campaigns</h2>
          <div className="space-y-4">
            {CAMPAIGNS.filter((c) => c.status !== "SCHEDULED").map((campaign) => (
              <Card
                key={campaign.id}
                className="p-6 cursor-pointer hover:bg-card/80 transition-colors border-l-4 border-l-accent"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">{campaign.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-status-success/20 text-status-success font-semibold">
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">{campaign.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-foreground">${campaign.revenue}</p>
                    <p className="text-xs text-status-success">{campaign.redemptionRate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Redemptions</p>
                    <p className="font-semibold text-foreground text-sm">{campaign.redemptions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conv. Rate</p>
                    <p className="font-semibold text-foreground text-sm">{campaign.conversionRate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Order</p>
                    <p className="font-semibold text-foreground text-sm">{campaign.avgOrder}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="font-semibold text-foreground text-sm">{campaign.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                    <p className="font-semibold text-foreground text-sm">{campaign.endDate}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent text-xs">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent text-xs">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Scheduled Campaigns */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Scheduled Campaigns</h2>
          <div className="space-y-4">
            {CAMPAIGNS.filter((c) => c.status === "SCHEDULED").map((campaign) => (
              <Card key={campaign.id} className="p-6 opacity-75">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{campaign.name}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">{campaign.description}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0">
                    {campaign.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs mt-3">Starts in 2 days • Target: New Users</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
