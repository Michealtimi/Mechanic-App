"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const AVAILABLE_SERVICES = [
  {
    id: 1,
    name: "Oil Change",
    description: "Full synthetic oil & filter",
    price: 59.99,
    duration: 45,
    selected: true,
  },
  {
    id: 2,
    name: "Brake Check",
    description: "Complimentary safety check",
    price: 0,
    duration: 30,
    selected: false,
  },
  {
    id: 3,
    name: "Tire Rotation",
    description: "Extended tire life service",
    price: 40.0,
    duration: 20,
    selected: false,
  },
]

export default function SelectServicesPage() {
  const [services, setServices] = useState(AVAILABLE_SERVICES)
  const [step, setStep] = useState(1)

  const toggleService = (id: number) => {
    setServices(services.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)))
  }

  const selectedServices = services.filter((s) => s.selected)
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container-responsive pt-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button className="text-muted-foreground hover:text-foreground">←</button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">Schedule Your Service</h1>
          </div>
          <div className="flex gap-2 text-xs sm:text-sm">
            <span className="text-primary font-semibold">Details</span>
            <span className="text-muted-foreground">→ Mechanic → Payment</span>
            <span className="text-muted-foreground ml-auto">Step 1 of 3</span>
          </div>
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "33%" }}></div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-6 space-y-6">
        {/* Vehicle Selection */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-foreground mb-3">Your Vehicle</label>
          <button className="w-full p-3 sm:p-4 bg-card border border-border rounded-lg text-foreground hover:border-primary transition-colors text-left flex items-center justify-between text-sm sm:text-base">
            <span>2022 Tesla Model 3</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* VIN Check Banner */}
        <Card className="p-4 sm:p-6 bg-primary/10 border-primary/20">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">Free VIN Check</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Ensure parts compatibility automatically with our instant lookup.
              </p>
            </div>
          </div>
        </Card>

        {/* Service Selection */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Select Services</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Select all services that apply to your vehicle.
          </p>

          <div className="space-y-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`p-4 sm:p-6 cursor-pointer transition-all border-2 ${
                  service.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleService(service.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      service.selected ? "bg-primary border-primary" : "border-muted"
                    }`}
                  >
                    {service.selected && <span className="text-primary-foreground text-sm">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{service.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground text-sm sm:text-base">${service.price.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{service.duration} mins</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Preferred Appointment */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Preferred Appointment</h2>

          <div className="space-y-4">
            {/* Date Selection */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
              {["OCT 24", "OCT 25", "OCT 26", "OCT 27", "OCT 28"].map((date, idx) => (
                <button
                  key={date}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex-shrink-0 transition-colors ${
                    idx === 0 ? "bg-accent text-accent-foreground" : "bg-card hover:border-primary border border-border"
                  }`}
                >
                  <div>{date.split(" ")[0]}</div>
                  <div className="text-xs sm:text-sm">{date.split(" ")[1]}</div>
                </button>
              ))}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"].map((time) => (
                <button
                  key={time}
                  className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-border hover:border-primary text-xs sm:text-sm transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container-responsive py-3 sm:py-4 space-y-3">
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-muted-foreground">Estimated Total</span>
            <span className="text-xl sm:text-2xl font-bold text-foreground">${total.toFixed(2)}</span>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base h-12 sm:h-14">
            Continue: Choose Mechanic →
          </Button>
        </div>
      </div>
    </div>
  )
}
