"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  license: string
  image: string
  health: number
  range: string
  odometer: string
}

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    year: 2022,
    make: "Tesla",
    model: "Model 3",
    license: "XYZ-1234",
    image: "/white-tesla-model-3.jpg",
    health: 98,
    range: "284 mi",
    odometer: "12,450",
  },
  {
    id: "2",
    year: 2021,
    make: "Toyota",
    model: "RAV4",
    license: "ABC-5678",
    image: "/silver-toyota-rav4.jpg",
    health: 92,
    range: "450 mi",
    odometer: "28,900",
  },
]

export default function GaragePage() {
  const [vehicles] = useState<Vehicle[]>(mockVehicles)

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">My Garage</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{vehicles.length} vehicle(s)</p>
          </div>
          <Button className="h-10 sm:h-12 text-sm sm:text-base" asChild>
            <Link href="/dashboard/garage/add">+ Add Vehicle</Link>
          </Button>
        </div>

        {/* Vehicle List */}
        {vehicles.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-muted-foreground mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7H5a2 2 0 00-2 2v9m16-11v9m-8 0H9m4 0h4m-4 0a2 2 0 110-4 2 2 0 010 4zm-3 5a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"
              />
            </svg>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">No vehicles added</h3>
            <p className="text-muted-foreground text-sm sm:text-base mb-6">Add your first vehicle to get started.</p>
            <Button asChild>
              <Link href="/dashboard/garage/add">Add Vehicle</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {vehicles.map((vehicle) => (
              <Link key={vehicle.id} href={`/dashboard/garage/${vehicle.id}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full">
                  {/* Vehicle Image */}
                  <div className="relative w-full h-32 sm:h-40 bg-muted overflow-hidden">
                    <img
                      src={vehicle.image || "/placeholder.svg"}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">License: {vehicle.license}</p>
                    </div>

                    {/* Health Indicator */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Health</span>
                        <span className="text-sm font-semibold text-primary">{vehicle.health}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${vehicle.health}%` }}></div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <p className="text-muted-foreground text-xs">Range</p>
                        <p className="font-semibold text-foreground">{vehicle.range}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <p className="text-muted-foreground text-xs">Odometer</p>
                        <p className="font-semibold text-foreground">{vehicle.odometer}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
