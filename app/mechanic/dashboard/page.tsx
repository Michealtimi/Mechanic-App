"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, TrendingUp, Clock, DollarSign, Users } from "lucide-react"
import { MechanicJobListener } from "@/components/mechanic-job-popup"
import { useRealtime } from "@/lib/realtime-context"

export default function MechanicDashboard() {
  const router = useRouter()
  const { pendingJobs } = useRealtime()
  const [todayEarnings] = useState(480)
  const [activeJobs] = useState(2)
  const [rating] = useState(4.9)
  const [isOnline, setIsOnline] = useState(true)

  const navigationItems = [
    { icon: "📊", label: "Dashboard", href: "/mechanic/dashboard" },
    { icon: "🔧", label: "Services", href: "/mechanic/services" },
    { icon: "👥", label: "Clients", href: "/mechanic/clients" },
    { icon: "⚙️", label: "Settings", href: "/mechanic/settings" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container-responsive pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg sm:text-xl">
                👨‍🔧
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">Marcus Rivera</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Senior Technician</p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <span className="text-xl">🔔</span>
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-status-success animate-pulse' : 'bg-muted'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isOnline ? "Online and accepting jobs" : "Offline"}
              </span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isOnline
                  ? "bg-status-success/20 text-status-success border border-status-success/30"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {isOnline ? "Go Offline" : "Go Online"}
            </button>
          </div>
          
          {/* Pending Jobs Indicator */}
          {pendingJobs.length > 0 && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-foreground font-semibold">
                {pendingJobs.length} new job{pendingJobs.length > 1 ? 's' : ''} available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: DollarSign, label: "Today's Earnings", value: `$${todayEarnings}` },
            { icon: Clock, label: "Active Jobs", value: activeJobs },
            { icon: TrendingUp, label: "Rating", value: rating },
            { icon: Users, label: "Repeat Clients", value: "12" },
          ].map(({ icon: Icon, label, value }, idx) => (
            <Card key={idx} className="p-3 sm:p-4">
              <div className="flex items-start gap-2 mb-2">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{label}</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
            </Card>
          ))}
        </div>

        {/* Active Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Active Jobs</h3>
            <a href="#" className="text-accent text-xs sm:text-sm hover:underline">
              View All
            </a>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 1,
                customer: "Alex Rivera",
                service: "Brake Pad Replacement",
                status: "IN PROGRESS",
                progress: 65,
                eta: "30 mins",
              },
              {
                id: 2,
                customer: "Sarah Johnson",
                service: "Oil Change",
                status: "SCHEDULED",
                progress: 0,
                eta: "2 hrs",
              },
            ].map((job) => (
              <Card key={job.id} className="p-4 sm:p-6 cursor-pointer hover:bg-card/80 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{job.service}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{job.customer}</p>
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full ${
                      job.status === "IN PROGRESS" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {job.progress > 0 && (
                  <div className="mb-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${job.progress}%` }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {job.progress}% complete • ETA: {job.eta}
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-transparent text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => router.push(`/mechanic/job/${job.id}`)}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Upcoming Jobs</h3>
          <Card className="p-4 sm:p-6 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">No upcoming jobs scheduled</p>
            <Button variant="outline" className="mt-4 bg-transparent text-xs sm:text-sm">
              Browse Available Jobs
            </Button>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card className="p-4 sm:p-6 bg-primary/10 border-primary/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">Pro Tip</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Complete jobs on time to earn bonus points and increase your visibility to customers.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container-responsive">
          <div className="flex items-center justify-around py-3 sm:py-4">
            {navigationItems.map(({ icon, label, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
              >
                <span className="text-lg sm:text-xl">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Safe area for mobile bottom nav */}
      <div className="h-20 sm:h-0"></div>

      {/* Job Request Listener - Shows popups for new jobs */}
      <MechanicJobListener />
    </div>
  )
}
