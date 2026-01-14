"use client"

import { Suspense } from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Search, CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { RoleBasedVisibility } from "@/components/role-based-visibility"
import { useAuth } from "@/lib/auth-context"

function MerchantVerificationContent() {
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "flagged">("pending")
  const [selectedMerchant, setSelectedMerchant] = useState(0)
  const [auditNotes, setAuditNotes] = useState("")

  const merchants = [
    {
      id: "#MERCH-4521",
      name: "AutoTech Solutions",
      appliedDays: "3 days ago",
      status: "pending",
      businessType: "FULL SERVICE SHOP",
      certifications: ["ASE CERTIFIED", "EPA CERTIFIED"],
      documents: [
        { name: "Business_License.pdf", type: "pdf" },
        { name: "Insurance_Certificate.jpg", type: "image" },
      ],
      businessInfo: {
        location: "San Francisco, CA",
        yearsInBusiness: "8",
        employeeCount: "12",
        rating: 4.7,
      },
    },
    {
      id: "#MERCH-4522",
      name: "Elite Mobile Repair",
      appliedDays: "2 days ago",
      status: "pending",
      businessType: "MOBILE MECHANIC",
      certifications: ["ASE MASTER"],
      documents: [{ name: "License.pdf", type: "pdf" }],
      businessInfo: {
        location: "Los Angeles, CA",
        yearsInBusiness: "5",
        employeeCount: "3",
        rating: 4.9,
      },
    },
  ]

  const filteredMerchants = merchants.filter((m) => m.status === activeTab)
  const current = filteredMerchants[selectedMerchant] || merchants[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container-responsive pt-4 pb-4 sm:pt-6 sm:pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Merchant Verification</h1>
          </div>
          <div className="relative w-full sm:w-auto max-w-xs">
            <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search merchants..."
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-input text-foreground rounded-lg text-sm placeholder:text-muted-foreground border border-border"
            />
          </div>
        </div>
      </div>

      <div className="container-responsive py-6 sm:py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 border-b border-border overflow-x-auto">
          {[
            { id: "pending", label: "Pending", count: 12 },
            { id: "verified", label: "Verified", count: 245 },
            { id: "flagged", label: "Flagged", count: 3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                setSelectedMerchant(0)
              }}
              className={`px-3 sm:px-4 py-3 text-sm sm:text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-muted text-foreground px-2 py-1 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Merchant List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-foreground mb-4">Review Queue</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMerchants.map((merchant, idx) => (
                <button
                  key={merchant.id}
                  onClick={() => setSelectedMerchant(idx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedMerchant === idx
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate text-sm sm:text-base">{merchant.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{merchant.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">{merchant.appliedDays}</p>
                    </div>
                    <Badge
                      variant={merchant.status === "pending" ? "default" : "secondary"}
                      className="text-xs whitespace-nowrap"
                    >
                      {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2 space-y-6">
            {current && (
              <>
                {/* Merchant Card */}
                <Card className="p-4 sm:p-6 border-2 border-primary">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">{current.name}</h3>
                      <p className="text-sm text-muted-foreground">{current.id}</p>
                    </div>
                    <Badge className="text-sm bg-status-warning text-foreground">{current.businessType}</Badge>
                  </div>

                  {/* Business Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 py-4 border-y border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">LOCATION</p>
                      <p className="font-semibold text-foreground text-sm">{current.businessInfo.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">YEARS IN BUSINESS</p>
                      <p className="font-semibold text-foreground text-sm">{current.businessInfo.yearsInBusiness}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">EMPLOYEES</p>
                      <p className="font-semibold text-foreground text-sm">{current.businessInfo.employeeCount}</p>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">CERTIFICATIONS</p>
                    <div className="flex flex-wrap gap-2">
                      {current.certifications.map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Documents */}
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Verification Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {current.documents.map((doc) => (
                      <div
                        key={doc.name}
                        className="p-3 bg-muted rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{doc.type}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Audit Notes */}
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold text-foreground mb-4">Audit Trail Notes</h4>
                  <textarea
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="Enter reason for approval or rejection..."
                    className="w-full p-3 bg-input text-foreground rounded-lg border border-border placeholder:text-muted-foreground text-sm resize-none h-24"
                  />
                </Card>

                {/* Action Buttons - Only visible to admins */}
                <RoleBasedVisibility allowedRoles={["admin"]}>
                  <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-transparent"
                      onClick={async () => {
                        try {
                          // TODO: Call API to reject merchant
                          const { api } = await import("@/lib/api-client")
                          // await api.admin.rejectMerchant(current.id, auditNotes)
                          alert("Merchant rejected")
                          setSelectedMerchant(0)
                          setAuditNotes("")
                        } catch (error) {
                          console.error("Error rejecting merchant:", error)
                        }
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Reject</span>
                    </Button>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      onClick={async () => {
                        try {
                          // TODO: Call API to approve merchant
                          const { api } = await import("@/lib/api-client")
                          // await api.admin.approveMerchant(current.id, auditNotes)
                          alert("Merchant approved")
                          setSelectedMerchant(0)
                          setAuditNotes("")
                        } catch (error) {
                          console.error("Error approving merchant:", error)
                        }
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Approve Merchant</span>
                      <span className="sm:hidden">Approve</span>
                    </Button>
                  </div>
                </RoleBasedVisibility>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MerchantVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MerchantVerificationContent />
    </Suspense>
  )
}
