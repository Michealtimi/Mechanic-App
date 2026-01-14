"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Clock, MapPin, CheckCircle, Phone, MessageSquare } from "lucide-react"

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("in_progress")

  const jobDetails = {
    id: params.id,
    customer: "Alex Rivera",
    service: "Brake Pad Replacement",
    vehicle: "2022 Tesla Model 3",
    location: "123 Market St, San Francisco, CA",
    startTime: "10:30 AM",
    estimatedEnd: "11:15 AM",
    price: 125.0,
    status: "IN PROGRESS",
    progress: 65,
    tasks: [
      { name: "Remove old pads", completed: true },
      { name: "Inspect rotors", completed: true },
      { name: "Install new pads", completed: false },
      { name: "Test brakes", completed: false },
    ],
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4 flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground">←</button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">{jobDetails.service}</h1>
        </div>
      </div>

      <div className="container-responsive py-6 space-y-6">
        {/* Customer Info */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">{jobDetails.customer}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{jobDetails.vehicle}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 bg-transparent text-xs sm:text-sm h-9 sm:h-10">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent text-xs sm:text-sm h-9 sm:h-10">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Message
            </Button>
          </div>
        </Card>

        {/* Location & Time */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Location</p>
            </div>
            <p className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2">{jobDetails.location}</p>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Duration</p>
            </div>
            <p className="font-semibold text-foreground text-xs sm:text-sm">
              {jobDetails.startTime} - {jobDetails.estimatedEnd}
            </p>
          </Card>
        </div>

        {/* Progress */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Progress</h3>
            <span className="text-lg sm:text-xl font-bold text-primary">{jobDetails.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 mb-4">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${jobDetails.progress}%` }}
            ></div>
          </div>

          <div className="space-y-3">
            {jobDetails.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    task.completed ? "bg-status-success" : "bg-muted"
                  }`}
                >
                  {task.completed && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                </div>
                <span className={`text-xs sm:text-sm ${task.completed ? "text-muted-foreground" : "text-foreground"}`}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-4 sm:p-6 bg-accent/5 border-accent/20">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm sm:text-base">Service Price</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">${jobDetails.price.toFixed(2)}</p>
          </div>
        </Card>

        {/* Status Control */}
        {status !== "completed" && (
          <Button
            onClick={() => setStatus("completed")}
            className="w-full bg-status-success hover:bg-status-success/90 text-white text-sm sm:text-base h-12 sm:h-14"
          >
            Mark as Completed
          </Button>
        )}

        {status === "completed" && (
          <Card className="p-4 sm:p-6 bg-status-success/10 border-status-success/20 text-center">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-status-success mx-auto mb-2" />
            <p className="font-semibold text-foreground text-sm sm:text-base">Job Completed!</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Customer will be notified shortly.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
