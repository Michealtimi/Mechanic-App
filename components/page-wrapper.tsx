"use client"

import type React from "react"

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
}

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function PageWrapper({
  children,
  title,
  subtitle,
  showBackButton = true,
  backHref = "/dashboard",
}: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-dark-green text-white">
      {/* Header */}
      {(title || showBackButton) && (
        <div className="bg-dark-green border-b border-green-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            {showBackButton && (
              <Link
                href={backHref}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-green-800 transition-colors text-cyan-500 hover:text-cyan-400"
                aria-label="Go back"
              >
                <ChevronLeft size={24} />
              </Link>
            )}
            <div className="flex-1">
              {title && <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>}
              {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</div>
    </div>
  )
}
