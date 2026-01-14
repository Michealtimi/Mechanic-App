"use client"

import Link from "next/link"
import { ChevronLeft, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PayoutDetailsPage({ params }: { params: { id: string } }) {
  const payout = {
    id: params.id,
    amount: 486,
    status: "PAID",
    depositDate: "Oct 24, 2023",
    transactionId: "TXN-99284-A",
    requestDate: "Oct 23, 2023",
    processingTime: "22 Hours",
    bankAccount: "Chase •••• 4492",
    grossEarnings: 540,
    commission: 54,
    commissionRate: 10,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/mechanic/payout-history" className="text-foreground hover:text-muted-foreground">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payout Details</h1>
        <button className="text-foreground hover:text-muted-foreground">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-success/30 bg-success/10">
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-success font-semibold">{payout.status}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Successfully deposited on {payout.depositDate}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">${payout.amount.toFixed(2)}</h2>
        </div>

        {/* Breakdown Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Breakdown</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">Gross Earnings</span>
              <span className="font-semibold text-foreground">${payout.grossEarnings.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground">Platform Commission ({payout.commissionRate}%)</span>
              <span className="font-semibold text-danger">-${payout.commission.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-foreground font-semibold">Final Payout</span>
              <span className="text-2xl font-bold text-primary">${payout.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Transaction Info</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Transaction ID</p>
              <p className="text-foreground font-semibold">{payout.transactionId}</p>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Request Date</p>
              <p className="text-foreground font-semibold">{payout.requestDate}</p>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Processing Time</p>
              <p className="text-foreground font-semibold">{payout.processingTime}</p>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Bank Account</p>
              <p className="text-foreground font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z" />
                </svg>
                {payout.bankAccount}
              </p>
            </div>
          </div>
        </div>

        {/* Download Receipt */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 sm:h-14 rounded-xl text-base font-semibold">
          <Download className="w-5 h-5 mr-2" />
          Download Receipt (PDF)
        </Button>

        {/* Help Section */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <button className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center justify-center gap-2 mx-auto">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
                clipRule="evenodd"
              />
            </svg>
            Need help with this payment?
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Payments are processed by our secure partner. Processing times may vary depending on your financial
            institution's policies.
          </p>
        </div>
      </div>
    </div>
  )
}
