"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AddVehiclePage() {
  const [useVIN, setUseVIN] = useState(true)
  const [vinInput, setVinInput] = useState("")
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    license: "",
  })
  const [step, setStep] = useState(1)

  const handleVINCheck = () => {
    // Simulate VIN lookup
    console.log("Checking VIN:", vinInput)
    setFormData({
      make: "Tesla",
      model: "Model 3",
      year: "2022",
      license: "",
    })
    setStep(2)
  }

  const handleContinue = () => {
    if (step === 1) {
      setStep(2)
    } else {
      console.log("Add vehicle:", formData)
    }
  }

  const progress = (step / 2) * 100

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link
            href="/dashboard/garage"
            className="text-muted-foreground hover:text-foreground text-sm mb-6 inline-block"
          >
            ← Back to Garage
          </Link>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of 2</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Add Your Vehicle
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Quickly add your car's details to get started.
            </p>

            <div className="space-y-6 sm:space-y-8">
              {/* Toggle */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setUseVIN(true)}
                  className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
                    useVIN ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="font-medium text-foreground text-sm">Auto-fill with VIN</p>
                </button>
                <button
                  onClick={() => setUseVIN(false)}
                  className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
                    !useVIN ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <p className="font-medium text-foreground text-sm">Enter Manually</p>
                </button>
              </div>

              {useVIN ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">VIN Number</label>
                  <div className="flex gap-2 sm:gap-3">
                    <Input
                      placeholder="e.g. 1HGBH41JXMN109186"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value)}
                      className="h-12 sm:h-13 flex-1"
                    />
                    <Button onClick={handleVINCheck} className="h-12 sm:h-13 px-4 sm:px-6" disabled={!vinInput.trim()}>
                      Check
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Free VIN Check - Ensure parts compatibility automatically with our instant lookup.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Make</label>
                    <Input
                      placeholder="e.g. Tesla"
                      value={formData.make}
                      onChange={(e) => setFormData((prev) => ({ ...prev, make: e.target.value }))}
                      className="h-12 sm:h-13"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Model</label>
                      <Input
                        placeholder="e.g. Model 3"
                        value={formData.model}
                        onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                        className="h-12 sm:h-13"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                      <Input
                        placeholder="2024"
                        value={formData.year}
                        onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                        className="h-12 sm:h-13"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">License Plate</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Add your vehicle's license plate for identification.
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">License Plate</label>
              <Input
                placeholder="ABC-1234"
                value={formData.license}
                onChange={(e) => setFormData((prev) => ({ ...prev, license: e.target.value }))}
                className="h-12 sm:h-13 text-center text-lg font-semibold tracking-wider"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-12 sm:mt-16 flex gap-3 sm:gap-4">
          <Button variant="outline" className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-transparent" asChild>
            <Link href="/dashboard/garage">Cancel</Link>
          </Button>
          <Button className="flex-1 h-12 sm:h-14 text-base sm:text-lg" onClick={handleContinue}>
            {step === 2 && useVIN && vinInput ? "Auto-fill" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
