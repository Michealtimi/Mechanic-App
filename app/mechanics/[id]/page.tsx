"use client"
import { Star, MapPin, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
  service: string
}

const reviews: Review[] = [
  {
    id: "1",
    author: "Jason K.",
    rating: 5,
    text: '"Marcus is the only person I trust with my Model 3. Fixed my battery coolant issue same day. Absolute pro."',
    date: "2 days ago",
    service: "Model 3 Service",
  },
  {
    id: "2",
    author: "Sarah L.",
    rating: 5,
    text: '"Honest pricing and very knowledgeable about EV regenerative braking systems. Highly recommend."',
    date: "1 week ago",
    service: "Brake Service",
  },
]

export default function MechanicProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/20 to-background pt-6 sm:pt-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          {/* Profile Image */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-primary bg-gradient-to-br from-primary to-primary/50 relative">
              {/* Placeholder for mechanic image */}
              <div className="w-full h-full rounded-full bg-secondary/10 flex items-center justify-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-success rounded-full border-2 border-background"></div>
          </div>

          {/* Name & Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Marcus Rivera</h1>
            <p className="text-muted-foreground">Senior Master Technician</p>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>San Francisco, CA</span>
          </div>

          {/* Badge */}
          <button className="mx-auto px-4 py-2 bg-primary text-white rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 hover:bg-primary/90">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                clipRule="evenodd"
              />
            </svg>
            EV SPECIALIST
          </button>

          <p className="text-xs uppercase font-semibold text-primary">CERTIFIED HIGH VOLTAGE TECH</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Rating</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl sm:text-2xl font-bold text-foreground">4.9</span>
              <Star className="w-4 h-4 fill-warning text-warning" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Experience</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">12 yrs</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Jobs</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">1.4k+</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-6 max-w-2xl mx-auto space-y-6">
        {/* Specializations */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {["Tesla Repair", "Rivian Tech", "Battery Diagnostics", "Software Calibration", "Hybrid Systems"].map(
              (spec) => (
                <span key={spec} className="px-3 py-2 bg-secondary/20 text-foreground rounded-full text-sm font-medium">
                  {spec}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Verified Certifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">Verified Certs</h3>
            <button className="text-primary text-sm font-medium hover:text-primary/80">View all</button>
          </div>
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Tesla Tier 3 Advanced</p>
                <p className="text-sm text-muted-foreground">High Voltage Safety Certified</p>
              </div>
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Book Appointment Button */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 sm:h-14 rounded-xl text-base font-semibold">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
          </svg>
          Book Appointment
        </Button>

        {/* Reviews */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{review.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-foreground italic">{review.text}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{review.date}</span>
                  <span className="text-muted-foreground">• {review.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
