"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: string
  balance?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "wallet",
    name: "My Wallet",
    description: "Balance: $520.00",
    icon: "wallet",
    balance: "$520.00",
  },
  {
    id: "paystack",
    name: "Paystack",
    description: "Card, Bank Transfer, USSD",
    icon: "card",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Global Payments",
    icon: "bank",
  },
]

export default function CheckoutPage() {
  const [selectedPayment, setSelectedPayment] = useState("wallet")
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to success page
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/booking-summary" className="text-foreground hover:text-muted-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Secure Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">
        {/* Order Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            <span className="px-3 py-1 bg-success/10 text-success text-sm font-bold rounded">ID: #88219</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">Premium Subscription</span>
              <span className="font-semibold text-foreground">$44.00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-semibold text-foreground">$1.00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">Tax (GST)</span>
              <span className="font-semibold text-foreground">$5.00</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-foreground font-bold">Total Amount</span>
              <span className="text-3xl font-bold text-primary">$50.00</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`block p-5 rounded-xl border-2 cursor-pointer transition ${
                  selectedPayment === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-card/80"
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {method.icon === "wallet" && (
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    )}
                    {method.icon === "card" && (
                      <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z" />
                      </svg>
                    )}
                    {method.icon === "bank" && (
                      <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3.5a1 1 0 01-.707-1.707l1.414-1.414a1 1 0 00-1.414-1.414l-1.414 1.414a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 00-1.414 1.414l1.414 1.414A1 1 0 016.5 18H2a1 1 0 110-2V4z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  {selectedPayment === method.id && (
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold text-primary text-sm">256-BIT SSL SECURE ENCRYPTION</p>
            <p className="text-xs text-muted-foreground">
              Your payment data is encrypted and never stored on our servers
            </p>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-primary hover:bg-primary/90 text-white h-12 sm:h-14 rounded-xl text-base sm:text-lg font-semibold"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Pay $50.00 Now
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">Your payment is secure</p>
        </div>
      </div>
    </div>
  )
}
