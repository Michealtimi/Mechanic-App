"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function VehicleDetailsPage({ params }: { params: { id: string } }) {
  const mockVehicle = {
    year: 2022,
    make: "Tesla",
    model: "Model 3",
    license: "XYZ-1234",
    vin: "5YJ3E1EAXNF123456",
    mileage: 12450,
    image: "/white-tesla-model-3.jpg",
  }

  const maintenance = [
    {
      id: 1,
      type: "Oil Change",
      date: "Oct 24, 2023",
      cost: "$89.99",
      mechanic: "Sarah Jenkins",
      status: "completed",
    },
    {
      id: 2,
      type: "Tire Rotation & Balance",
      date: "Sept 12, 2023",
      cost: "$45.00",
      mechanic: "Mike Ross",
      status: "completed",
    },
    {
      id: 3,
      type: "Brake Pad Replacement",
      date: "Aug 05, 2023",
      cost: "$150.00",
      mechanic: "Elena Rodriguez",
      status: "completed",
    },
  ]

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link href="/dashboard/garage" className="text-muted-foreground hover:text-foreground text-sm">
            ← Back to Garage
          </Link>
          <Button variant="outline" className="h-10 sm:h-12 bg-transparent">
            Edit
          </Button>
        </div>

        {/* Vehicle Image */}
        <div className="mb-8 sm:mb-12 rounded-2xl overflow-hidden bg-muted aspect-video">
          <img src={mockVehicle.image || "/placeholder.svg"} alt="Vehicle" className="w-full h-full object-cover" />
        </div>

        {/* Vehicle Info */}
        <Card className="p-6 sm:p-8 mb-8 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {mockVehicle.year} {mockVehicle.make} {mockVehicle.model}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">License: {mockVehicle.license}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">VIN</p>
                <p className="font-mono text-sm sm:text-base text-foreground">{mockVehicle.vin}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Mileage</p>
                <p className="font-semibold text-sm sm:text-base text-foreground">
                  {mockVehicle.mileage.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Maintenance History */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Maintenance History</h2>
          <div className="space-y-3 sm:space-y-4">
            {maintenance.map((item) => (
              <Card key={item.id} className="p-4 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg">{item.type}</h3>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                    <p className="text-sm text-muted-foreground">Mechanic: {item.mechanic}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <p className="font-semibold text-foreground text-sm sm:text-base">{item.cost}</p>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 sm:mt-16 flex gap-3 sm:gap-4">
          <Button variant="outline" className="flex-1 h-12 sm:h-14 bg-transparent">
            View Full History
          </Button>
          <Button className="flex-1 h-12 sm:h-14">Schedule Service</Button>
        </div>
      </div>
    </div>
  )
}
