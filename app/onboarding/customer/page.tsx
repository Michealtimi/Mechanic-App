"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CustomerOnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    preferences: [] as string[],
    carMake: "",
    carModel: "",
    carYear: "",
    licensePlate: "",
  })

  const preferences = [
    { id: "routine", label: "Routine Maintenance", icon: "🔧" },
    { id: "emergency", label: "Emergency Repairs", icon: "⚠️" },
    { id: "ev", label: "EV Specialist", icon: "⚡" },
    { id: "body", label: "Body Work", icon: "🚗" },
    { id: "inspections", label: "Inspections", icon: "📋" },
  ]

  const handlePreferenceChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(id) ? prev.preferences.filter((p) => p !== id) : [...prev.preferences, id],
    }))
  }

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      // Complete onboarding - save vehicle and redirect
      try {
        const { api } = await import("@/lib/api-client")
        if (formData.carMake && formData.carModel && formData.carYear) {
          await api.vehicles.create({
            make: formData.carMake,
            model: formData.carModel,
            year: parseInt(formData.carYear),
            licensePlate: formData.licensePlate,
          })
        }
        // Redirect to dashboard
        window.location.href = "/dashboard"
      } catch (error) {
        console.error("Onboarding error:", error)
        // Still redirect on error
        window.location.href = "/dashboard"
      }
    }
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <button className="text-muted-foreground hover:text-foreground mb-6">← Back</button>
          <div className="mb-4">
            <div className="flex justify-between text-sm sm:text-base text-muted-foreground mb-2">
              <span>Step {step} of 3</span>
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
          // Step 1: Phone Number
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Welcome to AutoServe
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Let's get your profile set up to give you the best service experience for your vehicle.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-12 sm:h-13"
                />
                <button className="text-accent text-sm mt-2 hover:underline">Verify</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">Service Preferences</label>
                <div className="space-y-3">
                  {preferences.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => handlePreferenceChange(pref.id)}
                      className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                        formData.preferences.includes(pref.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{pref.icon}</span>
                          <span className="font-medium text-foreground">{pref.label}</span>
                        </div>
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.preferences.includes(pref.id) ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {formData.preferences.includes(pref.id) && (
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          // Step 2: Add Car Details
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">Add Your Vehicle</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Tell us about your vehicle to get personalized service recommendations.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Make</label>
                <Input
                  type="text"
                  placeholder="e.g., Tesla, Toyota, Ford"
                  value={formData.carMake}
                  onChange={(e) => setFormData((prev) => ({ ...prev, carMake: e.target.value }))}
                  className="h-12 sm:h-13"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Model</label>
                <Input
                  type="text"
                  placeholder="e.g., Model 3, Camry, F-150"
                  value={formData.carModel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, carModel: e.target.value }))}
                  className="h-12 sm:h-13"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                <Input
                  type="number"
                  placeholder="e.g., 2022"
                  value={formData.carYear}
                  onChange={(e) => setFormData((prev) => ({ ...prev, carYear: e.target.value }))}
                  className="h-12 sm:h-13"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">License Plate (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., ABC-1234"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, licensePlate: e.target.value }))}
                  className="h-12 sm:h-13"
                />
              </div>
            </div>
          </div>
        ) : (
          // Step 3: Add Photo (Optional)
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">Add Your Photo</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">Optional - You can skip this step</p>

            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <Button variant="outline" className="h-12 sm:h-13 text-base sm:text-lg bg-transparent">
                Upload Photo
              </Button>
              <p className="text-sm sm:text-base text-muted-foreground mt-4 text-center">or drag and drop</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 sm:mt-16 flex gap-3 sm:gap-4">
          {step > 1 && (
            <Button
              variant="outline"
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-transparent"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          {step === 3 ? (
            <Button variant="outline" className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-transparent" onClick={handleContinue}>
              Skip
            </Button>
          ) : null}
          <Button className="flex-1 h-12 sm:h-14 text-base sm:text-lg" onClick={handleContinue}>
            {step === 3 ? "Complete" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
