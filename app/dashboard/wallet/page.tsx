"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, MoreVertical, ChevronLeft, TrendingUp, Send } from "lucide-react"

const TRANSACTIONS = [
  {
    id: 1,
    type: "credit",
    amount: 450,
    method: "Bank Transfer",
    date: "Oct 24, 2023",
    status: "COMPLETED",
    icon: "🏦",
  },
  {
    id: 2,
    type: "debit",
    amount: 820,
    method: "Service Payment",
    date: "Oct 22, 2023",
    status: "PENDING",
    icon: "⏳",
  },
  {
    id: 3,
    type: "credit",
    amount: 320,
    method: "Deposit",
    date: "Oct 20, 2023",
    status: "COMPLETED",
    icon: "✅",
  },
  {
    id: 4,
    type: "debit",
    amount: 1100,
    method: "Withdrawal",
    date: "Oct 15, 2023",
    status: "REJECTED",
    icon: "❌",
  },
  {
    id: 5,
    type: "credit",
    amount: 1200,
    method: "Service Earnings",
    date: "Oct 08, 2023",
    status: "COMPLETED",
    icon: "💰",
  },
]

export default function WalletPage() {
  const [balance] = useState(1250)
  const [lifetimeEarnings] = useState(12400)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border border-red-500/40"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-dark-green pb-28 lg:pb-8">
      <div className="bg-dark-green border-b border-green-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-green-800 transition-colors text-cyan-500 hover:text-cyan-400"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold text-white">My Wallet</h1>
          </div>
          <button className="text-gray-400 hover:text-cyan-500 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-green-900/40 rounded-lg p-8 border-2 border-cyan-500/30">
          <p className="text-cyan-400 text-xs uppercase tracking-wider mb-3 font-semibold">Available Balance</p>
          <h2 className="text-5xl font-bold text-white mb-4">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-gray-300 text-sm">Ready for withdrawal</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="bg-cyan-500 hover:bg-cyan-400 text-dark-green font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-3">
            <Plus size={20} />
            Top Up
          </button>
          <button className="bg-green-800 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors border border-cyan-500/30 flex items-center justify-center gap-3">
            <Send size={20} />
            Withdraw
          </button>
        </div>

        {/* Lifetime Earnings Card */}
        <div className="bg-green-900/40 rounded-lg p-6 border border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Lifetime Earnings</p>
              <h3 className="text-3xl font-bold text-white mt-2">${lifetimeEarnings.toLocaleString("en-US")}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-500" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            <a href="#" className="text-cyan-500 hover:text-cyan-400 text-sm font-medium">
              See All
            </a>
          </div>

          <div className="space-y-3">
            {TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="bg-green-900/40 rounded-lg p-4 border border-green-800 hover:border-cyan-500/30 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-lg">
                  {tx.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">{tx.method}</h4>
                  <p className="text-gray-400 text-xs">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === "credit" ? "text-cyan-400" : "text-white"}`}>
                    {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs mt-1 ${getStatusColor(tx.status)}`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
