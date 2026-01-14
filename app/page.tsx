"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, Zap, Shield, MapPin, Clock, Lock } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Carousel auto-rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isClient) return null

  const carouselItems = [
    {
      title: "Expert Mechanics",
      description: "Access verified, certified professionals ready to help",
      image: "/mechanic-fixing-car-professional.jpg",
    },
    {
      title: "Real-Time Tracking",
      description: "Monitor your service from start to finish with live updates",
      image: "/car-gps-tracking-map.jpg",
    },
    {
      title: "Transparent Pricing",
      description: "No hidden fees - get quotes upfront before booking",
      image: "/transparent-pricing-calculator.jpg",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation - Fixed Header */}
      <nav className="fixed top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur-sm">
        <div className="container-responsive py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center animate-pulse">
              <span className="text-primary-foreground font-bold text-lg">⚡</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground hidden sm:block">AutoServe</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("#benefits")}
              className="text-foreground hover:text-primary transition-colors text-sm md:text-base"
            >
              How It Works
            </Button>
            <Button
              onClick={() => router.push("/auth/sign-up")}
              className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-4 md:px-6 py-2"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Image Background */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-background via-primary/5 to-background"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />

        <div className="container-responsive relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <p className="text-sm font-semibold text-primary">Professional Vehicle Care</p>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Professional Auto Care, <span className="text-primary">Dispatched in Seconds</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Find trusted mechanics, track repairs in real-time, and manage your vehicle maintenance all in one
                platform. Enterprise-grade vehicle service management for peace of mind.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/auth/sign-up")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                onClick={() => document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" })}
                className="border-2 border-primary/30 text-foreground hover:border-primary/60 bg-transparent px-8 h-14 rounded-lg font-semibold text-lg transition-all hover:bg-primary/5 w-full sm:w-auto"
              >
                Learn More →
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-8 border-t border-primary/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">500+ Verified Mechanics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">99% Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-96 md:h-full rounded-2xl overflow-hidden border border-primary/20 shadow-2xl animate-fade-in-delayed">
            <img src="/professional-mechanic-fixing-car-workshop.jpg" alt="Professional Mechanic" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Problem Section - Car in Distress */}
      <section className="py-20 md:py-28 bg-primary/5 border-y border-primary/20">
        <div className="container-responsive grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Image Left */}
          <div className="relative h-96 md:h-full rounded-2xl overflow-hidden border border-primary/20 shadow-2xl order-2 md:order-1">
            <img src="/car-breakdown-roadside-emergency-distress.jpg" alt="Car in Distress" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>

          {/* Content Right */}
          <div className="space-y-8 order-1 md:order-2 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Your Car Broke Down. Now What?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stress, uncertainty, and expensive repair bills are the old way. With AutoServe, help arrives in minutes
                with transparent pricing and real-time updates.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Instant Response</h4>
                  <p className="text-muted-foreground text-sm">Get matched with nearby mechanics in seconds</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Real-Time Tracking</h4>
                  <p className="text-muted-foreground text-sm">
                    Know exactly where your mechanic is and when they'll arrive
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Transparent Pricing</h4>
                  <p className="text-muted-foreground text-sm">Get upfront quotes with no hidden fees</p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => router.push("/auth/sign-up")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
            >
              Experience the Difference
            </Button>
          </div>
        </div>
      </section>

      {/* Features Carousel Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-responsive space-y-12">
          <div className="max-w-2xl space-y-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Why Choose AutoServe?</h2>
            <p className="text-lg text-muted-foreground">
              Enterprise-grade platform designed for simplicity, reliability, and trust.
            </p>
          </div>

          <div className="relative bg-white rounded-2xl overflow-hidden border border-primary/20 shadow-xl">
            {/* Carousel Container */}
            <div className="relative h-96 md:h-[500px] overflow-hidden">
              {carouselItems.map((item, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    index === carouselIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                >
                  <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex flex-col justify-end p-8 md:p-12">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-lg text-gray-200">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10">
              <div className="flex gap-2">
                {carouselItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCarouselIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === carouselIndex ? "bg-primary w-8" : "bg-primary/40"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)}
                  className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-primary" />
                </button>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselItems.length)}
                  className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-28 bg-primary/5 border-y border-primary/20">
        <div className="container-responsive space-y-12">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Core Benefits</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for seamless vehicle maintenance management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Zap, title: "Fast Dispatch", desc: "Get matched with qualified mechanics in minutes, not hours" },
              {
                icon: Shield,
                title: "Verified & Insured",
                desc: "All mechanics are thoroughly vetted, certified, and fully insured",
              },
              {
                icon: CheckCircle2,
                title: "Real-Time Tracking",
                desc: "Monitor your service from booking to completion with live updates",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-8 border border-primary/10 space-y-4 hover:shadow-lg transition-all hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { number: "500+", label: "Verified Mechanics" },
              { number: "10K+", label: "Active Customers" },
              { number: "99%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-8 border border-primary/10 space-y-2 text-center hover:border-primary/30 transition-all animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary">{stat.number}</div>
                <p className="text-foreground font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-primary/5 border-t border-primary/20">
        <div className="container-responsive">
          <div className="bg-white rounded-2xl p-12 md:p-16 border-2 border-primary space-y-6 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of vehicle owners managing their maintenance on AutoServe. Sign up today for a free trial
              and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/auth/sign-up")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
              >
                Get Started Now
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("#")}
                className="border-2 border-primary text-primary hover:bg-primary/10 px-8 h-14 rounded-lg font-bold text-lg transition-all"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-background">
        <div className="container-responsive py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">⚡</span>
                </div>
                <span className="font-bold text-foreground">AutoServe</span>
              </div>
              <p className="text-sm text-muted-foreground">Professional vehicle care, dispatched in seconds.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition">Features</li>
                <li className="hover:text-primary cursor-pointer transition">Pricing</li>
                <li className="hover:text-primary cursor-pointer transition">Security</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition">About</li>
                <li className="hover:text-primary cursor-pointer transition">Blog</li>
                <li className="hover:text-primary cursor-pointer transition">Careers</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition">Privacy</li>
                <li className="hover:text-primary cursor-pointer transition">Terms</li>
                <li className="hover:text-primary cursor-pointer transition">Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 AutoServe. All rights reserved. Enterprise Vehicle Management Platform.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
