"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRealtime } from "@/lib/realtime-context"
import MatchingAnimation from "./matching-animation"
import JobRequestModal from "./job-request-modal"

interface JobMatchingFlowProps {
  searchData: {
    vehicleId?: string
    services: string[]
    location: {
      lat: number
      lng: number
      address: string
    }
    urgency?: 'standard' | 'urgent' | 'emergency'
  }
  onMatchFound?: (jobId: string) => void
  onCancel?: () => void
}

/**
 * Handles the complete job matching flow:
 * 1. Shows matching animation
 * 2. Triggers real-time search
 * 3. Shows job request modal when matched
 */
export default function JobMatchingFlow({ searchData, onMatchFound, onCancel }: JobMatchingFlowProps) {
  const { searchForMechanic, jobStatus, currentJob } = useRealtime()
  const [isSearching, setIsSearching] = useState(false)
  const [showJobModal, setShowJobModal] = useState(false)

  useEffect(() => {
    // Start search when component mounts
    const startSearch = async () => {
      setIsSearching(true)
      await searchForMechanic(searchData)
    }

    startSearch()
  }, []) // Only run once on mount

  useEffect(() => {
    // Handle job status changes
    if (jobStatus === 'matched' || jobStatus === 'accepted') {
      setIsSearching(false)
      if (currentJob) {
        setShowJobModal(true)
        onMatchFound?.(currentJob.id)
      }
    } else if (jobStatus === 'idle' && !isSearching) {
      // Search completed without match (timeout or error)
      setIsSearching(false)
    }
  }, [jobStatus, currentJob, isSearching, onMatchFound])

  const handleJobModalClose = () => {
    setShowJobModal(false)
    onCancel?.()
  }

  return (
    <>
      {/* Matching Animation */}
      <MatchingAnimation 
        isSearching={isSearching} 
        message={jobStatus === 'searching' ? "Searching for mechanics..." : "Connecting with mechanic..."}
      />

      {/* Job Request Modal - shown when match is found */}
      {showJobModal && currentJob && (
        <JobRequestModal onClose={handleJobModalClose} />
      )}
    </>
  )
}
