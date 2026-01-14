"use client"

import { Gauge } from "lucide-react"

export default function SystemHealthPage() {
  const systemStatus = [
    { name: "Socket.IO Status", status: "Connected", value: "✓", color: "text-success" },
    { name: "Active Sessions", status: "1,284", change: "+5%", color: "text-primary" },
  ]

  const apiMetrics = [
    { label: "Avg Latency (Global)", value: "124", unit: "ms", status: "good" },
    { label: "API V1 Success Rate", value: "99.8%", unit: "", status: "excellent" },
    { label: "Image CDN Cache Hit", value: "84.2%", unit: "", status: "good" },
  ]

  const servers = [
    { region: "AWS-US-EAST-1A", instance: "t3.xlarge", cpu: 45, cpuStatus: "good" },
    { region: "AWS-EU-WEST-1B", instance: "t3.xlarge", cpu: 62, cpuStatus: "warning" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm11-4a1 1 0 10-2 0 1 1 0 002 0z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">System Health</h1>
        </div>
        <button className="text-foreground hover:text-muted-foreground">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.5 1.5H19V10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
        {/* Overall Status */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-success rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm text-muted-foreground uppercase font-semibold">LIVE</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">All Systems Nominal</h2>
                <p className="text-sm text-muted-foreground">Last scan: 2 mins ago</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-4xl font-bold text-success">99%</div>
            </div>
          </div>
        </div>

        {/* Real-time Connectivity */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Real-time Connectivity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemStatus.map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground mb-3">{item.name}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-2xl sm:text-3xl font-bold ${item.color}`}>{item.status}</p>
                    {item.change && <p className="text-sm text-success">↑ {item.change}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Performance */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">API Performance</h3>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            {apiMetrics.map((metric, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  <span className="text-lg font-bold text-foreground">
                    {metric.value}
                    {metric.unit}
                  </span>
                </div>
                <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      metric.status === "excellent"
                        ? "bg-success"
                        : metric.status === "good"
                          ? "bg-primary"
                          : "bg-warning"
                    }`}
                    style={{
                      width: metric.label.includes("Latency")
                        ? "60%"
                        : metric.label.includes("Success")
                          ? "95%"
                          : "75%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server Infrastructure */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Server Infrastructure</h3>
          <div className="space-y-3">
            {servers.map((server, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{server.region}</p>
                    <p className="text-sm text-muted-foreground">{server.instance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CPU Load</p>
                    <div className="w-20 h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${server.cpuStatus === "warning" ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${server.cpu}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 grid grid-cols-4 gap-2 sm:hidden">
        <button className="flex flex-col items-center gap-1 text-foreground py-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary py-2">
          <Gauge className="w-6 h-6" />
          <span className="text-xs">Health</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-foreground py-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <span className="text-xs">Logs</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-foreground py-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 17v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">Refresh</span>
        </button>
      </div>
    </div>
  )
}
