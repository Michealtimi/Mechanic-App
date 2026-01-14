"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function MechanicOnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    experience: "",
    specializations: [] as string[],
    certifications: [] as File[],
  })

  const specializations = ["Brakes & Suspension", "Engine Diagnostics", "Transmission", "Electrical Systems", "HVAC"]

  const handleSpecializationChange = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }))
  }

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      console.log("Complete mechanic onboarding:", formData)
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

        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Professional Setup
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Tell us about your expertise and certifications.
            </p>

            <div className="space-y-6 sm:space-y-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Years of Experience</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                  className="w-full h-12 sm:h-13 px-4 rounded-lg border border-border bg-input text-foreground"
                >
                  <option value="">Select years</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">Primary Specializations</label>
                <div className="space-y-3">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => handleSpecializationChange(spec)}
                      className={`w-full p-4 sm:p-5 rounded-xl text-left border-2 transition-all ${
                        formData.specializations.includes(spec)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{spec}</span>
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.specializations.includes(spec) ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {formData.specializations.includes(spec) && (
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
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Professional Certifications
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Upload your certifications (PDF, JPG up to 10MB)
            </p>

            <div className="border-2 border-dashed border-border rounded-2xl p-8 sm:p-12 text-center">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                Click to upload or drag and drop
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">ASE, State License (PDF, JPG up to 10MB)</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Apply for EV Specialist Badge
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
              Get verified to work on electric and hybrid vehicles to unlock premium service requests.
            </p>

            <Card className="p-6 sm:p-8 border-2 border-accent">
              <div className="flex gap-4 sm:gap-6">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11 9a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">EV Specialist Benefits</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Get access to premium EV service requests, higher rates, and exclusive training.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 sm:mt-16 flex gap-3 sm:gap-4">
          <Button variant="outline" className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-transparent">
            Skip
          </Button>
          <Button className="flex-1 h-12 sm:h-14 text-base sm:text-lg" onClick={handleContinue}>
            {step === 3 ? "Complete Setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
