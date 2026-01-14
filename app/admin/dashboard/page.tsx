"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Users, Zap, AlertCircle, BarChart3, PieChart } from "lucide-react"

export default function AdminDashboard() {
  const metrics = [
    { icon: Users, label: "Total Users", value: "2,450", change: "+12.5%", positive: true },
    { icon: Zap, label: "Active Services", value: "142", change: "+8.2%", positive: true },
    { icon: TrendingUp, label: "Revenue", value: "$45,280", change: "+18.4%", positive: true },
    { icon: AlertCircle, label: "Pending Issues", value: "8", change: "+2", positive: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container-responsive pt-6 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-2">Real-time oversight of all platform activities</p>
        </div>
      </div>

      <div className="container-responsive py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(({ icon: Icon, label, value, change, positive }, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-5 h-5 text-primary" />
                <span className={`text-xs font-semibold ${positive ? "text-status-success" : "text-destructive"}`}>
                  {change}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{label}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Redemptions Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Daily Redemptions</h3>
                <p className="text-2xl font-bold text-foreground mt-1">1,402</p>
                <p className="text-muted-foreground text-sm">Today</p>
              </div>
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>

            {/* Simple line chart visualization */}
            <div className="space-y-2 mb-4">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, idx) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">{day}</span>
                  <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-primary transition-all"
                      style={{ width: `${50 + Math.sin(idx) * 30}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue Impact Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Revenue Impact (Hourly)</h3>
                <p className="text-2xl font-bold text-foreground mt-1">$4,821</p>
                <p className="text-status-success text-sm">+18%</p>
              </div>
              <PieChart className="w-5 h-5 text-primary" />
            </div>

            {/* Bar chart visualization */}
            <div className="flex items-end justify-between gap-2 h-40">
              {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((time, idx) => (
                <div key={time} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-accent rounded-sm transition-all"
                    style={{ height: `${30 + Math.cos(idx) * 60}px` }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Redemptions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Redemptions</h2>
            <a href="#" className="text-accent text-sm hover:underline">
              View All
            </a>
          </div>

          <Card className="p-0 divide-y divide-border overflow-hidden">
            {[
              { customer: "John Doe", amount: 15, method: "Redeemed", time: "2 mins ago" },
              { customer: "Alice Moore", amount: 25, method: "Redeemed", time: "14 mins ago" },
              { customer: "Robert King", amount: 10, method: "Redeemed", time: "42 mins ago" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base">{item.customer}</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">{item.time}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base">-${item.amount}.00</p>
                  <p className="text-status-success text-xs sm:text-sm">{item.method}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
