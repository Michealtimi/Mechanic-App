"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: string
  amount: number
  date: string
  method: string
  status: "completed" | "pending" | "rejected"
  transactionId: string
}

const transactions: Transaction[] = [
  {
    id: "1",
    amount: 450,
    date: "Oct 24, 2023",
    method: "Bank Transfer",
    status: "completed",
    transactionId: "#TXN-450-001",
  },
  {
    id: "2",
    amount: 820,
    date: "Oct 22, 2023",
    method: "Bank Transfer",
    status: "pending",
    transactionId: "#TXN-820-002",
  },
  {
    id: "3",
    amount: 320,
    date: "Oct 20, 2023",
    method: "Bank Transfer",
    status: "completed",
    transactionId: "#TXN-320-003",
  },
  {
    id: "4",
    amount: 1100,
    date: "Oct 15, 2023",
    method: "Bank Transfer",
    status: "rejected",
    transactionId: "#TXN-1100-004",
  },
  {
    id: "5",
    amount: 1200,
    date: "Oct 08, 2023",
    method: "Bank Transfer",
    status: "completed",
    transactionId: "#TXN-1200-005",
  },
]

export default function PayoutHistoryPage() {
  const [filterOpen, setFilterOpen] = useState(false)

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success"
      case "pending":
        return "bg-warning/10 text-warning"
      case "rejected":
        return "bg-danger/10 text-danger"
      default:
        return "bg-secondary/10 text-secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center"
    switch (status) {
      case "completed":
        return (
          <div className={`${baseClasses} bg-success/10`}>
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )
      case "pending":
        return (
          <div className={`${baseClasses} bg-warning/10`}>
            <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )
      case "rejected":
        return (
          <div className={`${baseClasses} bg-danger/10`}>
            <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mechanic/dashboard" className="text-foreground hover:text-muted-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payout History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Available Balance */}
          <div className="bg-primary rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white/80">Available Balance</span>
              <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">$1,250.00</h2>
            <p className="text-sm text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Ready for withdrawal
            </p>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-secondary/20 border border-secondary/30 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Lifetime Earnings</p>
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground">$12,400.00</h3>
          </div>
        </div>

        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Link key={tx.id} href={`/mechanic/payout-details/${tx.id}`}>
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center justify-between hover:bg-card/80 transition cursor-pointer group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {getStatusIcon(tx.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">${tx.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.date} • {tx.method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(tx.status)}`}>
                    {tx.status.toUpperCase()}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition transform rotate-180" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Request Payout Button */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 sm:h-14 rounded-xl text-base sm:text-lg font-semibold mt-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          Request Payout
        </Button>
      </div>
    </div>
  )
}
